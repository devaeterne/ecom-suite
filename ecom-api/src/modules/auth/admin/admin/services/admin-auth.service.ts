// src/modules/auth/admin/admin/services/admin-auth.service.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  SessionsRepository,
  SessionTyp,
} from "@/modules/sessions/common/prisma/sessions.repo";
import { TokenService } from "@/infrastructure/security/token.service";
import { env } from "@/config/env";
import { createHash, randomUUID } from "crypto";
import * as bcrypt from "bcrypt";

import { AuthAuditLogService } from "@/modules/auth/audit/auth-audit-log-service";
import { AUDIT } from "@/modules/auth/audit/audit.actions";
import {
  ADMIN_AUTH_LIMITS,
  ADMIN_AUTH_ERRORS,
} from "@/modules/auth/admin/common/constants/admin-auth.constants";

type ReqMeta = { ip?: string | null; userAgent?: string | null };
type LoginResult = { accessToken: string; refreshRaw: string };

function sha256(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionsRepo: SessionsRepository,
    private readonly tokenService: TokenService,
    private readonly audit: AuthAuditLogService,
  ) {}

  private async enforceSessionLimit(tenantId: string, identityId: string) {
    const active = await this.sessionsRepo.listActiveByIdentity({
      tenantId,
      identityId,
      typ: "admin",
      take: 50,
      orderBy: "desc",
    });

    if (active.length <= ADMIN_AUTH_LIMITS.MAX_ACTIVE_SESSIONS) return;

    const overflow = active.slice(ADMIN_AUTH_LIMITS.MAX_ACTIVE_SESSIONS);
    await this.sessionsRepo.revokeMany(overflow.map((s) => s.id));
  }

  async login(
    tenantId: string,
    email: string,
    password: string,
    meta: ReqMeta = {},
  ): Promise<LoginResult> {
    const identity = await this.prisma.authIdentity.findFirst({
      where: {
        tenantId,
        provider: "EMAIL_PASSWORD",
        providerId: { equals: email, mode: "insensitive" },
      },
      select: { id: true, tenantId: true, passwordHash: true, userId: true },
    });

    if (!identity?.passwordHash) {
      throw new UnauthorizedException(ADMIN_AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const ok = await bcrypt.compare(password, identity.passwordHash);
    if (!ok) {
      await this.audit.log(identity?.tenantId ?? tenantId, {
        action: AUDIT.ADMIN_LOGIN_FAIL,
        actorIdentityId: identity?.id ?? null,
        success: false,
        reason: "INVALID_PASSWORD",
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
        meta: { typ: "admin", email: email.toLowerCase() },
      });
      throw new UnauthorizedException(ADMIN_AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const expiresAt = new Date(
      Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
    const familyId = randomUUID();

    const { rawToken: refreshRaw } =
      await this.sessionsRepo.createWithGeneratedToken({
        tenantId: identity.tenantId,
        identityId: identity.id,
        expiresAt,
        typ: "admin",
        familyId,
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
      });

    await this.enforceSessionLimit(identity.tenantId, identity.id);

    const accessToken = this.tokenService.signAccessToken(
      {
        sub: identity.id,
        tenantId: identity.tenantId,
        typ: "admin",
        identityId: identity.id,
      },
      env.ACCESS_TOKEN_TTL_SECONDS,
    );

    await this.audit.log(identity.tenantId, {
      action: AUDIT.ADMIN_LOGIN_SUCCESS,
      actorIdentityId: identity.id,
      success: true,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      meta: { typ: "admin", email: email.toLowerCase(), familyId },
    });

    return { accessToken, refreshRaw };
  }

  async refresh(refreshRaw: string, meta: ReqMeta = {}) {
    const tokenHash = sha256(refreshRaw);

    const session = await this.sessionsRepo.findAnyByTokenHash({
      tokenHash,
      typ: "admin",
    });
    if (!session) {
      throw new UnauthorizedException(ADMIN_AUTH_ERRORS.SESSION_INVALID);
    }

    /**
     * revokedAt varsa:
     * - bu bazen "gerçek reuse" (token çalındı) olabilir
     * - bazen de "paralel refresh" (stale request) olabilir
     *
     * rotatedToHash + yakın zamanda revoke => paralel refresh toleransı
     */
    if (session.revokedAt) {
      const rotatedToHash = (session as any).rotatedToHash as
        | string
        | null
        | undefined;
      const revokedAtMs = session.revokedAt?.getTime?.() ?? 0;
      const recentlyRotated = revokedAtMs && Date.now() - revokedAtMs < 10_000; // 10s window

      if (rotatedToHash && recentlyRotated) {
        // Concurrency / late request: hard revoke yok.
        await this.audit.log(session.tenantId, {
          action: AUDIT.SESSION_REFRESH, // veya ayrı bir action istersen: SESSION_REFRESH_STALE
          actorIdentityId: session.identityId,
          success: false,
          reason: "STALE_REFRESH_AFTER_ROTATE",
          ip: meta.ip ?? null,
          userAgent: meta.userAgent ?? null,
          meta: {
            typ: "admin",
            sessionId: session.id,
            familyId: session.familyId,
            rotatedToHash,
          },
        });

        throw new UnauthorizedException(ADMIN_AUTH_ERRORS.SESSION_INVALID);
      }

      // Gerçek reuse: mark + revoke all
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
          familyId: session.familyId,
        },
      });

      throw new UnauthorizedException(ADMIN_AUTH_ERRORS.REFRESH_REUSE);
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.sessionsRepo.revoke(session.id);
      throw new UnauthorizedException(ADMIN_AUTH_ERRORS.SESSION_EXPIRED);
    }

    const newExpiresAt = new Date(
      Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    const { rawToken: newRefreshRaw } =
      await this.sessionsRepo.rotateWithGeneratedToken({
        sessionId: session.id,
        tenantId: session.tenantId,
        identityId: session.identityId,
        typ: "admin",
        familyId: session.familyId,
        oldTokenHash: session.tokenHash,
        newExpiresAt,
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
      });

    const accessToken = this.tokenService.signAccessToken(
      {
        sub: session.identityId,
        tenantId: session.tenantId,
        typ: "admin",
        identityId: session.identityId,
      },
      env.ACCESS_TOKEN_TTL_SECONDS,
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
      meta: { typ: "admin", sessionId: session.id, familyId: session.familyId },
    });
  }

  async logoutAll(identityId: string, tenantId: string) {
    await this.sessionsRepo.revokeAllByIdentity({
      tenantId,
      identityId,
      typ: "admin",
    });

    await this.audit.log(tenantId, {
      action: AUDIT.ADMIN_LOGOUT_ALL,
      actorIdentityId: identityId,
      success: true,
      meta: { typ: "admin" },
    });
  }
}
