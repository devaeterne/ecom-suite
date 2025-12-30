# scripts/down.sh
REMOVE_ORPHANS="${REMOVE_ORPHANS:-false}"

DOWN_ARGS=()
if [[ "$REMOVE_ORPHANS" == "true" ]]; then
  DOWN_ARGS+=(--remove-orphans)
fi

docker compose \
  -f docker/compose.base.yml \
  -f docker/compose.api.dev.yml \
  -f docker/compose.tools.yml \
  -f docker/compose.admin.yml \
  -f docker/compose.storefront.yml \
  down "${DOWN_ARGS[@]}"
