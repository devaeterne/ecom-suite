// ecom-api/src/bootstrap/setup-app.ts

import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import fastifyCookie from "@fastify/cookie";

import { env } from "@/config/env";
import { COOKIE_NAMES } from "@/infrastructure/http/cookies";

type SetupAppOptions = {
  enableSwagger?: boolean;
};

export async function setupApp(
  app: NestFastifyApplication,
  options?: SetupAppOptions,
) {
  /**
   * 1) CORS (cookie-first, browser-friendly)
   */
  const allowlist = new Set<string>([
    // Admin UI / Next.js
    "http://localhost:3001",
    "http://127.0.0.1:3001",

    // Storefront / other local UIs
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
  ]);

  app.enableCors({
    origin: (origin, cb) => {
      // Server-to-server / curl / postman
      if (!origin) return cb(null, true);

      // Allowlisted browser origins
      if (allowlist.has(origin)) return cb(null, true);

      // Kurumsal davranış: throw yok, sadece deny
      return cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "content-type",
      "authorization",
      "x-tenant-id",
      "x-tenant-code",
      "x-request-id",
    ],
    // set-cookie’yi expose etmek şart değil ama sorun da çıkarmaz
    exposedHeaders: ["set-cookie"],
  });

  /**
   * 2) Cookie parser (guard’lardan önce)
   */
  await app.register(fastifyCookie, {
    secret: env.COOKIE_SECRET || "dev-secret-change-in-prod",
  });

  /**
   * 3) Raw body (webhook’lar için – scoped kullanım)
   */
  if (process.env.NODE_ENV !== "test") {
    app.use("/api/payments/webhooks", (req: any, _res: any, next: any) => {
      let data = "";
      req.setEncoding("utf8");

      req.on("data", (chunk: string) => {
        data += chunk;
      });

      req.on("end", () => {
        req.body = Buffer.from(data, "utf8");
        next();
      });
    });
  }

  /**
   * 4) Global API prefix
   */
  app.setGlobalPrefix("api");

  /**
   * 5) Global validation
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  /**
   * 6) Swagger (optional)
   */
  if (options?.enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("E-commerce API")
      .setDescription("Multi-tenant e-commerce backend")
      .setVersion("1.0")

      // Cookie-based auth (contract only, no auto state)
      .addSecurity("adminAccessCookie", {
        type: "apiKey",
        in: "cookie",
        name: COOKIE_NAMES.adminAccess,
      })
      .addSecurity("storeAccessCookie", {
        type: "apiKey",
        in: "cookie",
        name: COOKIE_NAMES.storeAccess,
      })
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup("api/docs", app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  /**
   * 7) Health check
   */
  app.use("/health", (_req: any, res: any) => {
    res.status(200).send({
      ok: true,
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
