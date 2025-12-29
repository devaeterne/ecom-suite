import { Injectable } from "@nestjs/common";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { randomTokenUrlSafe } from "@/infrastructure/security/token.util";

type AccessPayload = {
  sub: string;
  tenantId: string;
  typ: "admin" | "store";
};

@Injectable()
export class TokenService {
  signAccessToken(payload: AccessPayload, ttlSeconds: number) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: ttlSeconds,
    });
  }

  newRefreshToken() {
    return randomTokenUrlSafe(48);
  }

  newResetToken() {
    return randomTokenUrlSafe(48);
  }
}
