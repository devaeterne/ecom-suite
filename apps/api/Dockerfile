# apps/api/Dockerfile
# syntax=docker/dockerfile:1.6

############################
# Base
############################
FROM node:20-bookworm-slim AS base
WORKDIR /app

# Prisma engine ihtiyaçları (openssl vs.)
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# pnpm
RUN corepack enable

############################
# Deps (monorepo install, cache-friendly)
############################
FROM base AS deps

# Workspace manifestleri (cache için)
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY pnpm-lock.yaml ./

COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json

COPY apps/api/package.json apps/api/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/storefront/package.json apps/storefront/package.json

# Install (dev deps dahil)
RUN pnpm install --frozen-lockfile

############################
# Tools (dev + prisma jobs)
############################
FROM deps AS tools

# Kodlar
COPY packages ./packages
COPY prisma ./prisma

COPY apps/api/src ./apps/api/src
COPY apps/api/test ./apps/api/test
COPY apps/api/tsconfig*.json ./apps/api/
COPY apps/api/nest-cli.json ./apps/api/

ENV NODE_ENV=development
ENV API_PORT=3001
EXPOSE 3001

# Dev’de TSX var, Prisma generate burada her zaman çalışır
# (DATABASE_URL gerektirmez; migrate/seed ayrı komutlarla yapılır)

CMD ["pnpm", "--filter", "@ecom/api", "dev"]

############################
# Build (production build)
############################
FROM tools AS build
ENV NODE_ENV=production

# Nest build (dist üret)
RUN pnpm --filter @ecom/api build

############################
# Runtime (minimal prod image)
############################
FROM base AS runtime
ENV NODE_ENV=production
ENV API_PORT=3001
EXPOSE 3001

# Sadece runtime deps
# Monorepo’da sadece api + gerekli workspace paketlerini prod olarak kuruyoruz
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY pnpm-lock.yaml ./

COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY apps/api/package.json apps/api/package.json

RUN pnpm install --frozen-lockfile --prod

# Build çıktısı + prisma schema/migrations (runtime içinde lazım olabilir)
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/prisma ./prisma

# Prisma Client runtime’da gereklidir (node_modules içinde zaten)
CMD ["node", "apps/api/dist/main.js"]
