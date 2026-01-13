import { Test } from "@nestjs/testing";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import fastifyCookie from "@fastify/cookie";

import { AppModule } from "@/app.module";

export async function createE2EApp(): Promise<NestFastifyApplication> {
  const modRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const adapter = new FastifyAdapter();
  const app = modRef.createNestApplication<NestFastifyApplication>(adapter);

  // ✅ IMPORTANT: adapter.register() YOK!
  // Cookie plugin -> gerçek fastify instance’a register.
  const fastify = app.getHttpAdapter().getInstance();
  fastify.register(fastifyCookie as any, {
    secret: process.env.COOKIE_SECRET ?? "test-cookie-secret",
  });

  // main.ts ile uyumlu prefix
  const prefix = process.env.E2E_API_PREFIX ?? "api";
  app.setGlobalPrefix(prefix);

  await app.init();
  await fastify.ready();

  return app;
}
