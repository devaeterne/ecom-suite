// src/infrastructure/http/http-exception.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";
import { HttpErrorPayload, RequestWithMeta } from "./types";

type AnyObj = Record<string, any>;

function nowIso() {
  return new Date().toISOString();
}

function asObj(v: unknown): AnyObj | null {
  return v && typeof v === "object" ? (v as AnyObj) : null;
}

function joinMessage(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map((x) => String(x)).join(", ");
  return undefined;
}

function defaultCodeForStatus(status: number) {
  switch (status) {
    case 400:
      return "validation_error";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    default:
      return "internal_error";
  }
}

function normalizeHttpException(
  exception: HttpException,
  requestId?: string,
): { status: number; payload: HttpErrorPayload & AnyObj } {
  const status = exception.getStatus();
  const response = exception.getResponse();

  // Basit string response
  if (typeof response === "string") {
    return {
      status,
      payload: {
        code: defaultCodeForStatus(status),
        message: response,
        requestId,
      },
    };
  }

  const obj = asObj(response);

  // Nest default obj: { statusCode, message, error }
  // Bizim custom obj: { code, message, details }
  if (obj) {
    const msg =
      joinMessage(obj.message) ??
      (typeof obj.error === "string" ? obj.error : undefined) ??
      "Request failed";

    const code =
      typeof obj.code === "string" ? obj.code : defaultCodeForStatus(status);

    const details =
      obj.details !== undefined
        ? obj.details
        : // validation errors vb. için ham payload’ı details’e koymak debug’da işe yarar
          obj;

    return {
      status,
      payload: {
        code,
        message: msg,
        details,
        requestId,
      },
    };
  }

  // Fallback
  return {
    status,
    payload: {
      code: defaultCodeForStatus(status),
      message: "Request failed",
      requestId,
    },
  };
}

function normalizeUnknownException(
  exception: unknown,
  requestId?: string,
): { status: number; payload: HttpErrorPayload & AnyObj } {
  const e = asObj(exception);

  // Prisma / DB constraint gibi hatalar çoğu zaman { code: "P2002", meta: {...} } taşır.
  if (e?.code && typeof e.code === "string") {
    return {
      status: HttpStatus.CONFLICT,
      payload: {
        code: "prisma_error",
        message: "Database constraint error",
        details: {
          prismaCode: e.code,
          meta: e.meta ?? null,
        },
        requestId,
      },
    };
  }

  // Genel JS Error
  if (exception instanceof Error) {
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      payload: {
        code: "internal_error",
        message: exception.message || "Unexpected error",
        details: {
          name: exception.name,
          stack: exception.stack,
        },
        requestId,
      },
    };
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    payload: {
      code: "internal_error",
      message: "Unexpected error",
      requestId,
    },
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<RequestWithMeta>();

    const requestId = req.requestId;

    const path = (req as any)?.originalUrl ?? (req as any)?.url ?? undefined;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    // Tipin ekstra alanları yoksa TS için genişletiyoruz
    let payload: HttpErrorPayload & AnyObj = {
      code: "internal_error",
      message: "Unexpected error",
      requestId,
    };

    if (exception instanceof HttpException) {
      const out = normalizeHttpException(exception, requestId);
      status = out.status;
      payload = out.payload;
    } else {
      const out = normalizeUnknownException(exception, requestId);
      status = out.status;
      payload = out.payload;
    }

    // PR-3 standard debug fields (non-breaking, UI isterse kullanır)
    payload.statusCode = status;
    payload.timestamp = nowIso();
    if (path) payload.path = path;

    res.status(status).json(payload);
  }
}
