import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { env } from "@/config/env";
import { setupApp } from "@/bootstrap/setup-app";
import { HttpExceptionFilter } from "@/infrastructure/http/http-exception.filter";

async function bootstrap() {
  const adapter = new FastifyAdapter({ trustProxy: !!env.TRUST_PROXY });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
  );

  await setupApp(app, { enableSwagger: true });
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(env.API_PORT ?? 3001, "0.0.0.0");
}

bootstrap();
