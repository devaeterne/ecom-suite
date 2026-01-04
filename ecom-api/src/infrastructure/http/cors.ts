// src/infrastructure/http/cors.ts

import { env } from "@/config/env";

export function buildCorsOptions() {
  const allowedOrigins = [env.ADMIN_APP_URL, env.STORE_APP_URL].filter(
    Boolean
  ) as string[];

  const allowed = new Set(allowedOrigins);

  return {
    credentials: true,

    // Fastify cors expects a value or a function that returns boolean / string / array
    origin: (origin: string | undefined) => {
      if (!origin) return true; // SSR / curl / server-to-server

      return allowed.has(origin);
    },
  };
}

export const corsOptions = buildCorsOptions();
