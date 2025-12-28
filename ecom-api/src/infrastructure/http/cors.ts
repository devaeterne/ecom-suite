import type { FastifyCorsOptions } from "@fastify/cors";
import { env } from "@/config/env";

function normalizeOrigin(o: string) {
  return o.trim().replace(/\/+$/, "");
}

function buildAllowlist() {
  const base = [env.ADMIN_ORIGIN, env.STORE_ORIGIN]
    .filter(Boolean)
    .map(normalizeOrigin);

  const extra = (env.EXTRA_ORIGINS ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map(normalizeOrigin);

  return Array.from(new Set([...base, ...extra]));
}

export function buildCorsOptions(): FastifyCorsOptions {
  const allowlist = buildAllowlist();

  return {
    origin: (origin, callback) => {
      // curl/server-to-server gibi durumlarda origin gelmeyebilir
      if (!origin) return callback(null, true);

      const normalized = normalizeOrigin(origin);
      const ok = allowlist.includes(normalized);

      return callback(
        ok ? null : new Error(`CORS blocked for origin: ${origin}`),
        ok
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    maxAge: 600,
  };
}
