import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "src/prisma/schema.prisma",
  migrations: { path: "src/prisma/migrations" },
  datasource: {
    url: env("DATABASE_URL"),
    shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
    // directUrl: env("DIRECT_DATABASE_URL"), // varsa ekle
  },
});
