// src/infrastructure/security/token.service.ts

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHmac, timingSafeEqual, randomBytes, randomUUID } from "crypto";
import { env } from "@/config/env";
import type { PanelType, TokenKind } from "./types";

type AnyPayload = Record<string, any>;

function b64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlJson(obj: unknown) {
  return b64url(JSON.stringify(obj));
}

function resolveSecret(): string {
  const anyEnv = env as any;
  return (
    anyEnv.JWT_SECRET ||
    anyEnv.AUTH_JWT_SECRET ||
    anyEnv.TOKEN_SECRET ||
    "dev-secret"
  );
}

function resolveTtlSeconds(kind: TokenKind, ttlSeconds?: number): number {
  if (typeof ttlSeconds === "number" && Number.isFinite(ttlSeconds)) {
    return ttlSeconds;
  }
  const anyEnv = env as any;
  const access =
    Number(
      anyEnv.ACCESS_TOKEN_TTL_SECONDS ?? anyEnv.JWT_ACCESS_TTL_SECONDS ?? 900
    ) || 900;
  const refresh =
    Number(
      anyEnv.REFRESH_TOKEN_TTL_SECONDS ??
        anyEnv.JWT_REFRESH_TTL_SECONDS ??
        60 * 60 * 24 * 30
    ) || 60 * 60 * 24 * 30;

  return kind === "access" ? access : refresh;
}

/**
 * Minimal JWT-like token (HS256) without external deps.
 * header.payload.signature (base64url)
 */
function signHs256(payload: AnyPayload, ttl: number): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + ttl };

  const unsigned = `${b64urlJson(header)}.${b64urlJson(body)}`;
  const sig = createHmac("sha256", resolveSecret()).update(unsigned).digest();
  return `${unsigned}.${b64url(sig)}`;
}

function verifyHs256(token: string): AnyPayload {
  const parts = token.split(".");
  if (parts.length !== 3) throw new UnauthorizedException("Invalid token");

  const [h, p, s] = parts;
  const unsigned = `${h}.${p}`;
  const expected = createHmac("sha256", resolveSecret())
    .update(unsigned)
    .digest();
  const got = Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

  // timing-safe compare
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) {
    throw new UnauthorizedException("Invalid token signature");
  }

  const payloadJson = Buffer.from(
    p.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  ).toString("utf8");
  const payload = JSON.parse(payloadJson);

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && payload.exp < now) {
    throw new UnauthorizedException("Token expired");
  }

  return payload;
}

@Injectable()
export class TokenService {
  /**
   * Backward compatible: signAccessToken(payload[, ttlSeconds])
   */
  signAccessToken(payload: AnyPayload, ttlSeconds?: number): string {
    const ttl = resolveTtlSeconds("access", ttlSeconds);
    return signHs256({ ...payload, kind: "access" }, ttl);
  }

  /**
   * Backward compatible: signRefreshToken(payload[, ttlSeconds])
   */
  signRefreshToken(payload: AnyPayload, ttlSeconds?: number): string {
    const ttl = resolveTtlSeconds("refresh", ttlSeconds);
    return signHs256({ ...payload, kind: "refresh" }, ttl);
  }

  /**
   * Backward compatible: verifyAccessToken(token[, typ])
   */
  verifyAccessToken(token: string, typ?: PanelType): AnyPayload {
    const payload = verifyHs256(token);
    if (payload.kind !== "access")
      throw new UnauthorizedException("Invalid token kind");
    if (typ && !payload.typ) payload.typ = typ;
    return payload;
  }

  verifyRefreshToken(token: string, typ?: PanelType): AnyPayload {
    const payload = verifyHs256(token);
    if (payload.kind !== "refresh")
      throw new UnauthorizedException("Invalid token kind");
    if (typ && !payload.typ) payload.typ = typ;
    return payload;
  }

  /**
   * legacy helper
   */
  newResetToken(bytes = 32): string {
    return randomBytes(bytes).toString("hex"); // 64 chars
  }
  newRefreshToken(): string {
    // uuid v4 ok; ekstra entropy için randomBytes da karıştırabiliriz
    return `${randomUUID()}-${b64url(randomBytes(16))}`;
  }
}
