# apps/storefront/Dockerfile
FROM node:20-bookworm-slim

WORKDIR /app

RUN corepack enable

# Workspace manifestleri (cache)
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/storefront/package.json apps/storefront/package.json

RUN pnpm install

# Kodlar
COPY packages ./packages
COPY apps/storefront ./apps/storefront

ENV NODE_ENV=development
ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "--filter", "@ecom/storefront", "dev"]
