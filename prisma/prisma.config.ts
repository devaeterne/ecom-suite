// prisma/prisma.config.ts
import { defineConfig } from "prisma/config";

const url = process.env.DATABASE_URL;

export default defineConfig({
  schema: "./schema.prisma", // ✅ düzeltme: config dosyasına göre relatif
  ...(url ? { datasource: { url } } : {}),
  migrations: { seed: "node prisma/seed/seed.js" },
});
