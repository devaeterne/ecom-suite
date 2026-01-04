import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { TokenService } from "@/infrastructure/security/token.service";
import { HashService } from "@/infrastructure/security/hash.service";
import { MailService } from "@/infrastructure/mail/mail.service";
import { env } from "@/config/env";
import { createHash } from "crypto";

function sha256(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}
function buildResetLink(appUrl: string, raw: string) {
  return `${appUrl}/reset-password?token=${encodeURIComponent(raw)}`;
}

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly hashService: HashService,
    private readonly mailer: MailService
  ) {}

  private appUrl(typ: "admin" | "store") {
    return typ === "admin" ? env.ADMIN_APP_URL : env.STORE_APP_URL;
  }

  async requestReset(params: {
    tenantId: string;
    typ: "admin" | "store";
    email: string;
    ip?: string;
    userAgent?: string;
  }) {
    // email enumeration engelle: her durumda ok=true döneceğiz.
    const identity = await this.prisma.authIdentity.findFirst({
      where: {
        tenantId: params.tenantId,
        provider: "EMAIL_PASSWORD",
        providerId: { equals: params.email, mode: "insensitive" },
        ...(params.typ === "admin"
          ? { userId: { not: null } }
          : { customerId: { not: null } }),
      },
    });

    if (!identity) return; // sessiz

    const raw = this.tokenService.newResetToken(); // zaten secure random üretin var
    const tokenHash = sha256(raw);
    const expiresAt = new Date(
      Date.now() + env.RESET_TOKEN_TTL_MINUTES * 60 * 1000
    );

    await this.prisma.passwordResetToken.create({
      data: {
        tenantId: params.tenantId,
        identityId: identity.id,
        typ: params.typ,
        tokenHash,
        expiresAt,
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });

    const link = buildResetLink(this.appUrl(params.typ), raw);

    await this.mailer.send({
      to: params.email,
      subject:
        params.typ === "admin" ? "Admin password reset" : "Password reset",
      html: `
        <p>Şifre sıfırlama talebi alındı.</p>
        <p><a href="${link}">Şifreyi sıfırla</a></p>
        <p>Bu link ${env.RESET_TOKEN_TTL_MINUTES} dakika geçerlidir.</p>
      `,
      text: `Şifre sıfırlama linki: ${link} (TTL ${env.RESET_TOKEN_TTL_MINUTES} dk)`,
    });
  }

  async resetPassword(params: {
    tenantId: string;
    typ: "admin" | "store";
    token: string;
    newPassword: string;
  }) {
    const tokenHash = sha256(params.token);

    const row = await this.prisma.passwordResetToken.findFirst({
      where: {
        tenantId: params.tenantId,
        typ: params.typ,
        tokenHash,
      },
    });

    if (!row) return { ok: true }; // security: aynı cevap
    if (row.usedAt) return { ok: true };
    if (row.expiresAt.getTime() < Date.now()) return { ok: true };

    const identity = await this.prisma.authIdentity.findFirst({
      where: {
        id: row.identityId,
        tenantId: params.tenantId,
        ...(params.typ === "admin"
          ? { userId: { not: null } }
          : { customerId: { not: null } }),
      },
    });

    if (!identity) return { ok: true };

    const newHash = await this.hashService.hashPassword(params.newPassword);

    await this.prisma.$transaction([
      this.prisma.authIdentity.update({
        where: { id: identity.id },
        data: {
          passwordHash: newHash,
          passwordAlgo: "bcrypt",
          passwordUpdatedAt: new Date(),
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
      // önemli: tüm session’ları düşür
      this.prisma.session.updateMany({
        where: {
          tenantId: params.tenantId,
          identityId: identity.id,
          typ: params.typ,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { ok: true };
  }

  async issue(params: {
    tenantId: string;
    typ: "admin" | "store";
    identityId: string; // hedef authIdentity
    ip?: string;
    userAgent?: string;
    sendMail?: boolean;
    email?: string; // sendMail true ise gerekli
  }) {
    const identity = await this.prisma.authIdentity.findFirst({
      where: {
        id: params.identityId,
        tenantId: params.tenantId,
        ...(params.typ === "admin"
          ? { userId: { not: null } }
          : { customerId: { not: null } }),
      },
    });

    // security: her durumda ok gibi davranmak istiyorsan null dön, yoksa hata fırlat
    if (!identity) return { ok: false as const };

    const raw = this.tokenService.newResetToken();
    const tokenHash = sha256(raw);
    const expiresAt = new Date(
      Date.now() + env.RESET_TOKEN_TTL_MINUTES * 60 * 1000
    );

    await this.prisma.passwordResetToken.create({
      data: {
        tenantId: params.tenantId,
        identityId: identity.id,
        typ: params.typ,
        tokenHash,
        expiresAt,
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });

    const link = buildResetLink(this.appUrl(params.typ), raw);

    if (params.sendMail && params.email) {
      await this.mailer.send({
        to: params.email,
        subject:
          params.typ === "admin"
            ? "Admin invite / password setup"
            : "Password setup",
        html: `
          <p>Hesabınız oluşturuldu. Şifre belirlemek için:</p>
          <p><a href="${link}">Şifre belirle</a></p>
          <p>Bu link ${env.RESET_TOKEN_TTL_MINUTES} dakika geçerlidir.</p>
        `,
        text: `Şifre belirleme linki: ${link} (TTL ${env.RESET_TOKEN_TTL_MINUTES} dk)`,
      });
    }

    // DEV smoke test için raw token döndür
    const isDev = env.NODE_ENV !== "production";
    return isDev
      ? { ok: true as const, token: raw, link }
      : { ok: true as const };
  }
}
