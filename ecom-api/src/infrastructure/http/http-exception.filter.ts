// infrastructure/http/http-exception.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";
import { HttpErrorPayload, RequestWithMeta } from "./types";

function asString(v: any): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}

function normalizeMessage(msg: any): string | null {
  const s = asString(msg);
  if (s) return s;

  if (Array.isArray(msg)) {
    const parts = msg.map((x) => asString(x)).filter(Boolean) as string[];
    if (parts.length) return parts.join("; ");
  }

  return null;
}

function pickCode(resp: any): string {
  // Bizim domain.errors -> { code, message, details }
  const code = asString(resp?.code);
  if (code) return code;

  // Nest default: error string
  const err = asString(resp?.error);
  if (err) return "http_error";

  return "http_error";
}

function pickDetails(resp: any): any | undefined {
  // Bizim payload: details
  if (resp && typeof resp === "object" && resp.details !== undefined) {
    return resp.details;
  }

  // class-validator typical shape:
  // { message: [..], error: "Bad Request", statusCode: 400 }
  // Burada message array’ini details’e koyuyoruz
  if (Array.isArray(resp?.message)) {
    return {
      validationErrors: resp.message,
    };
  }

  return undefined;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<RequestWithMeta>();

    const requestId = req.requestId;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let payload: HttpErrorPayload = {
      code: "internal_error",
      message: "Unexpected error",
      requestId,
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      // response string ise direkt message
      if (typeof response === "string") {
        payload = {
          code: "http_error",
          message: response,
          requestId,
        };
      } else if (response && typeof response === "object") {
        const msg =
          normalizeMessage((response as any).message) ??
          normalizeMessage((response as any).error) ??
          "Request failed";

        payload = {
          code: pickCode(response),
          message: msg,
          details: pickDetails(response),
          requestId,
        };

        // Opsiyonel: ham response’u debug amaçlı sakla (PII içermiyorsa)
        // payload.details = { ...(payload.details ?? {}), raw: response };
      }
    }

    res.status(status).json(payload);
  }
}
