import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // API versiyonlama/prefix
  app.setGlobalPrefix("v1");

  const port = Number(process.env.API_PORT || 3001);
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`🚀 API listening on http://localhost:${port}/v1`);
}

bootstrap();
