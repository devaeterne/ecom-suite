import { INestApplication, ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";

import multipart from "@fastify/multipart";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";

import { env } from "@/config/env";
import { buildCorsOptions } from "@/infrastructure/http/cors";

type SetupOpts = {
  enableSwagger?: boolean;
};

export async function setupApp(
  app: INestApplication,
  opts: SetupOpts = {}
): Promise<INestApplication> {
  const enableSwagger = opts.enableSwagger ?? false;

  // Route davranışı e2e + prod aynı olsun
  app.setGlobalPrefix("api");

  // Fastify plugin’leri (e2e’de de gerçekçi olur)
  const fastify = (app as NestFastifyApplication)
    .getHttpAdapter()
    .getInstance();

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
    SwaggerModule.setup("api/docs", app as any, document);
  }

  await app.init();
  await fastify.ready();

  return app;
}
