import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CacheService } from "@/cache/cache.service";
import { AuthAuditLogService } from "@/modules/auth/audit/auth-audit-log-service";
import { createHash } from "crypto";

type ReqMeta = { ip?: string; userAgent?: string };

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

@Injectable()
export class AuthSessionService {
  private readonly MAX_ACTIVE_SESSIONS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly audit: AuthAuditLogService
  ) {}

  async refresh(tenantId: string, refreshToken: string, meta: ReqMeta) {
    const tokenHash = sha256(refreshToken);

    const sess = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { identity: true },
    });

    // 1) bulunamadı -> 401 (reuse demiyoruz çünkü elimizde identity yok)
    if (!sess) {
      await this.audit.log(tenantId, {
        action: "SESSION_REFRESH_INVALID",
        success: false,
        ip: meta.ip,
        userAgent: meta.userAgent,
        meta: { reason: "NOT_FOUND" },
      });
      throw new UnauthorizedException("Invalid refresh token");
    }

    // tenant safety
    if (sess.tenantId !== tenantId) {
      await this.audit.log(tenantId, {
        action: "SESSION_REFRESH_INVALID",
        actorIdentityId: sess.identityId,
        success: false,
        ip: meta.ip,
        userAgent: meta.userAgent,
        meta: { reason: "TENANT_MISMATCH" },
      });
      throw new UnauthorizedException("Invalid refresh token");
    }

    // 2) revoked -> reuse -> GLOBAL REVOKE
    if (sess.revokedAt) {
      await this.globalRevokeByIdentity(sess.identityId, tenantId, {
        reason: "REUSE_DETECTED",
        meta,
        triggerSessionId: sess.id,
        triggerTokenHash: sess.tokenHash,
      });

      throw new UnauthorizedException("Refresh reuse detected");
    }

    // 3) expired
    if (sess.expiresAt.getTime() <= Date.now()) {
      await this.prisma.session.update({
        where: { id: sess.id },
        data: {
          revokedAt: new Date(),
          lastUsedAt: new Date(),
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      });

      await this.audit.log(tenantId, {
        action: "SESSION_REFRESH_INVALID",
        actorIdentityId: sess.identityId,
        success: false,
        ip: meta.ip,
        userAgent: meta.userAgent,
        meta: { reason: "EXPIRED" },
      });

      throw new UnauthorizedException("Refresh expired");
    }

    // 4) rotate
    const newRefreshToken = crypto.randomUUID() + "." + crypto.randomUUID(); // senin token generator’ına bağla
    const newHash = sha256(newRefreshToken);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // eski session revoke + telemetry
      await tx.session.update({
        where: { id: sess.id },
        data: {
          revokedAt: now,
          rotatedToHash: newHash, // opsiyonel
          lastUsedAt: now,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      });

      // yeni session create (aynı family)
      await tx.session.create({
        data: {
          tenantId,
          identityId: sess.identityId,
          tokenHash: newHash,
          typ: sess.typ,
          familyId: sess.familyId,
          rotatedFromHash: sess.tokenHash,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // örn 30 gün
          lastUsedAt: now,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      });

      // session limit enforce
      await this.enforceSessionLimit(tx, tenantId, sess.identityId);
    });

    await this.audit.log(tenantId, {
      action: "SESSION_REFRESH",
      actorIdentityId: sess.identityId,
      success: true,
      ip: meta.ip,
      userAgent: meta.userAgent,
      meta: { familyId: sess.familyId },
    });

    return { newRefreshToken };
  }

  private async enforceSessionLimit(
    tx: any,
    tenantId: string,
    identityId: string
  ) {
    const active = await tx.session.findMany({
      where: { tenantId, identityId, revokedAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (active.length <= this.MAX_ACTIVE_SESSIONS) return;

    const overflow = active.slice(0, active.length - this.MAX_ACTIVE_SESSIONS);
    const ids = overflow.map((s: { id: string }) => s.id);

    await tx.session.updateMany({
      where: { id: { in: ids } },
      data: { revokedAt: new Date() },
    });
  }

  async globalRevokeByIdentity(
    identityId: string,
    tenantId: string,
    opts: {
      reason: string;
      meta?: ReqMeta;
      triggerSessionId?: string;
      triggerTokenHash?: string;
    }
  ) {
    const now = new Date();
    await this.prisma.session.updateMany({
      where: { tenantId, identityId, revokedAt: null },
      data: {
        revokedAt: now,
        reuseDetectedAt: opts.reason === "REUSE_DETECTED" ? now : undefined,
      },
    });

    await this.audit.log(tenantId, {
      action:
        opts.reason === "REUSE_DETECTED"
          ? "SESSION_REUSE_DETECTED"
          : "SESSION_REVOKE_GLOBAL",
      actorIdentityId: identityId,
      success: true,
      ip: opts.meta?.ip,
      userAgent: opts.meta?.userAgent,
      meta: {
        reason: opts.reason,
        triggerSessionId: opts.triggerSessionId,
        triggerTokenHash: opts.triggerTokenHash,
      },
    });
  }
}
