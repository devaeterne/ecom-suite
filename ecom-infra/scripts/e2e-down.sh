#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🧨 E2E DB reset (force-reset)..."
docker compose --env-file .env.e2e -f docker/compose.base.yml -f docker/compose.tools.yml run --rm db_tools \
  sh -lc "cd /app && pnpm prisma db push --force-reset"

echo "✅ E2E DB reset completed."
