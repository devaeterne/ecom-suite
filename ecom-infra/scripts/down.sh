#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🧹 Stopping all ecom stacks (base + api + tools + admin + storefront)..."
docker compose \
  -f docker/compose.base.yml \
  -f docker/compose.api.yml \
  -f docker/compose.tools.yml \
  -f docker/compose.admin.yml \
  -f docker/compose.storefront.yml \
  down

echo "✅ Down."
