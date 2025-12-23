#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SERVICE="${1:-}"

if [[ -z "$SERVICE" ]]; then
  echo "Usage: ./scripts/logs.sh <service>"
  echo "Examples:"
  echo "  ./scripts/logs.sh postgres"
  echo "  ./scripts/logs.sh api"
  echo "  ./scripts/logs.sh minio"
  exit 1
fi

docker compose \
  -f docker/compose.base.yml \
  -f docker/compose.api.yml \
  -f docker/compose.tools.yml \
  -f docker/compose.admin.yml \
  -f docker/compose.storefront.yml \
  logs -f --tail=200 "$SERVICE"
