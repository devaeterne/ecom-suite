import { Injectable, UnauthorizedException } from "@nestjs/common";
import { randomBytes, createHmac, timingSafeEqual } from "crypto";
import { env } from "@/config/env";

function base64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(input: string) {
  const pad = 4 - (input.length % 4 || 4);
  const s = input + "=".repeat(pad);
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64").toString("utf8");
}

@Injectable()
export class TokenService {
  newRefreshToken(): string {
    return base64url(randomBytes(48));
  }

  signAccessToken(payload: Record<string, any>, ttlSeconds: number): string {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);

    const body = { ...payload, iat: now, exp: now + ttlSeconds };

    const encodedHeader = base64url(JSON.stringify(header));
    const encodedBody = base64url(JSON.stringify(body));
    const data = `${encodedHeader}.${encodedBody}`;

    const sig = createHmac("sha256", env.JWT_ACCESS_SECRET)
      .update(data)
      .digest();
    return `${data}.${base64url(sig)}`;
  }

  verifyAccessToken<T extends Record<string, any>>(token: string): T {
    const parts = token.split(".");
    if (parts.length !== 3) throw new UnauthorizedException("Invalid token");

    const [h, p, s] = parts;
    const data = `${h}.${p}`;

    const expected = createHmac("sha256", env.JWT_ACCESS_SECRET)
      .update(data)
      .digest();
    const got = Buffer.from(
      s.replace(/-/g, "+").replace(/_/g, "/") + "==".slice((s.length + 2) % 4),
      "base64"
    );

    if (expected.length !== got.length || !timingSafeEqual(expected, got)) {
      throw new UnauthorizedException("Invalid token signature");
    }

    const payload = JSON.parse(base64urlDecode(p)) as T;

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === "number" && payload.exp < now) {
      throw new UnauthorizedException("Token expired");
    }

    return payload;
  }
}
