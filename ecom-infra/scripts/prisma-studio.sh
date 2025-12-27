#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🧪 Starting Prisma Studio (http://localhost:${PRISMA_STUDIO_PORT:-5555})..."
docker compose --env-file .env -f docker/compose.base.yml -f docker/compose.tools.yml up -d prisma_studio

echo "✅ Prisma Studio up."
