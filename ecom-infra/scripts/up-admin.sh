#!/usr/bin/env bash
set -euo pipefail

INFRA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUITE_DIR="$(cd "$INFRA_DIR/.." && pwd)"
cd "$INFRA_DIR"

ENV_FILE="$INFRA_DIR/.env"
if [[ -f "$SUITE_DIR/.env" ]]; then
  ENV_FILE="$SUITE_DIR/.env"
fi

docker compose --env-file "$ENV_FILE" \
  -f docker/compose.base.yml \
  -f docker/compose.admin.dev.yml \
  up -d --build

docker logs -f ecom_admin
