function req(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function num(name: string, fallback?: string) {
  const v = req(name, fallback);
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error(`Invalid number env: ${name}=${v}`);
  return n;
}

function bool(name: string, fallback = "false") {
  const v = (process.env[name] ?? fallback).toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

export const env = {
  // Core
  NODE_ENV: process.env.NODE_ENV ?? "development",
  API_PORT: num("API_PORT", "3000"),

  // DB
  DATABASE_URL: req("DATABASE_URL"),

  // mail + reset ttl + app url
  ADMIN_APP_URL: req("ADMIN_APP_URL", "https://admin.domain.com"),
  STORE_APP_URL: req("STORE_APP_URL", "https://domain.com"),
  RESET_TOKEN_TTL_MINUTES: 20,
  MAIL_FROM: req("MAIL_FROM", "no-reply@localhost"),
  SMTP_HOST: req("SMTP_HOST", "smtp.domain.com"),
  SMTP_PORT: num("SMTP_PORT", "587"),
  SMTP_USER: req("SMTP_USER", "user"),
  SMTP_PASSWORD: req("SMTP_PASSWORD", "password"),
  // Redis
  REDIS_HOST: req("REDIS_HOST", "redis"),
  REDIS_PORT: num("REDIS_PORT", "6379"),

  // MinIO
  MINIO_ENDPOINT: req("MINIO_ENDPOINT", "minio"),
  MINIO_PORT: num("MINIO_PORT", "9000"),
  MINIO_BUCKET: req("MINIO_BUCKET", "ecom"),
  MINIO_USE_SSL: bool("MINIO_USE_SSL", "false"),
  MINIO_ROOT_USER: req("MINIO_ROOT_USER"),
  MINIO_ROOT_PASSWORD: req("MINIO_ROOT_PASSWORD"),

  // CORS / Cookie
  ADMIN_ORIGIN: req("ADMIN_ORIGIN", "http://localhost:3001"),
  STORE_ORIGIN: req("STORE_ORIGIN", "http://localhost:3000"),
  EXTRA_ORIGINS: process.env.EXTRA_ORIGINS ?? "", // virgülle: https://a.com,https://b.com

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? "dev-change-me",
  ACCESS_TOKEN_TTL_SECONDS: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 900),
  REFRESH_TTL_DAYS: Number(process.env.REFRESH_TTL_DAYS ?? 14),

  COOKIE_SECRET: process.env.COOKIE_SECRET ?? "dev-cookie-secret",
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN ?? undefined,
  COOKIE_SECURE: (process.env.COOKIE_SECURE ?? "false") === "true",

  TRUST_PROXY: bool(
    "TRUST_PROXY",
    process.env.NODE_ENV === "production" ? "true" : "false"
  ),
} as const;
