import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { SessionsRepository } from "@/modules/sessions/sessions.repository";
import { TokenService } from "@/modules/crypto/token.service";
import { env } from "@/config/env";
import { createHash } from "crypto";
import * as bcrypt from "bcrypt";

function sha256(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

@Injectable()
export class StoreAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionsRepo: SessionsRepository,
    private readonly tokenService: TokenService
  ) {}

  async login(email: string, password: string) {
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
        providerId: true,
      },
    });

    // Store’da customerId zorunlu diyorsan burada enforce edebilirsin:
    if (!identity?.passwordHash)
      throw new UnauthorizedException("Invalid credentials");
    if (!identity.customerId) {
      throw new UnauthorizedException("Invalid store credentials");
    }

    const ok = await bcrypt.compare(password, identity.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    const refreshRaw = this.tokenService.newRefreshToken();
    const tokenHash = sha256(refreshRaw);
    const expiresAt = new Date(
      Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
    );

    await this.sessionsRepo.create({
      tenantId: identity.tenantId,
      identityId: identity.id,
      tokenHash,
      expiresAt,
      typ: "store",
    });

    const accessToken = this.tokenService.signAccessToken(
      {
        sub: identity.id,
        tenantId: identity.tenantId,
        typ: "store",
      },
      env.ACCESS_TOKEN_TTL_SECONDS
    );

    return { accessToken, refreshRaw };
  }

  async refresh(refreshRaw: string) {
    const tokenHash = sha256(refreshRaw);

    const session = await this.sessionsRepo.findValidByTokenHash({
      tokenHash,
      typ: "store",
    });
    if (!session) throw new UnauthorizedException("Invalid session");

    const newRefreshRaw = this.tokenService.newRefreshToken();
    const newHash = sha256(newRefreshRaw);
    const newExpiresAt = new Date(
      Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
    );

    await this.sessionsRepo.rotate(session.id, newHash, newExpiresAt);

    const accessToken = this.tokenService.signAccessToken(
      {
        sub: session.identityId,
        tenantId: session.tenantId,
        typ: "store",
      },
      env.ACCESS_TOKEN_TTL_SECONDS
    );

    return { accessToken, refreshRaw: newRefreshRaw };
  }

  async logout(refreshRaw: string) {
    const tokenHash = sha256(refreshRaw);

    const session = await this.sessionsRepo.findValidByTokenHash({
      tokenHash,
      typ: "store",
    });
    if (!session) return;

    await this.sessionsRepo.revoke(session.id);
  }
}
