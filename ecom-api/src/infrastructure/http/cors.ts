type CorsOrigin = string | RegExp;

function normalizeOrigin(origin?: string | null) {
  if (!origin) return null;
  try {
    // fastify cors origin bazen full origin string verir
    return origin;
  } catch {
    return origin;
  }
}

export function buildCorsOptions() {
  const env = process.env.NODE_ENV ?? "development";

  const allowlist: CorsOrigin[] = [
    // Prod domainler (örnek)
    "https://admin.domain.com",
    "https://domain.com",
    "https://api.domain.com",

    // Dev localhost
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ];

  // wildcard dev kolaylığı (istersen kapatırız)
  const devRegex = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

  return {
    credentials: true,
    origin: (
      origin: string | undefined,
      cb: (err: Error | null, ok: boolean) => void
    ) => {
      const o = normalizeOrigin(origin);

      // curl / server-to-server -> Origin yoksa CORS bloklamayalım
      if (!o) return cb(null, true);

      if (allowlist.includes(o)) return cb(null, true);

      if (env !== "production" && devRegex.test(o)) return cb(null, true);

      return cb(new Error(`CORS blocked for origin: ${o}`), false);
    },
  };
}
