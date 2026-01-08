#!/usr/bin/env bash
set -euo pipefail

############################################
# Helpers
############################################
need() { command -v "$1" >/dev/null 2>&1 || { echo "❌ missing dependency: $1"; exit 1; }; }

require_env () {
  local k="$1"
  if [ -z "${!k:-}" ]; then
    echo "❌ Missing env: $k"
    exit 1
  fi
}

need curl
need jq
need date
need wc
need tr

############################################
# Env / Config
############################################
# Backward-compatible token aliases (optional pre-set)
if [ -z "${ADMIN_ACCESS_TOKEN:-}" ] && [ -n "${ADMIN_TOKEN:-}" ]; then
  export ADMIN_ACCESS_TOKEN="$ADMIN_TOKEN"
fi
if [ -z "${ADMIN_ACCESS_TOKEN:-}" ] && [ -n "${ADMIN_JWT:-}" ]; then
  export ADMIN_ACCESS_TOKEN="$ADMIN_JWT"
fi

BASE="${BASE:-http://localhost:3001}"
API_BASE="${API_BASE:-$BASE}"
API="$API_BASE/api"   # ✅ tek yerden /api prefix

EMAIL="${OWNER_EMAIL:-admin@acme.com}"
PASS="${OWNER_PASS:-ChangeMe123!}"

############################################
# Login
############################################
echo "🔐 Login…"

TOKEN="$(curl -sS \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  "$API/admin/auth/login" | jq -r '.accessToken')"

echo "TOKEN_LEN=${#TOKEN}"
test "${#TOKEN}" -gt 50 || { echo "❌ token alınamadı"; exit 1; }

# ✅ Opsiyon A: canonical token export (Commit C bunu kullanacak)
export ADMIN_ACCESS_TOKEN="$TOKEN"

AUTH=(-H "Authorization: Bearer $TOKEN")
JSON=(-H "Content-Type: application/json")

echo "✅ login ok"
echo

############################################
# 1) RBAC bootstrap
############################################
echo "🧱 RBAC bootstrap"
curl -sS -X POST "${AUTH[@]}" \
  "$API/admin/rbac/bootstrap" | jq .
echo

############################################
# 2) tenants/me
############################################
echo "🏢 tenant resolve"
TENANT_JSON="$(curl -sS "${AUTH[@]}" \
  "$API/admin/tenants/me")"

echo "$TENANT_JSON" | jq .
TENANT_ID="$(echo "$TENANT_JSON" | jq -r '.id')"
test -n "$TENANT_ID" || { echo "❌ tenantId yok"; exit 1; }

echo "TENANT_ID=$TENANT_ID"
echo

TENANT=(-H "x-tenant-id: $TENANT_ID")

############################################
# 3) roles list
############################################
echo "🧑‍⚖️ roles list"
curl -sS "${AUTH[@]}" "${TENANT[@]}" \
  "$API/admin/roles" | jq .
echo

############################################
# 4) identities list
############################################
echo "👤 identities list"
curl -sS "${AUTH[@]}" "${TENANT[@]}" \
  "$API/admin/identities" | jq .
echo

############################################
# 5) identity create
############################################
INV_EMAIL="invitee-$(date +%s)@acme.com"
echo "📨 create identity ($INV_EMAIL)"

CREATE_ID_RES="$(curl -sS -X POST \
  "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  -d "{\"email\":\"$INV_EMAIL\",\"roleScope\":\"STAFF\"}" \
  "$API/admin/identities")"

echo "$CREATE_ID_RES" | jq .

IDENTITY_ID="$(echo "$CREATE_ID_RES" | jq -r '.id')"
test -n "$IDENTITY_ID" || { echo "❌ identity create failed"; exit 1; }

echo "IDENTITY_ID=$IDENTITY_ID"
echo

############################################
# 6) invite
############################################
echo "✉️ invite identity"
INVITE_RES="$(curl -sS \
  "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  -X POST "$API/admin/identities/$IDENTITY_ID/invite" \
  -d '{}')"

echo "$INVITE_RES" | jq .

OK="$(echo "$INVITE_RES" | jq -r '.ok // empty')"
test "$OK" = "true" || { echo "❌ invite failed"; exit 1; }

echo
echo "🎉 ADMIN SMOKE OK"
echo "tenant=$TENANT_ID identity=$IDENTITY_ID"
echo

############################################
# 7) admin sessions list + revoke tests
############################################
echo "🪪 sessions list"
SESSIONS_JSON="$(curl -sS "${AUTH[@]}" \
  "$API/admin/sessions")"

echo "$SESSIONS_JSON" | jq .
SESSION_ID="$(echo "$SESSIONS_JSON" | jq -r '.sessions[0].id // empty')"

