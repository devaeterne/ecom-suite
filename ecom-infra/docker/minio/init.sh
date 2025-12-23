#!/usr/bin/env sh
set -e

MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://minio:9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-minioadmin}"
MINIO_BUCKET="${MINIO_BUCKET:-ecom}"
MINIO_REGION="${MINIO_REGION:-eu-central-1}"

echo "⏳ Waiting for MinIO at ${MINIO_ENDPOINT} ..."

i=0
until mc alias set local "${MINIO_ENDPOINT}" "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}" >/dev/null 2>&1; do
  i=$((i+1))
  if [ "$i" -ge 60 ]; then
    echo "❌ MinIO not reachable after 120 seconds"
    exit 1
  fi
  sleep 2
done

echo "✅ MinIO reachable."

echo "📦 Ensuring bucket '${MINIO_BUCKET}'..."
mc mb -p "local/${MINIO_BUCKET}" || true

echo "🌍 Setting region '${MINIO_REGION}' for bucket..."
mc admin bucket remote set local "${MINIO_BUCKET}" \
  --service "s3" \
  --region "${MINIO_REGION}" >/dev/null 2>&1 || true

echo "🔓 Setting public download policy..."
mc anonymous set download "local/${MINIO_BUCKET}" || true

echo "📁 Creating standard folders..."
mc mkdir -p "local/${MINIO_BUCKET}/products" || true
mc mkdir -p "local/${MINIO_BUCKET}/categories" || true
mc mkdir -p "local/${MINIO_BUCKET}/brands" || true
mc mkdir -p "local/${MINIO_BUCKET}/users" || true

echo "✅ MinIO initialization completed."
