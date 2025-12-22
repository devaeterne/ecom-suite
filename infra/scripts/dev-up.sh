#!/usr/bin/env bash
set -euo pipefail

# root .env varsa onu yükle, yoksa .env.example ile devam edersin
if [ -f ".env" ]; then
  echo "✅ .env bulundu"
else
  echo "ℹ️ .env yok. İstersen: cp .env.example .env"
fi

docker compose -f infra/docker/docker-compose.yml up -d --build
docker compose -f infra/docker/docker-compose.yml ps
