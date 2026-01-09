#!/usr/bin/env bash
set -euo pipefail

############################################
# Logging
############################################
LOG_FILE="${LOG_FILE:-/tmp/smoke-admin-$(date +%Y%m%d_%H%M%S).log}"
exec > >(tee -a "$LOG_FILE") 2>&1
echo "LOG_FILE=$LOG_FILE"
echo

############################################
# Helpers
############################################
need() { command -v "$1" >/dev/null 2>&1 || { echo "❌ missing dependency: $1"; exit 1; }; }
expect_2xx () { [[ "$1" =~ ^2 ]]; }
step() { echo; echo "🧩 $*"; }
reqline() { echo "➡️  $1 $2"; }

need curl
need jq
need date

############################################
# Env / Config
############################################
BASE="${BASE:-http://localhost:3001}"
API="$BASE/api"

EMAIL="${OWNER_EMAIL:-admin@acme.com}"
PASS="${OWNER_PASS:-ChangeMe123!}"

############################################
# Admin Login
############################################
step "Admin login"
reqline "POST" "$API/admin/auth/login"

ADMIN_ACCESS_TOKEN="$(
  curl -sS -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
    "$API/admin/auth/login" | jq -r '.accessToken'
)"

test "${#ADMIN_ACCESS_TOKEN}" -gt 50 || { echo "❌ admin token alınamadı"; exit 1; }

AUTH=(-H "Authorization: Bearer $ADMIN_ACCESS_TOKEN")
JSON=(-H "Content-Type: application/json")

echo "✅ admin login ok"

############################################
# Tenant resolve
############################################
step "Resolve tenant"
reqline "GET" "$API/admin/tenants/me"

TENANT_JSON="$(curl -sS "${AUTH[@]}" "$API/admin/tenants/me")"
TENANT_ID="$(echo "$TENANT_JSON" | jq -r '.id')"

test -n "$TENANT_ID" || { echo "❌ tenantId yok"; exit 1; }
TENANT=(-H "x-tenant-id: $TENANT_ID")

echo "TENANT_ID=$TENANT_ID"

############################################
# Admin helper: call (body + http_code)
# - data varsa Content-Type gönderir
# - data yoksa sadece auth+tenant ile gider
############################################
admin_call_code() {
  local method="$1"; shift
  local url="$1"; shift
  local data="${1:-}"
  local out="${2:-/tmp/admin_body.json}"

  if [ -n "$data" ]; then
    curl -sS -o "$out" -w "%{http_code}" \
      -X "$method" "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
      "$url" -d "$data"
  else
    curl -sS -o "$out" -w "%{http_code}" \
      -X "$method" "${AUTH[@]}" "${TENANT[@]}" \
      "$url"
  fi
}

############################################
# Store helper: always sends JSON body if data provided
############################################
store_call_code() {
  local method="$1"; shift
  local url="$1"; shift
  local data="${1:-}"
  local out="${2:-/tmp/store_body.json}"

  if [ -n "$data" ]; then
    curl -sS -o "$out" -w "%{http_code}" \
      -X "$method" "${STORE_AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
      "$url" -d "$data"
  else
    # ⚠️ JSON endpointlerde body bekleniyorsa bunu kullanmıyoruz.
    curl -sS -o "$out" -w "%{http_code}" \
      -X "$method" "${STORE_AUTH[@]}" "${TENANT[@]}" \
      "$url"
  fi
}

############################################
# Commit C — Inventory Location + set-default + verify default
############################################
step "Commit C — Inventory Location + set-default + verify default"

TS="$(date +%s)"
LOC_CODE="smoke-loc-$TS"
LOC_NAME="Smoke Location $TS"

reqline "POST" "$API/admin/inventory/locations"
CREATE_PAYLOAD="$(jq -cn --arg name "$LOC_NAME" --arg code "$LOC_CODE" '{name:$name, code:$code}')"
CODE="$(admin_call_code POST "$API/admin/inventory/locations" "$CREATE_PAYLOAD" /tmp/loc_create.json)"
cat /tmp/loc_create.json | jq .
expect_2xx "$CODE" || { echo "❌ location create failed (HTTP $CODE)"; exit 1; }

