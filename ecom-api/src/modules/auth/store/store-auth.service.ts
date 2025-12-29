import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { SessionsRepository } from "@/modules/sessions/sessions.repository";
import { TokenService } from "@/modules/crypto/token.service";
import { env } from "@/config/env";
import { createHash, randomUUID } from "crypto";
import * as bcrypt from "bcrypt";

import { ActiveTenantService } from "@/infrastructure/tenant-bootstrap/active-tenant.service";

import { AuthAuditLogService } from "@/modules/auth/audit/auth-audit-log-service";
import { AUDIT } from "@/modules/auth/audit/audit.actions";

function sha256(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

type ReqMeta = { ip?: string | null; userAgent?: string | null };

@Injectable()
export class StoreAuthService {
  private readonly MAX_ACTIVE_SESSIONS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionsRepo: SessionsRepository,
    private readonly tokenService: TokenService,
    private readonly activeTenant: ActiveTenantService,
    private readonly audit: AuthAuditLogService
  ) {}

  private async enforceSessionLimit(tenantId: string, identityId: string) {
    const active = await this.sessionsRepo.listActiveByIdentity({
      tenantId,
      identityId,
      typ: "store",
    });

    if (active.length <= this.MAX_ACTIVE_SESSIONS) return;

    const overflow = active.slice(0, active.length - this.MAX_ACTIVE_SESSIONS);
    const ids = overflow.map((s: { id: string }) => s.id);
    await this.sessionsRepo.revokeMany(ids);
  }

  // Register (customer + identity)
  async register(
    input: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    },
    meta: ReqMeta = {}
  ) {
    const tenantId = await this.activeTenant.getTenantId();
    const email = input.email.trim().toLowerCase();

    const exists = await this.prisma.customer.findFirst({
      where: { tenantId, email },
      select: { id: true },
    });
    if (exists) {
      await this.audit.log(tenantId, {
        action: AUDIT.STORE_REGISTER,
        success: false,
        reason: "EMAIL_ALREADY_REGISTERED",
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
        meta: { typ: "store", email },
      });
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const created = await this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          tenantId,
          email,
          firstName: input.firstName,
          lastName: input.lastName,
          metadata: {},
        },
        select: { id: true, tenantId: true, email: true },
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
        select: { id: true, tenantId: true },
      });

      return { customer, identity };
    });

    const refreshRaw = this.tokenService.newRefreshToken();
    const tokenHash = sha256(refreshRaw);
    const expiresAt = new Date(
      Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
    );

    const familyId = randomUUID();

    await this.sessionsRepo.create({
      tenantId: created.identity.tenantId,
      identityId: created.identity.id,
      tokenHash,
      expiresAt,
      typ: "store",
      familyId,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      lastUsedAt: new Date(),
    });

    await this.enforceSessionLimit(
      created.identity.tenantId,
      created.identity.id
    );

    const accessToken = this.tokenService.signAccessToken(
      {
        sub: created.identity.id,
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
      meta: { typ: "store", email, familyId },
    });

    return { accessToken, refreshRaw };
  }

  // Login
  async login(email: string, password: string, meta: ReqMeta = {}) {
    const identity = await this.prisma.authIdentity.findFirst({
      where: {
        provider: "EMAIL_PASSWORD",
        providerId: { equals: email, mode: "insensitive" },
      },
      select: {
        id: true,
        tenantId: true,
        passwordHash: true,
        customerId: true,
      },
    });

    if (!identity?.passwordHash) {
      // tenantId yoksa audit yazamayız (tenant zorunlu). Burayı “tenant resolver” ile iyileştiririz.
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!identity.customerId) {
      await this.audit.log(identity.tenantId, {
        action: AUDIT.STORE_LOGIN_FAIL,
        actorIdentityId: identity.id,
        success: false,
        reason: "NOT_A_STORE_IDENTITY",
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
        meta: { typ: "store", email },
      });
      throw new UnauthorizedException("Invalid store credentials");
    }

    const ok = await bcrypt.compare(password, identity.passwordHash);
    if (!ok) {
      await this.audit.log(identity.tenantId, {
        action: AUDIT.STORE_LOGIN_FAIL,
        actorIdentityId: identity.id,
        success: false,
        reason: "INVALID_PASSWORD",
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
        meta: { typ: "store", email },
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    const refreshRaw = this.tokenService.newRefreshToken();
    const tokenHash = sha256(refreshRaw);
    const expiresAt = new Date(
      Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
    );

    const familyId = randomUUID();

    await this.sessionsRepo.create({
      tenantId: identity.tenantId,
      identityId: identity.id,
      tokenHash,
      expiresAt,
      typ: "store",
      familyId,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      lastUsedAt: new Date(),
    });

    await this.enforceSessionLimit(identity.tenantId, identity.id);

    const accessToken = this.tokenService.signAccessToken(
      {
        sub: identity.id,
        tenantId: identity.tenantId,
        typ: "store",
      },
      env.ACCESS_TOKEN_TTL_SECONDS
    );

    await this.audit.log(identity.tenantId, {
      action: AUDIT.STORE_LOGIN_SUCCESS,
      actorIdentityId: identity.id,
      success: true,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      meta: { typ: "store", email, familyId },
    });

    return { accessToken, refreshRaw };
  }

  // Refresh with reuse detection + global revoke
  async refresh(refreshRaw: string, meta: ReqMeta = {}) {
    const tokenHash = sha256(refreshRaw);

    const session = await this.sessionsRepo.findByTokenHash({
      tokenHash,
      typ: "store",
    });
    if (!session) {
      throw new UnauthorizedException("Invalid session");
    }

    // reuse -> global revoke
    if (session.revokedAt) {
      await this.sessionsRepo.markReuse(session.id);
      await this.sessionsRepo.revokeAllByIdentity({
        tenantId: session.tenantId,
        identityId: session.identityId,
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
          triggerTokenHash: session.tokenHash,
          familyId: session.familyId,
        },
      });

      throw new UnauthorizedException("Refresh reuse detected");
    }

    // expired
    if (session.expiresAt.getTime() <= Date.now()) {
      await this.sessionsRepo.revoke(session.id);
      throw new UnauthorizedException("Session expired");
    }

    const newRefreshRaw = this.tokenService.newRefreshToken();
    const newHash = sha256(newRefreshRaw);
    const newExpiresAt = new Date(
      Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
    );

    await this.sessionsRepo.rotate({
      sessionId: session.id,
      newTokenHash: newHash,
      newExpiresAt,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    });

    const accessToken = this.tokenService.signAccessToken(
      {
        sub: session.identityId,
        tenantId: session.tenantId,
        typ: "store",
      },
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

  // Logout
  async logout(refreshRaw: string, meta: ReqMeta = {}) {
    const tokenHash = sha256(refreshRaw);

    const session = await this.sessionsRepo.findValidByTokenHash({
      tokenHash,
      typ: "store",
    });
    if (!session) return;

    await this.sessionsRepo.revoke(session.id);

    await this.audit.log(session.tenantId, {
      action: AUDIT.STORE_LOGOUT,
      actorIdentityId: session.identityId,
      success: true,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      meta: { typ: "store", sessionId: session.id },
    });
  }

  // Logout all sessions for this identity (global revoke)
  async logoutAll(identityId: string, tenantId: string) {
    await this.sessionsRepo.revokeAllByIdentity({ tenantId, identityId });

    await this.audit.log(tenantId, {
      action: AUDIT.STORE_LOGOUT_ALL,
      actorIdentityId: identityId,
      success: true,
      meta: { typ: "store" },
    });

    return { ok: true };
  }
}
