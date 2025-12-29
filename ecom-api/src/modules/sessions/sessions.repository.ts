import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

export type SessionTyp = "admin" | "store";

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    tenantId: string;
    identityId: string;
    tokenHash: string;
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
      tokenHash,
      expiresAt,
      typ,
      familyId,
      ip,
      userAgent,
      lastUsedAt,
    } = params;
    return this.prisma.session.create({
      data: {
        tenantId,
        identityId,
        tokenHash, // prisma field (db: token_hash)
        expiresAt,
        typ,
        familyId,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
        lastUsedAt: lastUsedAt ?? null,
      },
    });
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
   * Rotate refresh: mevcut session revoke edilir, rotatedToHash set edilir,
   * yeni session create edilir (rotatedFromHash set edilir).
   */
  async rotate(params: {
    sessionId: string;
    tenantId: string;
    identityId: string;
    typ: SessionTyp;
    familyId: string;
    oldTokenHash: string;
    newTokenHash: string;
    newExpiresAt: Date;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const now = new Date();
    const {
      sessionId,
      tenantId,
      identityId,
      typ,
      familyId,
      oldTokenHash,
      newTokenHash,
      newExpiresAt,
      ip,
      userAgent,
    } = params;

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        revokedAt: now,
        rotatedToHash: newTokenHash,
      },
    });

    return this.prisma.session.create({
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
  }
}
