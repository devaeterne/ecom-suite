import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { env } from "@/config/env";
import { TokenService } from "@/infrastructure/security/token.service";
import {
  SessionsRepository,
  SessionTyp,
} from "@/modules/sessions/common/prisma/sessions.repo";
import { randomUUID, createHash } from "crypto";
import * as bcrypt from "bcrypt";

import { AuthAuditLogService } from "@/modules/auth/audit/auth-audit-log-service";
import { AUDIT } from "@/modules/auth/audit/audit.actions";
import { StoreRegisterDto } from "@/modules/auth/store/common/dto/store-register.dto";

export type ReqMeta = { ip?: string | null; userAgent?: string | null };

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

@Injectable()
export class StoreAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly sessionsRepo: SessionsRepository,
    private readonly audit: AuthAuditLogService
  ) {}

  private async enforceSessionLimit(tenantId: string, identityId: string) {
    const max = Number(env.SESSIONS_MAX_ACTIVE ?? 25);
    if (!Number.isFinite(max) || max <= 0) return;

    const active = await this.sessionsRepo.listActiveByIdentity({
      tenantId,
      identityId,
      typ: "store",
      take: max + 10,
      orderBy: "desc",
    });

    if (active.length <= max) return;

    // en yeniler desc geliyor; max'ten sonrasını revoke et
    const toRevoke = active.slice(max).map((s) => s.id);
    await this.sessionsRepo.revokeMany(toRevoke);
  }

  /**
   * Store register: tenantId controller’dan gelir (ActiveTenantService).
   * AuthIdentity + Customer tenant-scoped.
   */
  async register(tenantId: string, dto: StoreRegisterDto, meta: ReqMeta = {}) {
    const email = dto.email.toLowerCase().trim();

    // aynı tenant içinde email tekrarını engelle
    const exists = await this.prisma.authIdentity.findFirst({
      where: {
        tenantId,
        provider: "EMAIL_PASSWORD",
        providerId: { equals: email, mode: "insensitive" },
      },
      select: { id: true },
    });

    if (exists) {
      throw new ConflictException("Email already used");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = await this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          tenantId,
          email,
          firstName: dto.firstName ?? null,
          lastName: dto.lastName ?? null,
        },
      });

      const identity = await tx.authIdentity.create({
        data: {
          tenantId,
          provider: "EMAIL_PASSWORD",
          providerId: email,
          customerId: customer.id,
          passwordHash,
          passwordAlgo: "bcrypt",
          passwordUpdatedAt: new Date(),
        },
      });

      return { customer, identity };
    });

    const expiresAt = new Date(
      Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
    );
    const familyId = randomUUID();

    const { rawToken: refreshRaw } =
      await this.sessionsRepo.createWithGeneratedToken({
        tenantId: created.identity.tenantId,
        identityId: created.identity.id,
        expiresAt,
        typ: "store",
        familyId,
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
      });

    await this.enforceSessionLimit(
      created.identity.tenantId,
      created.identity.id
    );

    const accessToken = this.tokenService.signAccessToken(
      {
        sub: created.customer.id,
        tenantId: created.identity.tenantId,
        typ: "store",
      },
      env.ACCESS_TOKEN_TTL_SECONDS
    );

    await this.audit.log(created.identity.tenantId, {
      action: AUDIT.STORE_REGISTER,
      actorIdentityId: created.identity.id,
      success: true,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      meta: { typ: "store" },
    });

    return { accessToken, refreshRaw };
  }

  async login(
    tenantId: string,
    email: string,
    password: string,
    meta: ReqMeta = {}
  ) {
    const normalizedEmail = email.toLowerCase().trim();

    const identity = await this.prisma.authIdentity.findFirst({
      where: {
        tenantId,
        provider: "EMAIL_PASSWORD",
        providerId: { equals: normalizedEmail, mode: "insensitive" },
      },
      select: {
        id: true,
        tenantId: true,
        passwordHash: true,
        customerId: true,
      },
    });

    if (!identity?.passwordHash || !identity.customerId) {
      await this.audit.log(tenantId, {
        action: AUDIT.STORE_LOGIN_FAIL,
        success: false,
        reason: "INVALID_CREDENTIALS",
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
        meta: { typ: "store", email: normalizedEmail },
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    const ok = await bcrypt.compare(password, identity.passwordHash);
    if (!ok) {
      await this.audit.log(tenantId, {
        action: AUDIT.STORE_LOGIN_FAIL,
        actorIdentityId: identity.id,
        success: false,
        reason: "INVALID_PASSWORD",
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
        meta: { typ: "store", email: normalizedEmail },
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    const expiresAt = new Date(
      Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
    );
    const familyId = randomUUID();

    const { rawToken: refreshRaw } =
      await this.sessionsRepo.createWithGeneratedToken({
        tenantId: identity.tenantId,
        identityId: identity.id,
        expiresAt,
        typ: "store",
        familyId,
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
      });

    await this.enforceSessionLimit(identity.tenantId, identity.id);

    const accessToken = this.tokenService.signAccessToken(
      { sub: identity.customerId, tenantId: identity.tenantId, typ: "store" },
      env.ACCESS_TOKEN_TTL_SECONDS
    );

    await this.audit.log(identity.tenantId, {
      action: AUDIT.STORE_LOGIN_SUCCESS,
      actorIdentityId: identity.id,
      success: true,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      meta: { typ: "store" },
    });

    return { accessToken, refreshRaw };
  }

  async refresh(refreshRaw: string, meta: ReqMeta = {}) {
    const tokenHash = sha256(refreshRaw);

    const session = await this.sessionsRepo.findAnyByTokenHash({
      tokenHash,
      typ: "store",
    });
    if (!session) throw new UnauthorizedException("Invalid session");

    if (session.revokedAt) {
      await this.sessionsRepo.markReuse(session.id);
      await this.sessionsRepo.revokeAllByIdentity({
        tenantId: session.tenantId,
        identityId: session.identityId,
        typ: session.typ as SessionTyp,
      });

      await this.audit.log(session.tenantId, {
        action: AUDIT.SESSION_REUSE_DETECTED,
        actorIdentityId: session.identityId,
        success: false,
        reason: "REUSED_REFRESH",
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
        meta: {
          typ: "store",
          triggerSessionId: session.id,
          familyId: session.familyId,
        },
      });

      throw new UnauthorizedException("Session reuse detected");
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.sessionsRepo.revoke(session.id);
      throw new UnauthorizedException("Session expired");
    }

    // ✅ Fetch the customerId from the identity
    const identity = await this.prisma.authIdentity.findUnique({
      where: { id: session.identityId },
      select: { customerId: true },
    });

    if (!identity?.customerId) {
      throw new UnauthorizedException("Invalid session - no customer");
    }

    const newExpiresAt = new Date(
      Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
    );

    const { rawToken: newRefreshRaw } =
      await this.sessionsRepo.rotateWithGeneratedToken({
        sessionId: session.id,
        tenantId: session.tenantId,
        identityId: session.identityId,
        typ: "store",
        familyId: session.familyId,
        oldTokenHash: session.tokenHash,
        newExpiresAt,
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
      });

    // ✅ Use customerId instead of familyId
    const accessToken = this.tokenService.signAccessToken(
      { sub: identity.customerId, tenantId: session.tenantId, typ: "store" },
      env.ACCESS_TOKEN_TTL_SECONDS
    );

    await this.audit.log(session.tenantId, {
      action: AUDIT.SESSION_REFRESH,
      actorIdentityId: session.identityId,
      success: true,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      meta: { typ: "store", sessionId: session.id, familyId: session.familyId },
    });

    return { accessToken, refreshRaw: newRefreshRaw };
  }

  async logout(refreshRaw: string, meta: ReqMeta = {}) {
    const tokenHash = sha256(refreshRaw);

    const session = await this.sessionsRepo.findValidByTokenHash({
      tokenHash,
      typ: "store",
    });
    if (!session) return { ok: true };

    await this.sessionsRepo.revoke(session.id);

    await this.audit.log(session.tenantId, {
      action: AUDIT.STORE_LOGOUT,
      actorIdentityId: session.identityId,
      success: true,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      meta: { typ: "store", sessionId: session.id },
    });

    return { ok: true };
  }

  async logoutAll(identityId: string, tenantId: string, meta: ReqMeta = {}) {
    await this.sessionsRepo.revokeAllByIdentity({
      tenantId,
      identityId,
      typ: "store",
    });

    await this.audit.log(tenantId, {
      action: AUDIT.STORE_LOGOUT_ALL,
      actorIdentityId: identityId,
      success: true,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      meta: { typ: "store" },
    });

    return { ok: true };
  }

  async me(customerId: string, tenantId: string) {
    const identity = await this.prisma.authIdentity.findFirst({
      where: { customerId, tenantId }, // ← customerId ile ara
      include: { customer: true },
    });
    if (!identity) throw new UnauthorizedException("Invalid identity");

    return {
      identityId: identity.id,
      tenantId: identity.tenantId,
      typ: "store" as const,
      customer: identity.customer,
    };
  }
}
