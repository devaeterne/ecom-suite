import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { Request, Response } from "express";
import { PrismaService } from "../prisma/prisma.service";

type ClientMeta = { userAgent?: string; ip?: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  // ===== config helpers =====
  private accessSecret() {
    const s = process.env.JWT_ACCESS_SECRET;
    if (!s) throw new Error("JWT_ACCESS_SECRET missing");
    return s;
  }

  private accessExpiresInSeconds() {
    // type-safe: seconds
    return Number(process.env.JWT_ACCESS_EXPIRES_IN_SECONDS || "900");
  }

  private refreshTtlDays() {
    return Number(process.env.REFRESH_TOKEN_TTL_DAYS || "30");
  }

  private refreshCookieName() {
    return process.env.REFRESH_COOKIE_NAME || "rt";
  }

  private refreshCookieSecure() {
    return (process.env.REFRESH_COOKIE_SECURE || "false") === "true";
  }

  private refreshCookieSameSite(): "lax" | "strict" | "none" {
    const v = (process.env.REFRESH_COOKIE_SAMESITE || "lax").toLowerCase();
    return (v === "strict" ? "strict" : v === "none" ? "none" : "lax") as
      | "lax"
      | "strict"
      | "none";
  }

  private refreshCookieDomain() {
    const v = (process.env.REFRESH_COOKIE_DOMAIN || "").trim();
    return v.length ? v : undefined;
  }

  private async signAccessToken(userId: string) {
    const opts: JwtSignOptions = {
      secret: this.accessSecret(),
      expiresIn: this.accessExpiresInSeconds(),
    };

    return this.jwt.signAsync({ sub: userId }, opts);
  }

  // ===== crypto =====
  private newRefreshToken(): string {
    return crypto.randomBytes(48).toString("base64url");
  }

  private hashToken(token: string): string {
    const pepper = process.env.REFRESH_TOKEN_PEPPER || "";
    return crypto
      .createHash("sha256")
      .update(token + pepper)
      .digest("hex");
  }

  // ===== cookie API =====
  getRefreshCookie(req: Request): string | undefined {
    const name = this.refreshCookieName();
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return undefined;

    const found = cookieHeader
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith(`${name}=`));

    return found
      ? decodeURIComponent(found.split("=").slice(1).join("="))
      : undefined;
  }

  setRefreshCookie(res: Response, refreshToken: string) {
    const name = this.refreshCookieName();
    const secure = this.refreshCookieSecure();
    const sameSite = this.refreshCookieSameSite();
    const domain = this.refreshCookieDomain();

    const maxAgeMs = this.refreshTtlDays() * 24 * 60 * 60 * 1000;

    // Manual Set-Cookie (cookie-parser şart değil)
    const parts = [
      `${name}=${encodeURIComponent(refreshToken)}`,
      "Path=/",
      "HttpOnly",
      `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
      `SameSite=${sameSite[0].toUpperCase()}${sameSite.slice(1)}`,
    ];

    if (secure) parts.push("Secure");
    if (domain) parts.push(`Domain=${domain}`);

    res.setHeader("Set-Cookie", parts.join("; "));
  }

  clearRefreshCookie(res: Response) {
    const name = this.refreshCookieName();
    const domain = this.refreshCookieDomain();

    const parts = [`${name}=`, "Path=/", "HttpOnly", "Max-Age=0"];
    if (domain) parts.push(`Domain=${domain}`);

    res.setHeader("Set-Cookie", parts.join("; "));
  }

  // ===== core flows =====
  async login(emailRaw: string, password: string, meta: ClientMeta) {
    const email = emailRaw.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { memberships: { include: { organization: true } } },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    const refreshToken = this.newRefreshToken();
    const refreshHash = this.hashToken(refreshToken);
    const expiresAt = new Date(
      Date.now() + this.refreshTtlDays() * 24 * 60 * 60 * 1000
    );

    await this.prisma.authSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: refreshHash,
        userAgent: meta.userAgent,
        ip: meta.ip,
        expiresAt,
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = await this.signAccessToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: this.publicUser(user),
    };
  }

  async refresh(refreshToken: string, meta: ClientMeta) {
    const tokenHash = this.hashToken(refreshToken);

    const session = await this.prisma.authSession.findFirst({
      where: {
        refreshTokenHash: tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: { include: { memberships: { include: { organization: true } } } },
      },
    });

    if (!session) throw new UnauthorizedException("Invalid refresh token");

    // Rotation: revoke old + create new
    const newRefresh = this.newRefreshToken();
    const newHash = this.hashToken(newRefresh);
    const expiresAt = new Date(
      Date.now() + this.refreshTtlDays() * 24 * 60 * 60 * 1000
    );

    await this.prisma.$transaction([
      this.prisma.authSession.update({
        where: { id: session.id },
        data: { rotatedAt: new Date(), revokedAt: new Date() },
      }),
      this.prisma.authSession.create({
        data: {
          userId: session.userId,
          refreshTokenHash: newHash,
          userAgent: meta.userAgent ?? session.userAgent ?? undefined,
          ip: meta.ip ?? session.ip ?? undefined,
          expiresAt,
        },
      }),
    ]);

    const accessToken = await this.signAccessToken(session.userId);

    return {
      accessToken,
      refreshToken: newRefresh,
      user: this.publicUser(session.user),
    };
  }

  async revoke(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    const s = await this.prisma.authSession.findFirst({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
      select: { id: true },
    });

    if (!s) return;

    await this.prisma.authSession.update({
      where: { id: s.id },
      data: { revokedAt: new Date() },
    });
  }

  private publicUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      memberships: (user.memberships || []).map((m: any) => ({
        role: m.role,
        organization: {
          id: m.organization.id,
          name: m.organization.name,
          slug: m.organization.slug,
        },
      })),
    };
  }
}
