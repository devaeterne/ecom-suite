// src/config/env.ts

function req(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === null || String(v).trim() === "") {
    throw new Error(`Missing env: ${name}`);
  }
  return String(v);
}

function opt(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  const s = v === undefined || v === null ? "" : String(v).trim();
  return s.length ? s : undefined;
}

function num(name: string, fallback?: string) {
  const v = req(name, fallback);
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error(`Invalid number env: ${name}=${v}`);
  return n;
}

function bool(name: string, fallback = "false") {
  const v = String(process.env[name] ?? fallback).toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

const NODE_ENV = process.env.NODE_ENV ?? "development";
const IS_PROD = NODE_ENV === "production";
const IS_TEST = NODE_ENV === "test";

export type Env = {
  // Core
  NODE_ENV: string;
  API_PORT: number;

  // DB
  DATABASE_URL: string;

  // App URLs (redirect/link purpose, NOT CORS)
  ADMIN_APP_URL: string;
  STORE_APP_URL: string;

  // Password reset / mail
  RESET_TOKEN_TTL_MINUTES: number;
  MAIL_FROM: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASSWORD: string;

  // Redis
  REDIS_HOST: string;
  REDIS_PORT: number;

  // MinIO / S3
  MINIO_ENDPOINT: string;
  MINIO_PORT: number;
  MINIO_BUCKET: string;
  MINIO_USE_SSL: boolean;
  MINIO_ROOT_USER: string;
  MINIO_ROOT_PASSWORD: string;
  MINIO_ACCESS_KEY: string;
  MINIO_SECRET_KEY: string;

  // S3 endpoints:
  // - internal: container -> container
  // - public: browser/host -> accessible endpoint
  S3_INTERNAL_ENDPOINT: string;
  S3_PUBLIC_ENDPOINT: string;

  // CORS / Cookie
  ADMIN_ORIGIN: string; // CORS allowed origin (admin UI)
  STORE_ORIGIN: string; // CORS allowed origin (storefront)
  EXTRA_ORIGINS: string; // comma separated

  // Auth
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ACCESS_TOKEN_TTL_SECONDS: number;
  REFRESH_TTL_DAYS: number;

  // Cookies
  COOKIE_SECRET: string;
  COOKIE_DOMAIN?: string;
  COOKIE_SECURE: boolean;

  // Sessions
  SESSIONS_MAX_ACTIVE: number;

  // Reverse proxy
  TRUST_PROXY: boolean;
};

function secret(name: string, devFallback: string) {
  // prod’da secret zorunlu, dev/e2e’de fallback var (P0 hız)
  if (IS_PROD) return req(name);
  return req(name, devFallback);
}

export const env: Env = {
  // Core
  NODE_ENV: NODE_ENV,
  API_PORT: num("API_PORT", "3001"),

  // DB
  DATABASE_URL: req("DATABASE_URL"),

  // App URLs (redirect/link)
  ADMIN_APP_URL: req(
    "ADMIN_APP_URL",
    IS_PROD ? "https://admin.domain.com" : "http://localhost:3002",
  ),
  STORE_APP_URL: req(
    "STORE_APP_URL",
    IS_PROD ? "https://domain.com" : "http://localhost:3000",
  ),

  // Reset + mail
  RESET_TOKEN_TTL_MINUTES: num("RESET_TOKEN_TTL_MINUTES", "20"),
  MAIL_FROM: req(
    "MAIL_FROM",
    IS_PROD ? "no-reply@domain.com" : "no-reply@localhost",
  ),

  // SMTP: prod’da gerçek değer beklenir ama P0 için fallback bıraktım.
  SMTP_HOST: req("SMTP_HOST", IS_PROD ? "smtp.domain.com" : "smtp.local"),
  SMTP_PORT: num("SMTP_PORT", "587"),
  SMTP_USER: req("SMTP_USER", IS_PROD ? "user" : "user"),
  SMTP_PASSWORD: req("SMTP_PASSWORD", IS_PROD ? "password" : "password"),

  // Redis
  REDIS_HOST: req("REDIS_HOST", "redis"),
  REDIS_PORT: num("REDIS_PORT", "6379"),

  // MinIO
  MINIO_ENDPOINT: req("MINIO_ENDPOINT", "minio"),
  MINIO_PORT: num("MINIO_PORT", "9000"),
  MINIO_BUCKET: req("MINIO_BUCKET", "ecom"),
  MINIO_USE_SSL: bool("MINIO_USE_SSL", "false"),
  MINIO_ROOT_USER: secret("MINIO_ROOT_USER", "minio"),
  MINIO_ROOT_PASSWORD: secret("MINIO_ROOT_PASSWORD", "minio_password_123"),
  MINIO_ACCESS_KEY: req("MINIO_ACCESS_KEY", "minio"),
  MINIO_SECRET_KEY: req("MINIO_SECRET_KEY", "minio_password_123"),

  // S3 endpoints
  S3_INTERNAL_ENDPOINT: req(
    "S3_INTERNAL_ENDPOINT",
    `http://minio:${num("MINIO_PORT", "9000")}`,
  ),
  S3_PUBLIC_ENDPOINT: req(
    "S3_PUBLIC_ENDPOINT",
    IS_PROD ? `https://s3.domain.com` : "http://localhost:9000",
  ),

  // CORS origins (admin UI + storefront)
  // ✅ default admin origin 3002 olmalı (admin UI)
  ADMIN_ORIGIN: req(
    "ADMIN_ORIGIN",
    IS_PROD ? "https://admin.domain.com" : "http://localhost:3002",
  ),
  STORE_ORIGIN: req(
    "STORE_ORIGIN",
    IS_PROD ? "https://domain.com" : "http://localhost:3000",
  ),
  EXTRA_ORIGINS: process.env.EXTRA_ORIGINS ?? "",

  // Auth secrets
  JWT_ACCESS_SECRET: secret("JWT_ACCESS_SECRET", "dev-change-me-access"),
  JWT_REFRESH_SECRET: secret("JWT_REFRESH_SECRET", "dev-change-me-refresh"),
  ACCESS_TOKEN_TTL_SECONDS: num("ACCESS_TOKEN_TTL_SECONDS", "900"),
  REFRESH_TTL_DAYS: num("REFRESH_TTL_DAYS", "30"),

  // Cookies
  COOKIE_SECRET: secret("COOKIE_SECRET", "dev-cookie-secret"),
  COOKIE_DOMAIN: opt("COOKIE_DOMAIN"), // "" => undefined
  COOKIE_SECURE: bool("COOKIE_SECURE", IS_PROD ? "true" : "false"),

  // Sessions
  SESSIONS_MAX_ACTIVE: num("SESSIONS_MAX_ACTIVE", "25"),

  // Reverse proxy
  TRUST_PROXY: bool("TRUST_PROXY", IS_PROD ? "true" : "false"),
};
