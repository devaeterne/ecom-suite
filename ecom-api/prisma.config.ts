// prisma.config.ts

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

try {
  require("dotenv/config");
} catch {
  // container/CI ortamında dotenv kurulu olmayabilir; env zaten inject ediliyor
}

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "src/prisma/schema.prisma",
  migrations: { path: "src/prisma/migrations" },
  datasource: {
    url: env("DATABASE_URL"),
    // directUrl: env("DIRECT_DATABASE_URL"),
  },
});
