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

export type Env = {
  // Core
  NODE_ENV: string;
  API_PORT: number;

  // DB
  DATABASE_URL: string;

  // Mail + reset ttl + app url
  ADMIN_APP_URL: string;
  STORE_APP_URL: string;
  RESET_TOKEN_TTL_MINUTES: number;
  MAIL_FROM: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASSWORD: string;

  // Redis
  REDIS_HOST: string;
  REDIS_PORT: number;

  // MinIO
  MINIO_ENDPOINT: string;
  MINIO_PORT: number;
  MINIO_BUCKET: string;
  MINIO_USE_SSL: boolean;
  MINIO_ROOT_USER: string;
  MINIO_ROOT_PASSWORD: string;
  MINIO_ACCESS_KEY: string;
  MINIO_SECRET_KEY: string;
  S3_INTERNAL_ENDPOINT: string;
  S3_PUBLIC_ENDPOINT: string;

  // CORS / Cookie
  ADMIN_ORIGIN: string;
  STORE_ORIGIN: string;
  EXTRA_ORIGINS: string;

  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ACCESS_TOKEN_TTL_SECONDS: number;
  REFRESH_TTL_DAYS: number;

  COOKIE_SECRET: string;
  COOKIE_DOMAIN?: string;
  COOKIE_SECURE: boolean;

  // Sessions
  SESSIONS_MAX_ACTIVE: number;

  TRUST_PROXY: boolean;
};

export const env: Env = {
  // Core
  NODE_ENV: process.env.NODE_ENV ?? "development",
  API_PORT: num("API_PORT", "3001"),

  // DB
  DATABASE_URL: req("DATABASE_URL"),

  // mail + reset ttl + app url
  ADMIN_APP_URL: req("ADMIN_APP_URL", "https://admin.domain.com"),
  STORE_APP_URL: req("STORE_APP_URL", "https://domain.com"),
  RESET_TOKEN_TTL_MINUTES: num("RESET_TOKEN_TTL_MINUTES", "20"),

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
  MINIO_ACCESS_KEY: req("MINIO_ACCESS_KEY", "minio"),
  MINIO_SECRET_KEY: req("MINIO_SECRET_KEY", "minio_password_123"),

  // FIX: Changed defaults to match Docker network architecture
  // Internal: API container -> MinIO container (use service name)
  S3_INTERNAL_ENDPOINT: req("S3_INTERNAL_ENDPOINT", "http://minio:9000"),
  // Public: Browser/Host -> MinIO (use localhost for development)
  S3_PUBLIC_ENDPOINT: req("S3_PUBLIC_ENDPOINT", "http://localhost:9000"),

  // CORS / Cookie
  ADMIN_ORIGIN: req("ADMIN_ORIGIN", "http://localhost:3001"),
  STORE_ORIGIN: req("STORE_ORIGIN", "http://localhost:3000"),
  EXTRA_ORIGINS: process.env.EXTRA_ORIGINS ?? "",

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? "dev-change-me",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? "dev-change-me",
  ACCESS_TOKEN_TTL_SECONDS: num("ACCESS_TOKEN_TTL_SECONDS", "900"),
  REFRESH_TTL_DAYS: num("REFRESH_TTL_DAYS", "14"),

  COOKIE_SECRET: process.env.COOKIE_SECRET ?? "dev-cookie-secret",
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN ?? undefined,
  COOKIE_SECURE: bool("COOKIE_SECURE", "false"),

  // Sessions
  SESSIONS_MAX_ACTIVE: num("SESSIONS_MAX_ACTIVE", "25"),

  TRUST_PROXY: bool(
    "TRUST_PROXY",
    (process.env.NODE_ENV ?? "development") === "production" ? "true" : "false"
  ),
};
