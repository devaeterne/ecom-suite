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

      if (typeof response === "string") {
        payload.message = response;
      } else if (typeof response === "object" && response !== null) {
        payload = {
          code: (response as any).code ?? "http_error",
          message: (response as any).message ?? "Request failed",
          details: (response as any).details,
          requestId,
        };
      }
    }

    res.status(status).json(payload);
  }
}
