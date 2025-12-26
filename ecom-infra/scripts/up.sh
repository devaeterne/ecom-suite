#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🚀 Bringing up base stack (postgres, redis, minio)..."
docker compose --env-file .env -f docker/compose.base.yml \
  -f docker/compose.api.dev.yml \
  up -d --build

echo "✅ Base stack is up."
echo "Next:"
echo "  - Tools:      docker compose --env-file .env -f docker/compose.base.yml -f docker/compose.tools.yml up -d --build"
echo "  - Admin:      docker compose --env-file .env -f docker/compose.base.yml -f docker/compose.admin.yml up -d --build"
echo "  - Storefront: docker compose --env-file .env -f docker/compose.base.yml -f docker/compose.storefront.yml up -d --build"
