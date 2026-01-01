import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

type ErrorKind = "validation" | "auth" | "forbidden" | "business" | "unknown";

function classify(status: number): ErrorKind {
  if (
    status === HttpStatus.BAD_REQUEST ||
    status === HttpStatus.UNPROCESSABLE_ENTITY
  )
    return "validation";
  if (status === HttpStatus.UNAUTHORIZED) return "auth";
  if (status === HttpStatus.FORBIDDEN) return "forbidden";
  if (status >= 400 && status < 500) return "business";
  return "unknown";
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<FastifyRequest>();
    const reply = ctx.getResponse<FastifyReply>();

    const url = (req as any)?.url;
    const method = (req as any)?.method;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const kind = classify(status);
      const res = exception.getResponse() as any;

      // Nest ValidationPipe genelde { message: string[]; error: string; statusCode: number }
      const message =
        typeof res === "string"
          ? res
          : res?.message ?? exception.message ?? "Request failed";

      const payload = {
        statusCode: status,
        kind,
        path: url,
        method,
        message,
        // validation ise array message’i olduğu gibi dönelim (debug çok hızlandırıyor)
        errors: Array.isArray(res?.message)
          ? res.message
          : res?.errors ?? undefined,
      };

      return reply.status(status).send(payload);
    }

    // Unknown / unhandled
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = {
      statusCode: status,
      kind: "unknown" as const,
      path: url,
      method,
      message: "Internal server error",
    };

    // burada production’da detay basmayız; e2e’de log görmek istersen console.error bırakabiliriz
    // console.error(exception);

    return reply.status(status).send(payload);
  }
}
