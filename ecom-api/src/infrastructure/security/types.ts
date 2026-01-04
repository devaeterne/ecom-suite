// src/infrastructure/security/types.ts

export type TokenKind = "access" | "refresh";
export type PanelType = "admin" | "store";

export type JwtPayloadBase = {
  sub: string;
  tenantId?: string;
  sessionId?: string;
  typ?: PanelType;

  // ✅ allow custom claims (identityId vb)
  [key: string]: unknown;
};

export type AccessTokenPayload = JwtPayloadBase & {
  kind?: "access";
};

export type RefreshTokenPayload = JwtPayloadBase & {
  kind?: "refresh";
};
