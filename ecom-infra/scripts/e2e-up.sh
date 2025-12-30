#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🚀 E2E stack up (base + api test override)..."
docker compose --env-file .env.e2e \
  -f docker/compose.base.yml \
  -f docker/compose.api.dev.yml \
  -f docker/compose.e2e.yml \
  up -d --build

echo "✅ E2E stack is up."
