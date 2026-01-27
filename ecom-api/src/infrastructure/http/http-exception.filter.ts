// infrastructure/http/http-exception.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
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
  const code = asString(resp?.code);
  if (code) return code;

  const err = asString(resp?.error);
  if (err) return "http_error";

  return "http_error";
}

function pickDetails(resp: any): any | undefined {
  if (resp && typeof resp === "object" && resp.details !== undefined) {
    return resp.details;
  }

  if (Array.isArray(resp?.message)) {
    return {
      validationErrors: resp.message,
    };
  }

  return undefined;
}

function sendReply(res: any, status: number, payload: any) {
  // FastifyReply: reply.code(status).send(payload)
  if (res && typeof res.code === "function" && typeof res.send === "function") {
    return res.code(status).send(payload);
  }

  // Bazı adaptörlerde status() + send() olabilir
  if (
    res &&
    typeof res.status === "function" &&
    typeof res.send === "function"
  ) {
    // Express'te json() varsa onu tercih edelim
    if (typeof res.json === "function") return res.status(status).json(payload);
    return res.status(status).send(payload);
  }

  // Worst-case: sessiz fallback
  return payload;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res: any = ctx.getResponse();
    const req = ctx.getRequest<RequestWithMeta>();

    const requestId = req?.requestId;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let payload: HttpErrorPayload = {
      code: "internal_error",
      message: "Unexpected error",
      requestId,
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

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
      }
    } else if (exception && typeof exception === "object") {
      // Non-HttpException: en azından message taşıyalım
      const msg = normalizeMessage((exception as any).message);
      if (msg) {
        payload = {
          code: "internal_error",
          message: msg,
          requestId,
        };
      }
    }

    return sendReply(res, status, payload);
  }
}
