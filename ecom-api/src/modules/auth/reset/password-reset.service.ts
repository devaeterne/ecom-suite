import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { TokenService } from "@/infrastructure/security/token.service";
import { env } from "@/config/env";
import { createHash } from "crypto";
import * as bcrypt from "bcrypt";

function sha256(v: string) {
  return createHash("sha256").update(v).digest("hex");
}

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService
  ) {}

  async requestReset(dto: { email: string; typ: "admin" | "store" }) {
    const identity = await this.prisma.authIdentity.findFirst({
      where: {
        provider: "EMAIL_PASSWORD",
        providerId: { equals: dto.email, mode: "insensitive" },
      },
    });

    // ENUMERATION PROTECTION
    if (!identity) return;

    const rawToken = this.tokenService.newResetToken();
    const tokenHash = sha256(rawToken);

    const expiresAt = new Date(
      Date.now() + env.RESET_TOKEN_TTL_MINUTES * 60 * 1000
    );

    await this.prisma.passwordResetToken.create({
      data: {
        tenantId: identity.tenantId,
        identityId: identity.id,
        typ: dto.typ,
        tokenHash,
        expiresAt,
      },
    });

    // 🔴 MAIL SERVICE burada çağrılacak
    // resetLink = `${appUrl}/reset-password?token=${rawToken}`
  }

  async confirmReset(dto: {
    token: string;
    newPassword: string;
    typ: "admin" | "store";
  }) {
    const tokenHash = sha256(dto.token);

    const record = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        typ: dto.typ,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { identity: true },
    });

    if (!record) {
      throw new UnauthorizedException("Invalid or expired token");
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.authIdentity.update({
        where: { id: record.identityId },
        data: {
          passwordHash,
          passwordUpdatedAt: new Date(),
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.session.updateMany({
        where: {
          identityId: record.identityId,
          typ: dto.typ,
        },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}
