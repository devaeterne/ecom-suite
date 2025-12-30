import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";

import multipart from "@fastify/multipart";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";

import { env } from "@/config/env";
import { buildCorsOptions } from "@/infrastructure/http/cors";

async function bootstrap() {
  const adapter = new FastifyAdapter({
    trustProxy: env.TRUST_PROXY ? true : false,
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter
  );

  app.setGlobalPrefix("api");

  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  });

  await app.register(cookie, {
    secret: env.COOKIE_SECRET, // env.ts'e ekle
  });

  await app.register(cors, buildCorsOptions());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  const config = new DocumentBuilder()
    .setTitle("ecom-suite API")
    .setDescription("Admin + Storefront API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(env.API_PORT ?? 3001, "0.0.0.0");
}

bootstrap();
