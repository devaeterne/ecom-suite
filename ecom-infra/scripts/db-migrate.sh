#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🗃️ Running Prisma migrate deploy..."
docker compose -f docker/compose.base.yml -f docker/compose.tools.yml run --rm db_tools \
  sh -lc "cd /app && pnpm prisma migrate deploy"

echo "✅ Migrations applied."