if [[ -z "$SESSION_ID" ]]; then
  echo "ℹ️ aktif session yok, revoke single test atlanıyor"
else
  echo "SESSION_ID=$SESSION_ID"
  echo
  echo "🧨 revoke single session"
  curl -sS -X POST "${AUTH[@]}" \
    "$API/admin/sessions/$SESSION_ID/revoke" | jq .
  echo
fi

echo "🔥 revoke all sessions"
curl -sS -X POST "${AUTH[@]}" \
  "$API/admin/sessions/revoke-all" | jq .
echo

############################################
# 8) Commit A — Catalog Admin READ sanity
############################################
echo "📦 Commit A sanity: catalog admin read"

echo "📂 categories (flat)"
CATS_FLAT="$(curl -sS "${AUTH[@]}" "${TENANT[@]}" \
  "$API/admin/categories?view=flat")"
echo "$CATS_FLAT" | jq .
echo

echo "🌳 categories (tree)"
CATS_TREE="$(curl -sS "${AUTH[@]}" "${TENANT[@]}" \
  "$API/admin/categories?view=tree")"
echo "$CATS_TREE" | jq .
echo

echo "🛍️ products list"
PRODS="$(curl -sS "${AUTH[@]}" "${TENANT[@]}" \
  "$API/admin/products?limit=10&offset=0")"
echo "$PRODS" | jq .
echo

echo "✅ COMMIT A SMOKE OK"
echo

############################################
# 9) Commit B — Catalog Admin WRITE sanity
############################################
echo "🧪 Commit B sanity: create category + product + option + value + variant"

TS="$(date +%s)"
CAT_HANDLE="smoke-cat-$TS"
PROD_HANDLE="smoke-prod-$TS"

echo "🗂️ create category ($CAT_HANDLE)"
CAT_RES="$(curl -sS -X POST "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  -d "{\"name\":\"Smoke Category $TS\",\"handle\":\"$CAT_HANDLE\"}" \
  "$API/admin/categories")"
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
  "$API/admin/products")"
echo "$PROD_RES" | jq .
PRODUCT_ID="$(echo "$PROD_RES" | jq -r '.id // .product.id // empty')"
test -n "$PRODUCT_ID" || { echo "❌ product create failed"; exit 1; }
echo "PRODUCT_ID=$PRODUCT_ID"
echo

echo "🧷 create option (Color)"
OPT_RES="$(curl -sS -X POST "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  -d "{\"title\":\"Color\"}" \
  "$API/admin/products/$PRODUCT_ID/options")"
echo "$OPT_RES" | jq .
OPTION_ID="$(echo "$OPT_RES" | jq -r '.id // .option.id // empty')"
test -n "$OPTION_ID" || { echo "❌ option create failed"; exit 1; }
echo "OPTION_ID=$OPTION_ID"
echo

echo "🎨 add option value (Red)"
VAL_RES="$(curl -sS -X POST "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  -d "{\"value\":\"Red\"}" \
  "$API/admin/options/$OPTION_ID/values")"
echo "$VAL_RES" | jq .
OPTION_VALUE_ID="$(echo "$VAL_RES" | jq -r '.id // .value.id // empty')"
test -n "$OPTION_VALUE_ID" || { echo "❌ option value add failed"; exit 1; }
echo "OPTION_VALUE_ID=$OPTION_VALUE_ID"
echo

echo "🧩 create variant"
VAR_RES="$(curl -sS -X POST "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  -d "{\"title\":\"Red Variant\",\"sku\":\"SMOKE-$TS\"}" \
  "$API/admin/products/$PRODUCT_ID/variants")"
echo "$VAR_RES" | jq .
VARIANT_ID="$(echo "$VAR_RES" | jq -r '.id // .variant.id // empty')"
test -n "$VARIANT_ID" || { echo "❌ variant create failed"; exit 1; }
echo "VARIANT_ID=$VARIANT_ID"
echo

echo "📌 sanity read-back product detail"
curl -sS "${AUTH[@]}" "${TENANT[@]}" \
  "$API/admin/products/$PRODUCT_ID" | jq .
echo

echo "📌 sanity read-back product variants"
curl -sS "${AUTH[@]}" "${TENANT[@]}" \
  "$API/admin/products/$PRODUCT_ID/variants" | jq .
echo

echo "🚫 unpublish product"
curl -sS -X POST "${AUTH[@]}" "${TENANT[@]}" \
  "$API/admin/products/$PRODUCT_ID/unpublish" | jq .
echo

echo "🧨 delete variant (hard delete expected)"
DEL_VAR_CODE="$(curl -sS -o /tmp/del_var.json -w "%{http_code}" \
  -X DELETE "${AUTH[@]}" "${TENANT[@]}" \
  "$API/admin/variants/$VARIANT_ID")"

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

