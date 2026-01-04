// infrastructure/http/types.ts

import type { Request } from "express";

export type PanelType = "admin" | "store" | "public";

export type HttpErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
};

export type RequestWithMeta = Request & {
  requestId?: string;
  tenantId?: string;
};
