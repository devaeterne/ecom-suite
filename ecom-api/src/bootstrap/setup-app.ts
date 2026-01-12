// ecom-api/src/bootstrap/setup-app.ts
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import fastifyCookie from "@fastify/cookie";
import { env } from "@/config/env";
//import cookieParser from "cookie-parser";

// ✅ cookie isimlerin nerede tanımlıysa burayı güncelle
import { COOKIE_NAMES } from "@/infrastructure/http/cookies";

export async function setupApp(
  app: NestFastifyApplication,
  options?: { enableSwagger?: boolean }
) {
  // 1. CORS
  app.enableCors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  });

  // 2. Cookie parser (raw body'den ÖNCE)
  await app.register(fastifyCookie, {
    secret: env.COOKIE_SECRET || "dev-secret-change-in-prod",
  });

  // 3. Raw body for webhooks (specific routes only)
  if (process.env.NODE_ENV !== "test") {
    app.use("/api/payments/webhooks", (req: any, res: any, next: any) => {
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

  // 4. Global prefix
  app.setGlobalPrefix("api");

  // 5. Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // flexible for now
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // 6. Swagger (optional)
  if (options?.enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle("E-commerce API")
      .setDescription("Multi-tenant e-commerce backend")
      .setVersion("1.0")

      // ✅ Admin access cookie (scheme name: adminAccessCookie)
      .addCookieAuth(
        COOKIE_NAMES.adminAccess,
        {
          type: "apiKey",
          in: "cookie",
          name: COOKIE_NAMES.adminAccess,
        },
        "adminAccessCookie"
      )

      // ✅ Store access cookie (scheme name: storeAccessCookie)
      .addCookieAuth(
        COOKIE_NAMES.storeAccess,
        {
          type: "apiKey",
          in: "cookie",
          name: COOKIE_NAMES.storeAccess,
        },
        "storeAccessCookie"
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
  }

  // 7. Health check
  app.use("/health", (req: any, res: any) => {
    res.status(200).send({ ok: true, timestamp: new Date().toISOString() });
  });
  //app.use(cookieParser());

  return app;
}
