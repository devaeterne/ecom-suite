# scripts/logs.sh
ENV_MODE="${ENV_MODE:-dev}"   # dev | prod

API_COMPOSE="docker/compose.api.dev.yml"
if [[ "$ENV_MODE" == "prod" ]]; then
  API_COMPOSE="docker/compose.api.prod.yml"
fi

docker compose \
  -f docker/compose.base.yml \
  -f "$API_COMPOSE" \
  -f docker/compose.tools.yml \
  -f docker/compose.admin.yml \
  -f docker/compose.storefront.yml \
  logs -f --tail=200 "$SERVICE"
