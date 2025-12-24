import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Logger, ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { env } from "./config/env";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
    { bufferLogs: true }
  );

  // Kurumsal default: SIGTERM/SIGINT ile temiz kapanış
  app.enableShutdownHooks();

  // API prefix
  app.setGlobalPrefix("/api");

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // CORS (admin/storefront dev)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle("ECOM API")
    .setDescription("ecom-suite backend API")
    .setVersion("1.0.0")
    .addBearerAuth()
    // Swagger UI /docs, API /api
    .addServer("/api")
    .build();

  const doc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app as any, doc);

  await app.listen(env.API_PORT, "0.0.0.0");
  logger.log(`🚀 API listening on http://localhost:${env.API_PORT}/api`);
  logger.log(`📚 Swagger UI at    http://localhost:${env.API_PORT}/docs`);
}

bootstrap().catch((err) => {
  // Fail-fast
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