############################################
# Files test BEFORE deleting product/category (link sanity için)
############################################
echo
echo "🧾 files: presigned put/get + complete + link sanity"

TMP_FILE="/tmp/smoke.png"
printf "\x89PNG\r\n\x1a\nsmoke-%s" "$(date +%s)" > "$TMP_FILE"
SIZE="$(wc -c < "$TMP_FILE" | tr -d ' ')"
test -n "$SIZE" || { echo "❌ SIZE hesaplanamadı"; exit 1; }
echo "📦 payload size=$SIZE bytes"

PRESIGN_RES="$(curl -sS -X POST \
  "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  "$API/admin/files/presign-put" \
  -d "{\"filename\":\"smoke.png\",\"contentType\":\"image/png\",\"size\":$SIZE,\"folder\":\"uploads\"}")"

echo "$PRESIGN_RES" | jq .

FILE_ID="$(echo "$PRESIGN_RES" | jq -r '.fileId // empty')"
PUT_URL="$(echo "$PRESIGN_RES" | jq -r '.putUrl // empty')"

test -n "$FILE_ID" || { echo "❌ presign-put failed (fileId yok)"; exit 1; }
test -n "$PUT_URL" || { echo "❌ presign-put failed (putUrl yok)"; exit 1; }

echo "FILE_ID=$FILE_ID"
echo

echo "⬆️ upload put"
PUT_CODE="$(curl -sS -o /tmp/put_body.txt -w "%{http_code}" \
  -X PUT "$PUT_URL" \
  -H "Content-Type: image/png" \
  --data-binary @"$TMP_FILE")"

if [[ "$PUT_CODE" != "200" && "$PUT_CODE" != "204" ]]; then
  echo "❌ PUT failed (HTTP $PUT_CODE)"
  cat /tmp/put_body.txt || true
  exit 1
fi
echo "✅ PUT ok (HTTP $PUT_CODE)"
echo

OBJ_URL="${PUT_URL%%\?*}"
echo "🔎 head object (public): $OBJ_URL"
curl -sS -I "$OBJ_URL" | sed -n '1,12p'
echo

echo "✅ complete"
COMPLETE_CODE="$(curl -sS -o /tmp/complete.json -w "%{http_code}" \
  -X POST "${AUTH[@]}" "${TENANT[@]}" \
  "$API/admin/files/$FILE_ID/complete")"

cat /tmp/complete.json | jq . || cat /tmp/complete.json
if [[ ! "$COMPLETE_CODE" =~ ^2 ]]; then
  echo "❌ COMPLETE failed (HTTP $COMPLETE_CODE)"
  exit 1
fi
echo "✅ COMPLETE ok"
echo

echo "🔐 presign get"
GET_CODE="$(curl -sS -o /tmp/presign_get.json -w "%{http_code}" \
  "${AUTH[@]}" "${TENANT[@]}" \
  "$API/admin/files/$FILE_ID/presign-get")"

cat /tmp/presign_get.json | jq . || cat /tmp/presign_get.json
if [[ ! "$GET_CODE" =~ ^2 ]]; then
  echo "❌ presign-get failed (HTTP $GET_CODE)"
  exit 1
fi

GET_URL="$(cat /tmp/presign_get.json | jq -r '.url // empty')"
test -n "$GET_URL" || { echo "❌ presign-get response url yok"; exit 1; }
echo

echo "🔗 link file -> product"
LINK_CODE="$(curl -sS -o /tmp/link.json -w "%{http_code}" \
  -X POST "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  "$API/admin/files/$FILE_ID/link" \
  -d "{\"entityType\":\"catalog_product\",\"entityId\":\"$PRODUCT_ID\",\"role\":\"GALLERY\",\"sort\":0}")"

cat /tmp/link.json | jq . || cat /tmp/link.json
if [[ ! "$LINK_CODE" =~ ^2 ]]; then
  echo "❌ link failed (HTTP $LINK_CODE)"
  exit 1
fi
echo

echo "📎 entity files list"
ENTITY_CODE="$(curl -sS -o /tmp/entity_files.json -w "%{http_code}" \
  "${AUTH[@]}" "${TENANT[@]}" \
  "$API/admin/files/entity/catalog_product/$PRODUCT_ID")"

cat /tmp/entity_files.json | jq . || cat /tmp/entity_files.json
if [[ ! "$ENTITY_CODE" =~ ^2 ]]; then
  echo "❌ entity files list failed (HTTP $ENTITY_CODE)"
  exit 1
fi
echo

echo "✅ files smoke ok"
echo

############################################
# Now safe to delete product/category
############################################
echo "🗑️ delete product (soft delete expected)"
curl -sS -X DELETE "${AUTH[@]}" "${TENANT[@]}" \
  "$API/admin/products/$PRODUCT_ID" | jq .
echo

