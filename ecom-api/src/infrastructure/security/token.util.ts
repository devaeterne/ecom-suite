// src/infrastructure/security/token.util.ts

import type { FastifyRequest } from "fastify";
import { COOKIE_NAMES } from "@/infrastructure/http/cookies";
import type { PanelType } from "./types";

export function getTokenFromRequest(
  req: FastifyRequest,
  panel: PanelType
): string | undefined {
  // 1) Authorization header
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }

  // 2) Cookie fallback
  const cookies = (req as any).cookies ?? {};

  if (panel === "admin") {
    return cookies[COOKIE_NAMES.adminAccess];
  }

  if (panel === "store") {
    return cookies[COOKIE_NAMES.storeAccess];
  }

  return undefined;
}
