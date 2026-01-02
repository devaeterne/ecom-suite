import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("EXC");

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req: any = ctx.getRequest();
    const res: any = ctx.getResponse();

    const requestId =
      req.headers["x-request-id"] ??
      req.id ??
      `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? (exception.getResponse() as any)?.message ?? exception.message
        : "Internal server error";

    // ✅ gerçek kök sebep burada
    this.logger.error(
      `[${requestId}] ${req.method} ${req.url} -> ${status} :: ${
        exception?.message ?? exception
      }`,
      exception?.stack
    );

    // bazı hatalarda cause dolu olur (prisma/mail)
    if (exception?.cause) {
      this.logger.error(`[${requestId}] cause: ${String(exception.cause)}`);
    }

    res.status(status).send({
      statusCode: status,
      path: req.url,
      method: req.method,
      message,
      requestId,
    });
  }
}