echo "🗑️ delete category (hard delete; link cleanup sonrası 2xx beklenir)"
DEL_CAT_CODE="$(curl -sS -o /tmp/del_cat.json -w "%{http_code}" \
  -X DELETE "${AUTH[@]}" "${TENANT[@]}" \
  "$API/admin/categories/$CATEGORY_ID")"

cat /tmp/del_cat.json | jq . || true
if [[ "$DEL_CAT_CODE" =~ ^2 ]]; then
  echo "✅ category delete ok"
else
  echo "❌ category delete failed (HTTP $DEL_CAT_CODE)"
  exit 1
fi
echo

echo "✅ COMMIT B SMOKE OK"
echo
############################################
# Commit C — Inventory Admin sanity (Option A)
# - code unique
# - 409 code conflict => pick existing and continue
############################################

echo
echo "📦 Commit C — Inventory Admin sanity (Option A)"

require_env TENANT_ID
require_env ADMIN_ACCESS_TOKEN

# inventory call wrapper (tenant header kesin)
inv_call() {
  local method="$1"; shift
  local path="$1"; shift
  local data="${1:-}"

  if [ -n "$data" ]; then
    curl -sS -X "$method" \
      -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN" \
      -H "x-tenant-id: $TENANT_ID" \
      -H "Content-Type: application/json" \
      "$BASE$path" \
      -d "$data"
  else
    curl -sS -X "$method" \
      -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN" \
      -H "x-tenant-id: $TENANT_ID" \
      "$BASE$path"
  fi
}

inv_call_code() {
  local method="$1"; shift
  local path="$1"; shift
  local data="${1:-}"
  local out="${2:-/tmp/inv_body.json}"

  if [ -n "$data" ]; then
    curl -sS -o "$out" -w "%{http_code}" \
      -X "$method" \
      -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN" \
      -H "x-tenant-id: $TENANT_ID" \
      -H "Content-Type: application/json" \
      "$BASE$path" \
      -d "$data"
  else
    curl -sS -o "$out" -w "%{http_code}" \
      -X "$method" \
      -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN" \
      -H "x-tenant-id: $TENANT_ID" \
      "$BASE$path"
  fi
}

ts="$(date +%s)"
LOC_CODE="smoke-loc-$ts"
LOC_NAME="Smoke Location A $ts"

echo "🏬 upsert inventory location A (code=$LOC_CODE)"

CREATE_PAYLOAD="$(jq -cn \
  --arg name "$LOC_NAME" \
  --arg code "$LOC_CODE" \
  '{name:$name, code:$code}')"

CREATE_CODE="$(inv_call_code POST "/api/admin/inventory/locations" "$CREATE_PAYLOAD" "/tmp/loc_create.json")"

cat /tmp/loc_create.json | jq . || cat /tmp/loc_create.json
echo "HTTP=$CREATE_CODE"

LOC_A_ID=""

if [[ "$CREATE_CODE" =~ ^2 ]]; then
  LOC_A_ID="$(jq -r '.id // .location.id // empty' /tmp/loc_create.json)"
elif [[ "$CREATE_CODE" = "409" ]]; then
  MSG="$(jq -r '.message // empty' /tmp/loc_create.json)"
  echo "ℹ️ create returned 409 ($MSG). Falling back to list & pick existing…"

  LIST_CODE="$(inv_call_code GET "/api/admin/inventory/locations" "" "/tmp/loc_list.json")"
  cat /tmp/loc_list.json | jq . || cat /tmp/loc_list.json
  test "$LIST_CODE" = "200" || { echo "❌ locations list failed (HTTP $LIST_CODE)"; exit 1; }

  # önce code ile bul, yoksa name ile bul, yoksa ilk kaydı al
  LOC_A_ID="$(jq -r --arg code "$LOC_CODE" --arg name "$LOC_NAME" '
    (.items // .locations // .data // []) as $arr |
    ( $arr[]? | select(.code==$code) | .id ) // 
    ( $arr[]? | select(.name==$name) | .id ) //
    ( $arr[0].id // empty )
  ' /tmp/loc_list.json)"

else
  echo "❌ location create failed (HTTP $CREATE_CODE)"
  exit 1
fi

test -n "$LOC_A_ID" || { echo "❌ LOC_A_ID resolve edilemedi"; exit 1; }
echo "✅ LOC_A_ID=$LOC_A_ID"
echo

echo "📦 list inventory locations"
inv_call GET "/api/admin/inventory/locations" | jq .
echo

echo "📦 list inventory levels (baseline)"
inv_call GET "/api/admin/inventory/levels" | jq .
echo

echo "📦 list inventory reservations (baseline)"
inv_call GET "/api/admin/inventory/reservations" | jq .
echo

echo "✅ COMMIT C SMOKE OK (Option A)"
