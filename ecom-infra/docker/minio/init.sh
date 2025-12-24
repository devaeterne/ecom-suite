#!/usr/bin/env sh
set -e

# ---- Canonical inputs ----
MINIO_HOST="${MINIO_HOST:-minio}"
MINIO_PORT="${MINIO_PORT:-9000}"

# Root credentials (recommended)
MINIO_ROOT_USER="${MINIO_ROOT_USER:-minio}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-minio_password_123}"

# Bucket & folders
MINIO_BUCKET="${MINIO_BUCKET:-ecom}"

echo "⏳ Waiting for MinIO via mc alias set... (http://${MINIO_HOST}:${MINIO_PORT})"

i=0
until mc alias set local "http://${MINIO_HOST}:${MINIO_PORT}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}" >/dev/null 2>&1; do
  i=$((i+1))
  if [ "$i" -ge 60 ]; then
    echo "❌ MinIO not reachable after 120 seconds"
    echo "   Check credentials + network + minio health"
    exit 1
  fi
  sleep 2
done

echo "✅ MinIO reachable."

echo "📦 Ensuring bucket '${MINIO_BUCKET}'..."
mc mb -p "local/${MINIO_BUCKET}" >/dev/null 2>&1 || true

echo "🔓 Setting public download policy..."
mc anonymous set download "local/${MINIO_BUCKET}" >/dev/null 2>&1 || true

echo "📁 Creating standard folders..."
mc cp /dev/null "local/${MINIO_BUCKET}/products/.keep" >/dev/null 2>&1 || true
mc cp /dev/null "local/${MINIO_BUCKET}/categories/.keep" >/dev/null 2>&1 || true
mc cp /dev/null "local/${MINIO_BUCKET}/brands/.keep" >/dev/null 2>&1 || true
mc cp /dev/null "local/${MINIO_BUCKET}/users/.keep" >/dev/null 2>&1 || true

echo "✅ MinIO initialization completed."