LOC_A_ID="$(jq -r '.location.id // .id // empty' /tmp/loc_create.json)"
test -n "$LOC_A_ID" || { echo "❌ LOC_A_ID yok"; exit 1; }
echo "✅ LOC_A_ID=$LOC_A_ID"

reqline "POST" "$API/admin/inventory/locations/$LOC_A_ID/set-default"
CODE="$(admin_call_code POST "$API/admin/inventory/locations/$LOC_A_ID/set-default" '{}' /tmp/loc_set_default.json)"
expect_2xx "$CODE" || { echo "❌ set-default failed (HTTP $CODE)"; cat /tmp/loc_set_default.json; exit 1; }
echo "✅ location set-default ok"

reqline "GET" "$API/admin/inventory/locations?take=100&skip=0"
CODE="$(admin_call_code GET "$API/admin/inventory/locations?take=100&skip=0" "" /tmp/loc_list.json)"
expect_2xx "$CODE" || { echo "❌ locations list failed (HTTP $CODE)"; exit 1; }

DEFAULT_LOC_ID="$(
  jq -r '(.locations // .items // []) | map(select(.isDefault==true)) | .[0].id // empty' /tmp/loc_list.json
)"
test -n "$DEFAULT_LOC_ID" || { echo "❌ default location bulunamadı"; exit 1; }

echo "✅ DEFAULT_LOC_ID=$DEFAULT_LOC_ID"

# determinism: default must be ours
if [ "$DEFAULT_LOC_ID" != "$LOC_A_ID" ]; then
  echo "❌ Default location mismatch!"
  echo "   expected LOC_A_ID=$LOC_A_ID"
  echo "   got      DEFAULT_LOC_ID=$DEFAULT_LOC_ID"
  exit 1
fi
echo "✅ default verification ok"

############################################
# Commit D — Inventory E2E
############################################
step "Commit D — Inventory E2E"

# 1) Create product+variant
reqline "POST" "$API/admin/categories"
CAT_RES="$(curl -sS -X POST "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  -d "{\"name\":\"Smoke Cat $TS\",\"handle\":\"smoke-cat-$TS\"}" \
  "$API/admin/categories")"
CATEGORY_ID="$(echo "$CAT_RES" | jq -r '.id // .category.id // empty')"
test -n "$CATEGORY_ID" || { echo "❌ category create failed"; echo "$CAT_RES"; exit 1; }

reqline "POST" "$API/admin/products"
PROD_RES="$(curl -sS -X POST "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  -d "{\"title\":\"Smoke Prod $TS\",\"handle\":\"smoke-prod-$TS\",\"status\":\"draft\",\"categoryIds\":[\"$CATEGORY_ID\"]}" \
  "$API/admin/products")"
PRODUCT_ID="$(echo "$PROD_RES" | jq -r '.id // .product.id // empty')"
test -n "$PRODUCT_ID" || { echo "❌ product create failed"; echo "$PROD_RES"; exit 1; }

reqline "POST" "$API/admin/products/$PRODUCT_ID/variants"
VAR_RES="$(curl -sS -X POST "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  -d "{\"title\":\"Variant\",\"sku\":\"SMOKE-$TS\"}" \
  "$API/admin/products/$PRODUCT_ID/variants")"
VARIANT_ID="$(echo "$VAR_RES" | jq -r '.id // .variant.id // empty')"
test -n "$VARIANT_ID" || { echo "❌ variant create failed"; echo "$VAR_RES"; exit 1; }
echo "✅ VARIANT_ID=$VARIANT_ID"

# 2) Upsert inventory level (use DEFAULT_LOC_ID)
reqline "PUT" "$API/admin/inventory/levels"
UP_PAYLOAD="$(jq -cn \
  --arg locationId "$DEFAULT_LOC_ID" \
  --arg variantId "$VARIANT_ID" \
  '{items:[{locationId:$locationId,variantId:$variantId,stockedQuantity:10}] }')"
