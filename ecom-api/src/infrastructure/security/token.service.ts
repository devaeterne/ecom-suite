import { Injectable, UnauthorizedException } from "@nestjs/common";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "@/config/env";
import { randomTokenUrlSafe } from "@/infrastructure/security/token.util";

export type AccessPayload = {
  sub: string;
  tenantId: string;
  typ: "admin" | "store";
  iat?: number;
  exp?: number;
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
