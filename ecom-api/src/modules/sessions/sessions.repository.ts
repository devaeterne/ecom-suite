import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

export type SessionTyp = "admin" | "store";

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    tenantId: string;
    identityId: string;
    tokenHash: string;
    expiresAt: Date;
    typ: SessionTyp;

    familyId?: string;
    rotatedFromHash?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    lastUsedAt?: Date | null;
  }) {
    return this.prisma.session.create({
      data: {
        tenantId: data.tenantId,
        identityId: data.identityId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        typ: data.typ,

        familyId: data.familyId,
        rotatedFromHash: data.rotatedFromHash ?? null,
        ip: data.ip ?? null,
        userAgent: data.userAgent ?? null,
        lastUsedAt: data.lastUsedAt ?? new Date(),
      },
    });
  }

  // Only active & not expired
  findValidByTokenHash(params: { tokenHash: string; typ: SessionTyp }) {
    return this.prisma.session.findFirst({
      where: {
        tokenHash: params.tokenHash,
        typ: params.typ,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  // Includes revoked/expired (reuse detection için)
  findByTokenHash(params: { tokenHash: string; typ: SessionTyp }) {
    return this.prisma.session.findFirst({
      where: {
        tokenHash: params.tokenHash,
        typ: params.typ,
      },
    });
  }

  // Rotate: DO NOT overwrite tokenHash. Revoke old + create new
  async rotate(params: {
    sessionId: string;
    newTokenHash: string;
    newExpiresAt: Date;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const cur = await tx.session.findUnique({
        where: { id: params.sessionId },
      });
      if (!cur) return null;

      await tx.session.update({
        where: { id: cur.id },
        data: {
          revokedAt: now,
          rotatedToHash: params.newTokenHash,
          lastUsedAt: now,
          ip: params.ip ?? cur.ip,
          userAgent: params.userAgent ?? cur.userAgent,
        },
      });

      const next = await tx.session.create({
        data: {
          tenantId: cur.tenantId,
          identityId: cur.identityId,
          typ: cur.typ,
          tokenHash: params.newTokenHash,
          expiresAt: params.newExpiresAt,

          familyId: cur.familyId,
          rotatedFromHash: cur.tokenHash,
          lastUsedAt: now,
          ip: params.ip ?? cur.ip,
          userAgent: params.userAgent ?? cur.userAgent,
        },
      });

      return { current: cur, next };
    });
  }

  revoke(sessionId: string) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  // Mark reuse on a specific session
  markReuse(sessionId: string) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { reuseDetectedAt: new Date() },
    });
  }

  // GLOBAL revoke for identity
  revokeAllByIdentity(params: { tenantId: string; identityId: string }) {
    return this.prisma.session.updateMany({
      where: {
        tenantId: params.tenantId,
        identityId: params.identityId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  listActiveByIdentity(params: {
    tenantId: string;
    identityId: string;
    typ?: SessionTyp;
  }) {
    return this.prisma.session.findMany({
      where: {
        tenantId: params.tenantId,
        identityId: params.identityId,
        revokedAt: null,
        ...(params.typ ? { typ: params.typ } : {}),
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, createdAt: true },
    });
  }

  revokeMany(ids: string[]) {
    if (ids.length === 0) return Promise.resolve({ count: 0 });
    return this.prisma.session.updateMany({
      where: { id: { in: ids } },
      data: { revokedAt: new Date() },
    });
  }
}
