import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "@/app.module";

// ⚠️ Express yerine Fastify kullanıyorsan burada Fastify adapter kurulur.
// Eğer projende zaten bir bootstrap helper varsa bunu ekleme, onu kullan.
export async function createTestApp(): Promise<INestApplication> {
  const mod = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  // IMPORTANT: Sizin projede platform-express yok, o yüzden createNestApplication() kullanmayacağız.
  // Eğer Fastify kullanıyorsanız:
  // const app = mod.createNestApplication(new FastifyAdapter());
  // await app.init();
  // await app.getHttpAdapter().getInstance().ready();
  // return app;

  // Şu an burada bir karar lazım: Fastify mı?
  // Ben en doğru yolu: mevcut gate helper’ınızı kullanmak olarak görüyorum.
  throw new Error(
    "createTestApp() needs to use your existing gate bootstrap (Fastify/Custom). " +
      "Reuse the same helper used in 00-health.gate.e2e-spec.ts."
  );
}
