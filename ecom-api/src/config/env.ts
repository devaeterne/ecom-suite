function req(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  API_PORT: Number(req("API_PORT", "3001")),

  DATABASE_URL: req("DATABASE_URL"),

  REDIS_HOST: req("REDIS_HOST", "redis"),
  REDIS_PORT: Number(process.env.REDIS_PORT ?? 6379),
  MINIO_PORT: Number(process.env.MINIO_PORT ?? "9000"),
  MINIO_BUCKET: req("MINIO_BUCKET", "ecom"),
  MINIO_USE_SSL: (process.env.MINIO_USE_SSL ?? "false") === "true",
};
