import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

type SessionTyp = "admin" | "store";

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    tenantId: string;
    identityId: string;
    tokenHash: string;
    expiresAt: Date;
    typ: SessionTyp;
  }) {
    return this.prisma.session.create({
      data: {
        tenantId: data.tenantId,
        identityId: data.identityId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        typ: data.typ,
      },
    });
  }

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

  rotate(sessionId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        tokenHash,
        expiresAt,
      },
    });
  }

  revoke(sessionId: string) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }
}
