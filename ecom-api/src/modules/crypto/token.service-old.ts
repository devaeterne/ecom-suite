import { Injectable, UnauthorizedException } from "@nestjs/common";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { randomTokenUrlSafe } from "@/infrastructure/security/token.util";

type AccessPayload = {
  sub: string;
  tenantId: string;
  typ: "admin" | "store";
  iat?: number;
  exp?: number;
};

@Injectable()
export class TokenService {
  signAccessToken(payload: AccessPayload, ttlSeconds: number) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: ttlSeconds });
  }

  verifyAccessToken(token: string): AccessPayload | null {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;

      // Minimum shape kontrolü
      if (!decoded?.sub || !decoded?.tenantId || !decoded?.typ) return null;

      return {
        sub: String(decoded.sub),
        tenantId: String(decoded.tenantId),
        typ: decoded.typ,
        iat: decoded.iat,
        exp: decoded.exp,
      };
    } catch {
      return null;
    }
  }

  newRefreshToken() {
    return randomTokenUrlSafe(48);
  }

  newResetToken() {
    return randomTokenUrlSafe(48);
  }
}
