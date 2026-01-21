// src/infrastructure/errors/domain-errors.ts

import { ConflictException } from "@nestjs/common";
import { ERROR_CODES, type ErrorCode } from "./error-codes";

export type ErrorDetails = Record<string, any>;

type AppHttpErrorPayload = {
  code: ErrorCode;
  message: string;
  details?: ErrorDetails;
};

export function conflict(
  code: ErrorCode,
  message: string,
  details?: ErrorDetails,
): ConflictException {
  // Nest HttpException response body olarak object kabul eder.
  const payload: AppHttpErrorPayload = { code, message, details };
  return new ConflictException(payload);
}

export function limitExceeded(details: {
  resource: string;
  limit: number;
  current: number;
  tenantId?: string;
  productId?: string;
  status?: string;
}) {
  return conflict(ERROR_CODES.LIMIT_EXCEEDED, "Limit exceeded", details);
}
