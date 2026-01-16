# syntax=docker/dockerfile:1.6

################
# deps (cache) #
################
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable

# pnpm manifest'ler
COPY package.json pnpm-lock.yaml ./

# Prod build için devDeps gerekir (next build)
RUN pnpm install --frozen-lockfile

############
# builder  #
############
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
RUN pnpm build

############
# runner   #
############
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Güvenlik: non-root kullanıcı
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Sadece runtime için gerekenleri taşı
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000
CMD ["pnpm", "start", "-p", "3000"]