CODE="$(admin_call_code PUT "$API/admin/inventory/levels" "$UP_PAYLOAD" /tmp/levels.json)"
cat /tmp/levels.json | jq .
expect_2xx "$CODE" || { echo "❌ level upsert failed (HTTP $CODE)"; exit 1; }
echo "✅ inventory stocked (default location)"


# --- determinism: enforce default AGAIN right before store/cart ---
reqline "POST" "$API/admin/inventory/locations/$LOC_A_ID/set-default"
CODE="$(admin_call_code POST "$API/admin/inventory/locations/$LOC_A_ID/set-default" '{}' /tmp/loc_set_default2.json)"
expect_2xx "$CODE" || { echo "❌ set-default(2) failed (HTTP $CODE)"; cat /tmp/loc_set_default2.json; exit 1; }

reqline "GET" "$API/admin/inventory/locations?take=100&skip=0"
CODE="$(admin_call_code GET "$API/admin/inventory/locations?take=100&skip=0" "" /tmp/loc_list2.json)"
expect_2xx "$CODE" || { echo "❌ locations list failed (HTTP $CODE)"; exit 1; }

DEFAULTS_CNT="$(jq -r '(.locations // .items // []) | map(select(.isDefault==true)) | length' /tmp/loc_list2.json)"
DEFAULT_LOC_ID="$(jq -r '(.locations // .items // []) | map(select(.isDefault==true)) | .[0].id // empty' /tmp/loc_list2.json)"

echo "✅ DEFAULTS_CNT=$DEFAULTS_CNT"
echo "✅ DEFAULT_LOC_ID=$DEFAULT_LOC_ID"

# must be unique + must be ours
test "$DEFAULTS_CNT" -eq 1 || { echo "❌ multiple default locations detected"; jq '.locations // .items' /tmp/loc_list2.json; exit 1; }
test "$DEFAULT_LOC_ID" = "$LOC_A_ID" || { echo "❌ default mismatch: expected $LOC_A_ID got $DEFAULT_LOC_ID"; exit 1; }

# sanity: inventory level must exist at default
reqline "GET" "$API/admin/inventory/levels?locationId=$DEFAULT_LOC_ID&variantId=$VARIANT_ID"
CODE="$(admin_call_code GET "$API/admin/inventory/levels?locationId=$DEFAULT_LOC_ID&variantId=$VARIANT_ID" "" /tmp/levels_check.json)"
cat /tmp/levels_check.json | jq .
expect_2xx "$CODE" || { echo "❌ levels check failed"; exit 1; }

############################################
# Store auth (register)
############################################
step "Store auth"

BUYER_EMAIL="buyer-$TS@acme.com"
BUYER_PASS="Passw0rd!"

reqline "POST" "$API/store/auth/register"
STORE_ACCESS_TOKEN="$(
  curl -sS -H "Content-Type: application/json" \
    -d "{\"email\":\"$BUYER_EMAIL\",\"password\":\"$BUYER_PASS\",\"firstName\":\"B\",\"lastName\":\"U\"}" \
    "$API/store/auth/register" | jq -r '.accessToken // empty'
)"
test -n "$STORE_ACCESS_TOKEN" || { echo "❌ store token yok"; exit 1; }

STORE_AUTH=(-H "Authorization: Bearer $STORE_ACCESS_TOKEN")
echo "✅ store auth ok"

############################################
# Store flow: Cart -> Line item -> Checkout -> Reserve
############################################
step "Cart create"

# ✅ FIX: /store/cart endpoint JSON body istiyor. Boş body gönderme; "{}" gönder.
reqline "POST" "$API/store/cart"
CART_CODE="$(store_call_code POST "$API/store/cart" '{}' /tmp/cart.json)"
cat /tmp/cart.json | jq .
expect_2xx "$CART_CODE" || { echo "❌ cart create failed (HTTP $CART_CODE)"; exit 1; }

CART_ID="$(jq -r '.cart.id // .id // empty' /tmp/cart.json)"
test -n "$CART_ID" && [ "$CART_ID" != "null" ] || { echo "❌ CART_ID yok"; exit 1; }
echo "✅ CART_ID=$CART_ID"

