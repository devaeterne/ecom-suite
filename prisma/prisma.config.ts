import { defineConfig } from "prisma/config";

if (!process.env.DATABASE_URL) {
  // Docker/CI/prod env’den gelmeli.
  throw new Error(
    "❌ DATABASE_URL is missing (set it as an environment variable)"
  );
}

export default defineConfig({
  schema: "./schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    // Root’tan çalışacak şekilde:
    seed: "pnpm exec tsx prisma/seed/seed.ts",
  },
});
