import { Injectable, UnauthorizedException } from "@nestjs/common";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "@/config/env";
import { randomTokenUrlSafe } from "@/infrastructure/security/token.util";
import { decode } from "node:punycode";

export type AccessPayload = {
  sub: string;
  tenantId: string;
  typ: "admin" | "store";
  userId?: string;
  iat?: number;
  exp?: number;
  identityId?: string;
  customerId?: string;
};

@Injectable()
export class TokenService {
  signAccessToken(payload: AccessPayload, ttlSeconds: number) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: ttlSeconds,
    });
  }

  verifyAccessToken(token: string): AccessPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload &
        AccessPayload;

      // ekstra defensive check (kurumsal refleks)
      if (!decoded?.sub || !decoded?.tenantId || !decoded?.typ) {
        throw new UnauthorizedException("Invalid access token payload");
      }

      return {
        sub: decoded.sub,
        tenantId: decoded.tenantId,
        typ: decoded.typ,
        customerId: decoded.customerId,
        identityId: decoded.identityId,
      };
    } catch (err) {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }

  newRefreshToken() {
    return randomTokenUrlSafe(48);
  }

  newResetToken() {
    return randomTokenUrlSafe(48);
  }
}
