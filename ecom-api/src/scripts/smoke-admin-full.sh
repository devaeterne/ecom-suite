#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-http://localhost:3001}"
EMAIL="${OWNER_EMAIL:-admin@acme.com}"
PASS="${OWNER_PASS:-ChangeMe123!}"

API_BASE="${API_BASE:-$BASE}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "❌ missing dependency: $1"; exit 1; }; }
need curl
need jq
need date

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

# 6) invite
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

# 7) admin sessions list (FIX: response {sessions:[...]} )
echo "🪪 sessions list"
SESSIONS_JSON="$(curl -sS "${AUTH[@]}" \
  "$API_BASE/api/admin/sessions")"

echo "$SESSIONS_JSON" | jq .
SESSION_ID="$(echo "$SESSIONS_JSON" | jq -r '.sessions[0].id // empty')"

if [[ -z "$SESSION_ID" ]]; then
  echo "ℹ️ aktif session yok, revoke single test atlanıyor"
else
  echo "SESSION_ID=$SESSION_ID"
  echo
  echo "🧨 revoke single session"
  curl -sS -X POST "${AUTH[@]}" \
    "$API_BASE/api/admin/sessions/$SESSION_ID/revoke" | jq .
  echo
fi

echo "🔥 revoke all sessions"
curl -sS -X POST "${AUTH[@]}" \
  "$API_BASE/api/admin/sessions/revoke-all" | jq .
echo

# 8) Commit A — Catalog Admin READ sanity
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

echo "✅ COMMIT A SMOKE OK"
echo

# 9) Commit B — Catalog Admin WRITE sanity (NEW)
echo "🧪 Commit B sanity: create category + product + option + value + variant"

TS="$(date +%s)"
CAT_HANDLE="smoke-cat-$TS"
PROD_HANDLE="smoke-prod-$TS"

echo "🗂️ create category ($CAT_HANDLE)"
CAT_RES="$(curl -sS -X POST "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  -d "{\"name\":\"Smoke Category $TS\",\"handle\":\"$CAT_HANDLE\"}" \
  "$API_BASE/api/admin/categories")"
echo "$CAT_RES" | jq .
CATEGORY_ID="$(echo "$CAT_RES" | jq -r '.id // .category.id // empty')"
test -n "$CATEGORY_ID" || { echo "❌ category create failed"; exit 1; }
echo "CATEGORY_ID=$CATEGORY_ID"
echo

echo "📦 create product ($PROD_HANDLE)"
PROD_RES="$(curl -sS -X POST "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  -d "{
    \"title\":\"Smoke Product $TS\",
    \"handle\":\"$PROD_HANDLE\",
    \"status\":\"draft\",
    \"categoryIds\":[\"$CATEGORY_ID\"]
  }" \
  "$API_BASE/api/admin/products")"
echo "$PROD_RES" | jq .
PRODUCT_ID="$(echo "$PROD_RES" | jq -r '.id // .product.id // empty')"
test -n "$PRODUCT_ID" || { echo "❌ product create failed"; exit 1; }
echo "PRODUCT_ID=$PRODUCT_ID"
echo

echo "🧷 create option (Color)"
OPT_RES="$(curl -sS -X POST "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  -d "{\"title\":\"Color\"}" \
  "$API_BASE/api/admin/products/$PRODUCT_ID/options")"
echo "$OPT_RES" | jq .
OPTION_ID="$(echo "$OPT_RES" | jq -r '.id // .option.id // empty')"
test -n "$OPTION_ID" || { echo "❌ option create failed"; exit 1; }
echo "OPTION_ID=$OPTION_ID"
echo

echo "🎨 add option value (Red)"
VAL_RES="$(curl -sS -X POST "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  -d "{\"value\":\"Red\"}" \
  "$API_BASE/api/admin/options/$OPTION_ID/values")"
echo "$VAL_RES" | jq .
OPTION_VALUE_ID="$(echo "$VAL_RES" | jq -r '.id // .value.id // empty')"
test -n "$OPTION_VALUE_ID" || { echo "❌ option value add failed"; exit 1; }
echo "OPTION_VALUE_ID=$OPTION_VALUE_ID"
echo

echo "🧩 create variant"
VAR_RES="$(curl -sS -X POST "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  -d "{\"title\":\"Red Variant\",\"sku\":\"SMOKE-$TS\"}" \
  "$API_BASE/api/admin/products/$PRODUCT_ID/variants")"
echo "$VAR_RES" | jq .
VARIANT_ID="$(echo "$VAR_RES" | jq -r '.id // .variant.id // empty')"
test -n "$VARIANT_ID" || { echo "❌ variant create failed"; exit 1; }
echo "VARIANT_ID=$VARIANT_ID"
echo

echo "📌 sanity read-back product detail"
curl -sS "${AUTH[@]}" "${TENANT[@]}" \
  "$API_BASE/api/admin/products/$PRODUCT_ID" | jq .
echo

echo "📌 sanity read-back product variants"
curl -sS "${AUTH[@]}" "${TENANT[@]}" \
  "$API_BASE/api/admin/products/$PRODUCT_ID/variants" | jq .
echo

echo "🚫 unpublish product"
curl -sS -X POST "${AUTH[@]}" "${TENANT[@]}" \
  "$API_BASE/api/admin/products/$PRODUCT_ID/unpublish" | jq .
echo

echo "🧨 delete variant (hard delete expected)"
# variant in-use kontrolü varsa ve kullanımdaysa 409 alırsın; smoke’ta genelde boş olur.
DEL_VAR_CODE="$(curl -sS -o /tmp/del_var.json -w "%{http_code}" \
  -X DELETE "${AUTH[@]}" "${TENANT[@]}" \
  "$API_BASE/api/admin/variants/$VARIANT_ID")"

cat /tmp/del_var.json | jq . || true
if [[ "$DEL_VAR_CODE" = "409" ]]; then
  echo "ℹ️ variant delete -> 409 (in use) beklenen/ok"
elif [[ "$DEL_VAR_CODE" =~ ^2 ]]; then
  echo "✅ variant delete ok"
else
  echo "❌ variant delete failed (HTTP $DEL_VAR_CODE)"
  exit 1
fi
echo

echo "🗑️ delete product (soft delete expected)"
curl -sS -X DELETE "${AUTH[@]}" "${TENANT[@]}" \
  "$API_BASE/api/admin/products/$PRODUCT_ID" | jq .
echo

echo "🗑️ delete category (hard delete; link cleanup sonrası 2xx beklenir)"
DEL_CAT_CODE="$(curl -sS -o /tmp/del_cat.json -w "%{http_code}" \
  -X DELETE "${AUTH[@]}" "${TENANT[@]}" \
  "$API_BASE/api/admin/categories/$CATEGORY_ID")"

cat /tmp/del_cat.json | jq . || true
if [[ "$DEL_CAT_CODE" =~ ^2 ]]; then
  echo "✅ category delete ok"
else
  echo "❌ category delete failed (HTTP $DEL_CAT_CODE)"
  exit 1
fi
echo


echo "✅ COMMIT B SMOKE OK"
