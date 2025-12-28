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

  // Redis
  REDIS_HOST: req("REDIS_HOST", "redis"),
  REDIS_PORT: num("REDIS_PORT", "6379"),

  // MinIO (senin .env sözleşmen)
  MINIO_ENDPOINT: req("MINIO_ENDPOINT", "minio"),
  MINIO_PORT: num("MINIO_PORT", "9000"),
  MINIO_BUCKET: req("MINIO_BUCKET", "ecom"),
  MINIO_USE_SSL: bool("MINIO_USE_SSL", "false"),

  MINIO_ROOT_USER: req("MINIO_ROOT_USER"),
  MINIO_ROOT_PASSWORD: req("MINIO_ROOT_PASSWORD"),
} as const;