step "Add line item"
reqline "POST" "$API/store/cart/line-items"
ADD_RES="$(curl -sS -X POST "${STORE_AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  -d "{\"variantId\":\"$VARIANT_ID\",\"quantity\":1}" \
  "$API/store/cart/line-items")"

echo "$ADD_RES" | jq .

# 🔥 KRİTİK: backend bu endpoint’te yeni cart yaratmış olabilir
NEW_CART_ID="$(echo "$ADD_RES" | jq -r '.cart.id // empty')"
test -n "$NEW_CART_ID" || { echo "❌ add line item response cart.id yok"; exit 1; }

CART_ID="$NEW_CART_ID"
echo "✅ CART_ID (effective)=$CART_ID"
echo
# Not: locationId desteklenmiyorsa ignore edilir; destekleniyorsa deterministik olur.
ADD_PAYLOAD="$(jq -cn \
  --arg variantId "$VARIANT_ID" \
  --arg locationId "$DEFAULT_LOC_ID" \
  '{variantId:$variantId, quantity:1, locationId:$locationId}')"

ADD_CODE="$(store_call_code POST "$API/store/cart/line-items" "$ADD_PAYLOAD" /tmp/add_item.json)"
cat /tmp/add_item.json | jq .
expect_2xx "$ADD_CODE" || { echo "❌ add line item failed (HTTP $ADD_CODE)"; exit 1; }
echo "✅ line item ok"

step "Checkout create"
reqline "POST" "$API/store/checkout"


CHECKOUT_PAYLOAD="$(jq -cn --arg cartId "$CART_ID" '{cartId:$cartId}')"
CHK_CODE="$(store_call_code POST "$API/store/checkout" "$CHECKOUT_PAYLOAD" /tmp/checkout.json)"
cat /tmp/checkout.json | jq .
expect_2xx "$CHK_CODE" || { echo "❌ checkout create failed (HTTP $CHK_CODE)"; exit 1; }

CHECKOUT_ID="$(jq -r '.checkout.id // .id // empty' /tmp/checkout.json)"
test -n "$CHECKOUT_ID" && [ "$CHECKOUT_ID" != "null" ] || { echo "❌ CHECKOUT_ID yok"; exit 1; }
echo "✅ CHECKOUT_ID=$CHECKOUT_ID"

step "Reserve stock"
reqline "POST" "$API/store/checkouts/$CHECKOUT_ID/reserve-stock"

RESERVE_PAYLOAD="$(jq -cn \
  --arg locationId "$DEFAULT_LOC_ID" \
  --arg variantId "$VARIANT_ID" \
  '{locationId:$locationId, items:[{variantId:$variantId, quantity:1}] }')"

RES_CODE="$(store_call_code POST "$API/store/checkouts/$CHECKOUT_ID/reserve-stock" "$RESERVE_PAYLOAD" /tmp/reserve.json)"
cat /tmp/reserve.json | jq .
expect_2xx "$RES_CODE" || { echo "❌ reserve failed (HTTP $RES_CODE)"; exit 1; }
echo "✅ reserve ok"

############################################
# Assert reservation exists (ADMIN)
############################################
step "Assert reservation (admin)"
reqline "GET" "$API/admin/inventory/reservations?checkoutId=$CHECKOUT_ID&status=ACTIVE&take=20&skip=0"

CODE="$(admin_call_code GET "$API/admin/inventory/reservations?checkoutId=$CHECKOUT_ID&status=ACTIVE&take=20&skip=0" "" /tmp/res.json)"
cat /tmp/res.json | jq .
expect_2xx "$CODE" || { echo "❌ reservations list failed (HTTP $CODE)"; exit 1; }

CNT="$(jq -r '(.reservations // .items // []) | length' /tmp/res.json)"
test "$CNT" -ge 1 || { echo "❌ reservation bulunamadı"; exit 1; }

echo
echo "🎉 Inventory E2E GREEN — smoke tamam"
echo
echo "export TENANT_ID=$TENANT_ID"
echo "export ADMIN_ACCESS_TOKEN=$ADMIN_ACCESS_TOKEN"
echo "export STORE_ACCESS_TOKEN=$STORE_ACCESS_TOKEN"
