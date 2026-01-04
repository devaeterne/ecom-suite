import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import crypto from "crypto";
import { Prisma } from "@prisma/client";

export type SessionTyp = "admin" | "store";
type Tx = Prisma.TransactionClient;

/**
 * Prisma P2002 unique violation bazen meta.target ile gelir, bazen gelmez.
 * Hem meta.target hem message fallback ile tokenHash uniq violation yakalanır.
 */
function isUniqueTokenHashError(e: unknown) {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (e.code !== "P2002") return false;

  const target = (e.meta as any)?.target;

  if (Array.isArray(target)) {
    if (target.includes("tokenHash") || target.includes("token_hash"))
      return true;
  } else if (typeof target === "string") {
    if (target.includes("tokenHash") || target.includes("token_hash"))
      return true;
  }

  const msg = String((e as any)?.message ?? "");
  return msg.includes("token_hash") || msg.includes("tokenHash");
}

/** URL-safe, yüksek entropili raw token */
function newRefreshTokenRaw() {
  return crypto.randomBytes(32).toString("base64url"); // ~43 char
}

/** DB'ye raw token yazmayız, hash saklarız */
export function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex"); // 64 char
}

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(fn: (tx: Tx) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }

  findAnyByTokenHash(params: { tokenHash: string; typ: SessionTyp }) {
    const { tokenHash, typ } = params;
    return this.prisma.session.findFirst({
      where: { tokenHash, typ },
    });
  }

  findValidByTokenHash(params: { tokenHash: string; typ: SessionTyp }) {
    const { tokenHash, typ } = params;
    const now = new Date();
    return this.prisma.session.findFirst({
      where: {
        tokenHash,
        typ,
        revokedAt: null,
        expiresAt: { gt: now },
      },
    });
  }

  async revoke(sessionId: string) {
    const now = new Date();
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: now },
    });
  }

  async revokeMany(ids: string[]) {
    const now = new Date();
    return this.prisma.session.updateMany({
      where: { id: { in: ids } },
      data: { revokedAt: now },
    });
  }

  async revokeAllByIdentity(params: {
    tenantId: string;
    identityId: string;
    typ: SessionTyp;
  }) {
    const now = new Date();
    const { tenantId, identityId, typ } = params;
    return this.prisma.session.updateMany({
      where: { tenantId, identityId, typ, revokedAt: null },
      data: { revokedAt: now },
    });
  }

  async listActiveByIdentity(params: {
    tenantId: string;
    identityId: string;
    typ: SessionTyp;
    take: number;
    orderBy?: "asc" | "desc";
  }) {
    const now = new Date();
    const { tenantId, identityId, typ, take, orderBy = "desc" } = params;

    return this.prisma.session.findMany({
      where: {
        tenantId,
        identityId,
        typ,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      take,
      orderBy: { createdAt: orderBy },
    });
  }

  async markReuse(sessionId: string) {
    const now = new Date();
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { reuseDetectedAt: now },
    });
  }

  /**
   * Yeni refresh token üretir + session create eder.
   * tokenHash collision olursa retry ile yeniden üretir.
   *
   * DÖNÜŞ: rawToken + created session
   */
  async createWithGeneratedToken(params: {
    tenantId: string;
    identityId: string;
    expiresAt: Date;
    typ: SessionTyp;
    familyId: string;
    ip?: string | null;
    userAgent?: string | null;
    lastUsedAt?: Date | null;
  }) {
    const {
      tenantId,
      identityId,
      expiresAt,
      typ,
      familyId,
      ip,
      userAgent,
      lastUsedAt,
    } = params;

    for (let attempt = 0; attempt < 10; attempt++) {
      const rawToken = newRefreshTokenRaw();
      const tokenHash = sha256Hex(rawToken);

      try {
        const session = await this.prisma.session.create({
          data: {
            tenantId,
            identityId,
            tokenHash,
            expiresAt,
            typ,
            familyId,
            ip: ip ?? null,
            userAgent: userAgent ?? null,
            lastUsedAt: lastUsedAt ?? null,
          },
        });

        return { rawToken, session };
      } catch (e) {
        if (!isUniqueTokenHashError(e)) throw e;
      }
    }

    throw new Error("Failed to create session (refresh token collision)");
  }

  /**
   * Rotate refresh (SAFE):
   * - mevcut session sadece "hala valid + doğru tokenHash" ise revoke edilir
   * - yeni session create edilir
   *
   * Not: aynı refresh token ile paralel istek gelirse, sadece 1 tanesi başarılı olur.
   */
  async rotateWithGeneratedToken(params: {
    sessionId: string;
    tenantId: string;
    identityId: string;
    typ: SessionTyp;
    familyId: string;
    oldTokenHash: string;
    newExpiresAt: Date;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const {
      sessionId,
      tenantId,
      identityId,
      typ,
      familyId,
      oldTokenHash,
      newExpiresAt,
      ip,
      userAgent,
    } = params;

    for (let attempt = 0; attempt < 10; attempt++) {
      const now = new Date();
      const rawToken = newRefreshTokenRaw();
      const newTokenHash = sha256Hex(rawToken);

      try {
        const created = await this.prisma.$transaction(async (tx) => {
          // 1) conditional revoke (race-safe)
          const res = await tx.session.updateMany({
            where: {
              id: sessionId,
              tenantId,
              identityId,
              typ,
              tokenHash: oldTokenHash,
              revokedAt: null,
              expiresAt: { gt: now },
            },
            data: {
              revokedAt: now,
              rotatedToHash: newTokenHash,
            },
          });

          if (res.count !== 1) {
            // stale token / already rotated / expired / revoked
            throw new ForbiddenException(
              "invalid or already-used refresh token"
            );
          }

          // 2) create new session
          return tx.session.create({
            data: {
              tenantId,
              identityId,
              typ,
              familyId,
              tokenHash: newTokenHash,
              expiresAt: newExpiresAt,
              rotatedFromHash: oldTokenHash,
              ip: ip ?? null,
              userAgent: userAgent ?? null,
              lastUsedAt: now,
            },
          });
        });

        return { rawToken, session: created };
      } catch (e) {
        if (!isUniqueTokenHashError(e)) throw e;
      }
    }

    throw new Error("Failed to rotate refresh token (collision)");
  }
}
