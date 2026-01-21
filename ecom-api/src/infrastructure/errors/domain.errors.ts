// src/infrastructure/errors/domain.errors.ts

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ERROR_CODES, type ErrorCode } from "./error-codes";

export type ErrorDetails = Record<string, any>;

export type AppHttpErrorPayload = {
  code: ErrorCode;
  message: string;
  details?: ErrorDetails;
};

/**
 * Domain error → HttpException mapping
 * Not:
 * - Sadece mevcut ERROR_CODES alanlarını kullanır (compile-safe).
 * - İleride yeni code eklediğinde buraya case eklersin.
 */
function resolveHttpException(
  code: ErrorCode,
  message: string,
  details?: ErrorDetails,
): HttpException {
  const payload: AppHttpErrorPayload = { code, message, details };

  switch (code) {
    case ERROR_CODES.LIMIT_EXCEEDED:
    case ERROR_CODES.CONFLICT:
      return new ConflictException(payload); // 409

    case ERROR_CODES.NOT_FOUND:
      return new NotFoundException(payload); // 404

    case ERROR_CODES.UNAUTHORIZED:
      return new UnauthorizedException(payload); // 401

    case ERROR_CODES.FORBIDDEN:
    case ERROR_CODES.TENANT_CONTEXT_MISSING:
      return new ForbiddenException(payload); // 403

    case ERROR_CODES.VALIDATION_ERROR:
      return new BadRequestException(payload); // 400

    case ERROR_CODES.INTERNAL_ERROR:
      return new HttpException(payload, HttpStatus.INTERNAL_SERVER_ERROR); // 500

    default:
      // Tipik fallback: 400
      return new BadRequestException(payload);
  }
}

/**
 * Generic domain error producer
 */
export function domainError(
  code: ErrorCode,
  message: string,
  details?: ErrorDetails,
): HttpException {
  return resolveHttpException(code, message, details);
}

/**
 * Backward-compatible helpers
 * (Mevcutta bunları kullanan yerler varsa bozulmasın.)
 */
export function conflict(
  code: ErrorCode,
  message: string,
  details?: ErrorDetails,
): HttpException {
  return domainError(code, message, details);
}

/**
 * PR-4 helper
 */
export function limitExceeded(details: {
  resource: string;
  limit: number;
  current: number;
  tenantId?: string;
  productId?: string;
  status?: string;
}) {
  return domainError(ERROR_CODES.LIMIT_EXCEEDED, "Limit exceeded", details);
}
