SHELL := /bin/bash

.PHONY: help up bootstrap rebuild logs ps

help:
	@echo ""
	@echo "ecom-suite (script-driven)"
	@echo ""
	@echo "make up        -> attach api (no-recreate)"
	@echo "make bootstrap -> first-time up (base + api)"
	@echo "make rebuild   -> rebuild api image only"
	@echo "make logs      -> api logs"
	@echo ""

up:
	@bash scripts/attach-api-dev.sh

bootstrap:
	@bash scripts/up-dev.sh

rebuild:
	@echo "🔨 Rebuilding API image only"
	@docker compose --env-file .env \
	  -f docker/compose.base.yml \
	  -f docker/compose.api.dev.yml \
	  build --no-cache api
	@docker compose --env-file .env \
	  -f docker/compose.base.yml \
	  -f docker/compose.api.dev.yml \
	  up -d api
down:
	@docker compose --env-file .env \
	  -f docker/compose.base.yml \
	  -f docker/compose.api.dev.yml \
	  down
logs:
	@docker compose --env-file .env \
	  -f docker/compose.base.yml \
	  -f docker/compose.api.dev.yml \
	  logs -f api

ps:
	@docker ps --format "table {{.Names}}\t{{.Status}}" | grep ecom_ || true
