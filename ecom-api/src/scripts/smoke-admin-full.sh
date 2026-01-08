#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-http://localhost:3001}"
EMAIL="${OWNER_EMAIL:-admin@acme.com}"
PASS="${OWNER_PASS:-ChangeMe123!}"

# Tek kaynak: API_BASE
API_BASE="${API_BASE:-$BASE}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "❌ missing dependency: $1"; exit 1; }; }
need curl
need jq

echo "🔐 Login…"

TOKEN="$(curl -sS \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  "$API_BASE/api/admin/auth/login" | jq -r '.accessToken')"

echo "TOKEN_LEN=${#TOKEN}"
test "${#TOKEN}" -gt 50 || { echo "❌ token alınamadı"; exit 1; }

AUTH=(-H "Authorization: Bearer $TOKEN")
JSON=(-H "Content-Type: application/json")

echo "✅ login ok"
echo

# 1) RBAC bootstrap
echo "🧱 RBAC bootstrap"
curl -sS -X POST "${AUTH[@]}" \
  "$API_BASE/api/admin/rbac/bootstrap" | jq .
echo

# 2) tenants/me
echo "🏢 tenant resolve"
TENANT_JSON="$(curl -sS "${AUTH[@]}" \
  "$API_BASE/api/admin/tenants/me")"

echo "$TENANT_JSON" | jq .
TENANT_ID="$(echo "$TENANT_JSON" | jq -r '.id')"
test -n "$TENANT_ID" || { echo "❌ tenantId yok"; exit 1; }

echo "TENANT_ID=$TENANT_ID"
echo

TENANT=(-H "x-tenant-id: $TENANT_ID")

# 3) roles list
echo "🧑‍⚖️ roles list"
curl -sS "${AUTH[@]}" "${TENANT[@]}" \
  "$API_BASE/api/admin/roles" | jq .
echo

# 4) identities list
echo "👤 identities list"
curl -sS "${AUTH[@]}" "${TENANT[@]}" \
  "$API_BASE/api/admin/identities" | jq .
echo

# 5) identity create
INV_EMAIL="invitee-$(date +%s)@acme.com"
echo "📨 create identity ($INV_EMAIL)"

CREATE_ID_RES="$(curl -sS -X POST \
  "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  -d "{\"email\":\"$INV_EMAIL\",\"roleScope\":\"STAFF\"}" \
  "$API_BASE/api/admin/identities")"

echo "$CREATE_ID_RES" | jq .

IDENTITY_ID="$(echo "$CREATE_ID_RES" | jq -r '.id')"
test -n "$IDENTITY_ID" || { echo "❌ identity create failed"; exit 1; }

echo "IDENTITY_ID=$IDENTITY_ID"
echo

# 6) invite (FIXED)
echo "✉️ invite identity"
INVITE_RES="$(curl -sS \
  "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  -X POST "$API_BASE/api/admin/identities/$IDENTITY_ID/invite" \
  -d '{}')"

echo "$INVITE_RES" | jq .

OK="$(echo "$INVITE_RES" | jq -r '.ok // empty')"
test "$OK" = "true" || { echo "❌ invite failed"; exit 1; }

echo
echo "🎉 ADMIN SMOKE OK"
echo "tenant=$TENANT_ID identity=$IDENTITY_ID"
echo

# 7) admin sessions list
echo "🪪 sessions list"
SESSIONS_JSON="$(curl -sS "${AUTH[@]}" \
  "$API_BASE/api/admin/sessions")"

echo "$SESSIONS_JSON" | jq .
SESSION_ID="$(echo "$SESSIONS_JSON" | jq -r '.items[0].id // empty')"

if [[ -z "$SESSION_ID" ]]; then
  echo "ℹ️ aktif session yok, revoke test atlanıyor"
else
  echo "SESSION_ID=$SESSION_ID"
  echo

  # 7a) revoke single session
  echo "🧨 revoke single session"
  curl -sS -X POST "${AUTH[@]}" \
    "$API_BASE/api/admin/sessions/$SESSION_ID/revoke" | jq .
  echo
fi

# 7b) revoke all sessions for identity
echo "🔥 revoke all sessions"
curl -sS -X POST "${AUTH[@]}" \
  "$API_BASE/api/admin/sessions/revoke-all" | jq .
echo

# 8) Commit A — Catalog Admin READ sanity (NEW)
echo "📦 Commit A sanity: catalog admin read"

echo "📂 categories (flat)"
CATS_FLAT="$(curl -sS "${AUTH[@]}" "${TENANT[@]}" \
  "$API_BASE/api/admin/categories?view=flat")"
echo "$CATS_FLAT" | jq .
echo

echo "🌳 categories (tree)"
CATS_TREE="$(curl -sS "${AUTH[@]}" "${TENANT[@]}" \
  "$API_BASE/api/admin/categories?view=tree")"
echo "$CATS_TREE" | jq .
echo

echo "🛍️ products list"
PRODS="$(curl -sS "${AUTH[@]}" "${TENANT[@]}" \
  "$API_BASE/api/admin/products?limit=10&offset=0")"
echo "$PRODS" | jq .
echo

PRODUCT_ID="$(echo "$PRODS" | jq -r '.items[0].id // empty')"
if [[ -z "$PRODUCT_ID" ]]; then
  echo "ℹ️ hiç ürün yok, product detail/variants test atlanıyor (seed ile ürün bekleniyorsa burada kontrol et)"
else
  echo "PRODUCT_ID=$PRODUCT_ID"
  echo

  echo "🔎 product detail"
  PROD_DETAIL="$(curl -sS "${AUTH[@]}" "${TENANT[@]}" \
    "$API_BASE/api/admin/products/$PRODUCT_ID")"
  echo "$PROD_DETAIL" | jq .
  echo

  echo "🧩 product variants"
  VARS="$(curl -sS "${AUTH[@]}" "${TENANT[@]}" \
    "$API_BASE/api/admin/products/$PRODUCT_ID/variants")"
  echo "$VARS" | jq .
  echo
fi

echo "✅ COMMIT A SMOKE OK"
