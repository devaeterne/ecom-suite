import { INestApplication, ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";

import multipart from "@fastify/multipart";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";

import { env } from "@/config/env";
import { buildCorsOptions } from "@/infrastructure/http/cors";
import { HttpExceptionFilter } from "@/infrastructure/http/http-exception.filter";

const httpLogger = new Logger("HTTP");

export async function setupApp(
  app: INestApplication,
  opts: { enableSwagger?: boolean } = {}
) {
  const enableSwagger = opts.enableSwagger ?? false;

  app.setGlobalPrefix("api");
  app.useGlobalFilters(new HttpExceptionFilter());

  const fastify = (app as NestFastifyApplication)
    .getHttpAdapter()
    .getInstance();

  // ✅ HOOKLAR: init/listen öncesi
  fastify.addHook("onRequest", async (req: any) => {
    req.__startAt = Date.now();
  });

  fastify.addHook("onResponse", async (req: any, reply: any) => {
    const ms = Date.now() - (req.__startAt ?? Date.now());
    httpLogger.log(`${req.method} ${req.url} -> ${reply.statusCode} (${ms}ms)`);
  });

  await (app as NestFastifyApplication).register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  });

  await (app as NestFastifyApplication).register(cookie, {
    secret: env.COOKIE_SECRET,
  });
  await (app as NestFastifyApplication).register(cors, buildCorsOptions());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle("ecom-suite API")
      .setDescription("Admin + Storefront API")
      .setVersion("1.0")
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app as any, config);

    // ✅ /api/api/docs olmasın
    SwaggerModule.setup("docs", app as any, document);
  }

  await app.init();
  // fastify.ready() şart değil; istersen kalsın ama hook zaten önce eklendi.
  await fastify.ready();

  return app;
}
