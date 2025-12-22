import { defineConfig } from "prisma/config";
import { config as loadEnv } from "dotenv";

const result = loadEnv({ path: "../../.env" });

console.log("[prisma.config] dotenv loaded:", {
  path: "../../.env",
  parsedKeys: result.parsed ? Object.keys(result.parsed) : null,
  hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
});

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is missing in ../../.env");
}

export default defineConfig({
  schema: "../../prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "ts-node ../../prisma/seed/seed.ts",
  },
});
