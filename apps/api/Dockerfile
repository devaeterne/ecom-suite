# apps/api/Dockerfile
FROM node:20-bookworm-slim

WORKDIR /app

# Prisma için gerekli (özellikle OpenSSL)
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# pnpm
RUN corepack enable

# --- Workspace manifestleri önce (cache için) ---
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/storefront/package.json apps/storefront/package.json

# Install (monorepo)
RUN pnpm install

# --- Kodlar ---
COPY packages ./packages
COPY prisma ./prisma
# sadece kaynak + config
COPY apps/api/src ./apps/api/src
COPY apps/api/test ./apps/api/test
COPY apps/api/tsconfig*.json ./apps/api/
COPY apps/api/nest-cli.json ./apps/api/

# Prisma generate (client üretimi)
RUN pnpm --filter @ecom/api prisma:generate || true

ENV NODE_ENV=development
ENV API_PORT=3001

EXPOSE 3001

CMD ["pnpm", "--filter", "@ecom/api", "dev"]
