import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { SessionsRepository } from "@/modules/sessions/sessions.repository";
import { TokenService } from "@/modules/crypto/token.service";
import { env } from "@/config/env";
import { createHash, randomUUID } from "crypto";
import * as bcrypt from "bcrypt";

import { AuthAuditLogService } from "@/modules/auth/audit/auth-audit-log-service";
import { AUDIT } from "@/modules/auth/audit/audit.actions";
import { SessionTyp } from "@/modules/sessions/sessions.repository";

function sha256(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

type ReqMeta = { ip?: string | null; userAgent?: string | null };

@Injectable()
export class AdminAuthService {
  private readonly MAX_ACTIVE_SESSIONS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionsRepo: SessionsRepository,
    private readonly tokenService: TokenService,
    private readonly audit: AuthAuditLogService
  ) {}

  private async enforceSessionLimit(tenantId: string, identityId: string) {
    const active = await this.sessionsRepo.listActiveByIdentity({
      tenantId,
      identityId,
      take: 50,
      typ: "admin",
    });

    if (active.length <= this.MAX_ACTIVE_SESSIONS) return;

    const overflow = active.slice(0, active.length - this.MAX_ACTIVE_SESSIONS);
    const ids = overflow.map((s: { id: string }) => s.id);
    await this.sessionsRepo.revokeMany(ids);
  }

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
        userId: true,
      },
    });

    if (!identity?.passwordHash || !identity.userId) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const ok = await bcrypt.compare(password, identity.passwordHash);
    if (!ok) {
      await this.audit.log(identity.tenantId, {
        action: AUDIT.ADMIN_LOGIN_FAIL,
        actorIdentityId: identity.id,
        success: false,
        reason: "INVALID_PASSWORD",
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
        meta: { typ: "admin", email },
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    const refreshRaw = this.tokenService.newRefreshToken();
    const tokenHash = sha256(refreshRaw);
    const expiresAt = new Date(
      Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
    );

    const familyId = randomUUID(); // her login -> yeni family

    await this.sessionsRepo.create({
      tenantId: identity.tenantId,
      identityId: identity.id,
      tokenHash,
      expiresAt,
      typ: "admin",
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
        typ: "admin",
      },
      env.ACCESS_TOKEN_TTL_SECONDS
    );

    await this.audit.log(identity.tenantId, {
      action: AUDIT.ADMIN_LOGIN_SUCCESS,
      actorIdentityId: identity.id,
      success: true,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      meta: { typ: "admin", email, familyId },
    });

    return { accessToken, refreshRaw };
  }

  async refresh(refreshRaw: string, meta: ReqMeta = {}) {
    const tokenHash = sha256(refreshRaw);

    // revoked dahil çekiyoruz
    const session = await this.sessionsRepo.findAnyByTokenHash({
      tokenHash,
      typ: "admin",
    });
    if (!session) throw new UnauthorizedException("Invalid session");

    // REUSE DETECTED -> GLOBAL REVOKE
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
          typ: "admin",
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
      tenantId: session.tenantId,
      identityId: session.identityId,
      typ: session.typ as any, // aşağıda typ cast’ini de düzeltiyoruz
      familyId: session.familyId,
      oldTokenHash: session.tokenHash,
      newTokenHash: tokenHash,
      newExpiresAt,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    });

    const accessToken = this.tokenService.signAccessToken(
      {
        sub: session.identityId,
        tenantId: session.tenantId,
        typ: "admin",
      },
      env.ACCESS_TOKEN_TTL_SECONDS
    );

    await this.audit.log(session.tenantId, {
      action: AUDIT.SESSION_REFRESH,
      actorIdentityId: session.identityId,
      success: true,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      meta: { typ: "admin", sessionId: session.id, familyId: session.familyId },
    });

    return { accessToken, refreshRaw: newRefreshRaw };
  }

  async logoutAll(identityId: string, tenantId: string) {
    await this.sessionsRepo.revokeAllByIdentity({
      tenantId,
      identityId,
      typ: "admin" as SessionTyp,
    });

    return { ok: true };
  }

  async me(identityId: string, tenantId: string) {
    const identity = await this.prisma.authIdentity.findFirst({
      where: { id: identityId, tenantId },
      select: {
        id: true,
        tenantId: true,
        provider: true,
        providerId: true,
        userId: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });

    if (!identity) throw new UnauthorizedException("Identity not found");

    return {
      identityId: identity.id,
      tenantId: identity.tenantId,
      typ: "admin" as const,
      user: {
        id: identity.user?.id ?? identity.userId ?? null,
        email: identity.user?.email ?? identity.providerId,
        name: identity.user?.name ?? null,
        roles: [],
        permissions: [],
      },
    };
  }

  async logout(refreshRaw: string, meta: ReqMeta = {}) {
    const tokenHash = sha256(refreshRaw);

    const session = await this.sessionsRepo.findValidByTokenHash({
      tokenHash,
      typ: "admin",
    });

    if (!session) return;

    await this.sessionsRepo.revoke(session.id);

    await this.audit.log(session.tenantId, {
      action: AUDIT.ADMIN_LOGOUT,
      actorIdentityId: session.identityId,
      success: true,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      meta: { typ: "admin", sessionId: session.id },
    });
  }
}
