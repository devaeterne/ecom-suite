#!/usr/bin/env bash
set -euo pipefail

############################################
# Expectations
############################################
expect_400 () { [ "$1" = "400" ]; }
expect_409 () { [ "$1" = "409" ]; }
expect_2xx () { [[ "${1//[^0-9]/}" =~ ^2 ]]; }

############################################
# Logging
############################################
LOG_FILE="${LOG_FILE:-/tmp/smoke-admin-$(date +%Y%m%d_%H%M%S).log}"
exec > >(tee -a "$LOG_FILE") 2>&1
echo "LOG_FILE= $LOG_FILE"
echo

############################################
# Helpers
############################################
need() { command -v "$1" >/dev/null 2>&1 || { echo "❌ missing dependency: $1"; exit 1; }; }
step() { echo; echo "🧩 $*" >&2; }

reqline() { echo "➡️  $1 $2" >&2; }


need curl
need jq
need date
need node
need sed
need dd



############################################
# Env / Config
############################################
AUTH=()
TENANT=()
JSON=()
STORE_AUTH=()

BASE="${BASE:-http://localhost:3001}"
API="$BASE/api"

EMAIL="${OWNER_EMAIL:-admin@acme.com}"
PASS="${OWNER_PASS:-ChangeMe123!}"
TENANT_ID=""
############################################
# Store cookie jar (cart + priceList cookies)
############################################
TS="$(date +%s)"
STORE_JAR="${STORE_JAR:-/tmp/smoke-store-cookie-jar-$TS.txt}"
: > "$STORE_JAR"
echo "STORE_JAR=$STORE_JAR"



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

  local headers=()
  headers+=("${AUTH[@]:-}")
  headers+=("${TENANT[@]:-}")

  if [ -n "$data" ]; then
    headers+=("${JSON[@]:-}")
    curl -sS -o "$out" -w "%{http_code}\n" \
      -X "$method" "${headers[@]}" \
      "$url" -d "$data" | tail -n 1
  else
    curl -sS -o "$out" -w "%{http_code}\n" \
      -X "$method" "${headers[@]}" \
      "$url" | tail -n 1
  fi
}



############################################
# Store helper: supports cookie jar (cart cookie + priceList cookie)
############################################
store_call_code() {
  local method="$1"; shift
  local url="$1"; shift
  local data="${1:-}"
  local out="${2:-/tmp/store_body.json}"

  # lazy cookie jar
  if [ -z "${STORE_JAR:-}" ]; then
    STORE_JAR="/tmp/smoke-store-cookie-jar-$(date +%Y%m%d_%H%M%S).txt"
    : > "$STORE_JAR"
    echo "STORE_JAR=$STORE_JAR" >&2
  fi

  if [ -n "$data" ]; then
    curl -sS -o "$out" -w "%{http_code}" \
      -c "$STORE_JAR" -b "$STORE_JAR" \
      -X "$method" "${STORE_AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
      "$url" -d "$data"
  else
    curl -sS -o "$out" -w "%{http_code}" \
      -c "$STORE_JAR" -b "$STORE_JAR" \
      -X "$method" "${STORE_AUTH[@]}" "${TENANT[@]}" \
      "$url"
  fi
}


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

TENANT_JSON="$(
  curl -sS \
    -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN" \
    "$API/admin/tenants/me"
)"
TENANT_ID="$(echo "$TENANT_JSON" | jq -r '.id')"

test -n "$TENANT_ID" || { echo "❌ tenantId yok"; echo "$TENANT_JSON"; exit 1; }
TENANT=(-H "x-tenant-id: $TENANT_ID")

echo "TENANT_ID=$TENANT_ID"
step "Resolve tenant"
reqline "GET" "$API/admin/tenants/me"

TENANT_JSON="$(curl -sS "${AUTH[@]}" "$API/admin/tenants/me")"
TENANT_ID="$(echo "$TENANT_JSON" | jq -r '.tenant.id // .id // empty')"

test -n "$TENANT_ID" || { echo "❌ tenantId yok"; echo "$TENANT_JSON" | jq .; exit 1; }
TENANT=(-H "x-tenant-id: $TENANT_ID")
echo "TENANT_ID=$TENANT_ID"


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

 # 1) Create category -> product -> variant
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

############################################
# Stage 3 — Pricing seed (base price for variant)
# Purpose: store/cart line-items needs unit price; otherwise PRICING_NOT_CONFIGURED (HTTP 400)
############################################
step "Seed variant base price (Admin)"
reqline "POST" "$API/admin/variants/$VARIANT_ID/prices"

PRICE_PAYLOAD="$(jq -cn \
  --arg currencyCode "EUR" \
  --argjson amount 1999 \
  '{currencyCode:$currencyCode, amount:$amount}')"

CODE="$(admin_call_code POST "$API/admin/variants/$VARIANT_ID/prices" "$PRICE_PAYLOAD" /tmp/price_seed.json)"
cat /tmp/price_seed.json | jq .
expect_2xx "$CODE" || { echo "❌ variant price seed failed (HTTP $CODE)"; exit 1; }

echo "✅ base price seeded"
 # 2) Upsert inventory level at default
 reqline "PUT" "$API/admin/inventory/levels"
 UP_PAYLOAD="$(jq -cn \
   --arg locationId "$DEFAULT_LOC_ID" \
   --arg variantId "$VARIANT_ID" \
   '{items:[{locationId:$locationId,variantId:$variantId,stockedQuantity:10}] }')"
 CODE="$(admin_call_code PUT "$API/admin/inventory/levels" "$UP_PAYLOAD" /tmp/levels.json)"
 cat /tmp/levels.json | jq .
 expect_2xx "$CODE" || { echo "❌ level upsert failed (HTTP $CODE)"; exit 1; }
 echo "✅ inventory stocked (default location)"

 # determinism: enforce default again right before store/cart
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

 test "$DEFAULTS_CNT" -eq 1 || { echo "❌ multiple default locations detected"; jq '.locations // .items' /tmp/loc_list2.json; exit 1; }
 test "$DEFAULT_LOC_ID" = "$LOC_A_ID" || { echo "❌ default mismatch: expected $LOC_A_ID got $DEFAULT_LOC_ID"; exit 1; }

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
 reqline "POST" "$API/store/cart"

 CART_CODE="$(store_call_code POST "$API/store/cart" '{}' /tmp/cart.json)"
 cat /tmp/cart.json | jq .
 expect_2xx "$CART_CODE" || { echo "❌ cart create failed (HTTP $CART_CODE)"; exit 1; }

 CART_ID="$(jq -r '.cart.id // .id // empty' /tmp/cart.json)"
 test -n "$CART_ID" && [ "$CART_ID" != "null" ] || { echo "❌ CART_ID yok"; exit 1; }
 echo "✅ CART_ID=$CART_ID"

 step "Add line item (single call)"
 reqline "POST" "$API/store/cart/line-items"

 ADD_PAYLOAD="$(jq -cn \
   --arg variantId "$VARIANT_ID" \
   --arg locationId "$DEFAULT_LOC_ID" \
   '{variantId:$variantId, quantity:1, locationId:$locationId}')"

 ADD_CODE="$(store_call_code POST "$API/store/cart/line-items" "$ADD_PAYLOAD" /tmp/add_item.json)"
 cat /tmp/add_item.json | jq .
 expect_2xx "$ADD_CODE" || { echo "❌ add line item failed (HTTP $ADD_CODE)"; exit 1; }

 # Backend cart id changes -> accept response as source of truth
 CART_ID="$(jq -r '.cart.id // empty' /tmp/add_item.json)"
 test -n "$CART_ID" || { echo "❌ CART_ID missing after add line item"; exit 1; }
 echo "✅ CART_ID (effective)=$CART_ID"
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

 NOOP="$(jq -r '.noop // false' /tmp/reserve.json)"
 ITEMS_LEN="$(jq -r '(.items // []) | length' /tmp/reserve.json)"

 if [ "$NOOP" = "true" ] || [ "$ITEMS_LEN" -lt 1 ]; then
   echo "❌ reserve-stock noop oldu: reservation üretilmedi"
   echo "   debug: cartId=$CART_ID checkoutId=$CHECKOUT_ID variantId=$VARIANT_ID locationId=$DEFAULT_LOC_ID"
   cat /tmp/reserve.json | jq .
   exit 1
 fi

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

 echo "✅ Inventory E2E GREEN"


############################################
# Commit E — Category edge-case (cycle + delete policy)
############################################
step "Commit E — Category edge-case (cycle + delete policy)"

# Create child category under CATEGORY_ID
reqline "POST" "$API/admin/categories"
CHILD_PAYLOAD="$(jq -cn \
  --arg name "Smoke Child $TS" \
  --arg handle "smoke-child-$TS" \
  --arg parentId "$CATEGORY_ID" \
  '{name:$name, handle:$handle, parentId:$parentId}')"

CODE="$(admin_call_code POST "$API/admin/categories" "$CHILD_PAYLOAD" /tmp/cat_child.json)"
cat /tmp/cat_child.json | jq .
expect_2xx "$CODE" || { echo "❌ child category create failed (HTTP $CODE)"; exit 1; }

CATEGORY_CHILD_ID="$(jq -r '.id // .category.id // empty' /tmp/cat_child.json)"
test -n "$CATEGORY_CHILD_ID" || { echo "❌ CATEGORY_CHILD_ID yok"; exit 1; }
echo "✅ CATEGORY_CHILD_ID=$CATEGORY_CHILD_ID"

# Self-parent should be 400
step "Category self-parent -> 400"
reqline "PATCH" "$API/admin/categories/$CATEGORY_ID"

SELF_PARENT_PAYLOAD="$(jq -cn --arg parentId "$CATEGORY_ID" '{parentId:$parentId}')"
CODE="$(admin_call_code PATCH "$API/admin/categories/$CATEGORY_ID" "$SELF_PARENT_PAYLOAD" /tmp/cat_self_parent.json)"
cat /tmp/cat_self_parent.json | jq . || true
expect_400 "$CODE" || { echo "❌ expected 400, got HTTP $CODE"; exit 1; }
echo "✅ self-parent 400 ok"

# Descendant-parent should be 409
step "Category move under descendant -> 409"
reqline "PATCH" "$API/admin/categories/$CATEGORY_ID"

DESC_PAYLOAD="$(jq -cn --arg parentId "$CATEGORY_CHILD_ID" '{parentId:$parentId}')"
CODE="$(admin_call_code PATCH "$API/admin/categories/$CATEGORY_ID" "$DESC_PAYLOAD" /tmp/cat_cycle.json)"
cat /tmp/cat_cycle.json | jq . || true
expect_409 "$CODE" || { echo "❌ expected 409, got HTTP $CODE"; exit 1; }
echo "✅ descendant-parent 409 ok"

# Delete parent with child should be 409
step "Delete category with child -> 409"
reqline "DELETE" "$API/admin/categories/$CATEGORY_ID"
CODE="$(admin_call_code DELETE "$API/admin/categories/$CATEGORY_ID" "" /tmp/cat_del_parent.json)"
cat /tmp/cat_del_parent.json | jq . || true
expect_409 "$CODE" || { echo "❌ expected 409, got HTTP $CODE"; exit 1; }
echo "✅ delete-with-child 409 ok"

# Now delete child (should be 2xx), then delete parent again => must be in-use 409
step "Delete child category (should be 2xx)"
reqline "DELETE" "$API/admin/categories/$CATEGORY_CHILD_ID"
CODE="$(admin_call_code DELETE "$API/admin/categories/$CATEGORY_CHILD_ID" "" /tmp/cat_del_child.json)"
cat /tmp/cat_del_child.json | jq . || true
expect_2xx "$CODE" || { echo "❌ expected 2xx, got HTTP $CODE"; exit 1; }
echo "✅ child delete ok"

step "Delete in-use category after child removed -> 409"
reqline "DELETE" "$API/admin/categories/$CATEGORY_ID"
CODE="$(admin_call_code DELETE "$API/admin/categories/$CATEGORY_ID" "" /tmp/cat_del_inuse.json)"
cat /tmp/cat_del_inuse.json | jq . || true
expect_409 "$CODE" || { echo "❌ expected 409, got HTTP $CODE"; exit 1; }
echo "✅ in-use delete 409 ok"

############################################
# Commit F — Variant detail (inventory read-only + pricing placeholder)
############################################
step "Commit F — Variant detail (inventory snapshot + pricing placeholder)"
reqline "GET" "$API/admin/variants/$VARIANT_ID"

CODE="$(admin_call_code GET "$API/admin/variants/$VARIANT_ID" "" /tmp/variant_detail.json)"
cat /tmp/variant_detail.json | jq .
expect_2xx "$CODE" || { echo "❌ variant detail failed (HTTP $CODE)"; exit 1; }

HAS_VARIANT="$(jq -r '.variant.id // empty' /tmp/variant_detail.json)"
HAS_INV_DEFAULT="$(jq -r '.inventory.defaultLocationId // empty' /tmp/variant_detail.json)"
LEVELS_LEN="$(jq -r '(.inventory.levels // []) | length' /tmp/variant_detail.json)"
PRICING_MODE="$(jq -r '.pricing.mode // empty' /tmp/variant_detail.json)"

test "$HAS_VARIANT" = "$VARIANT_ID" || { echo "❌ variant.id mismatch"; exit 1; }
test -n "$HAS_INV_DEFAULT" || { echo "❌ inventory.defaultLocationId missing"; exit 1; }
test "$LEVELS_LEN" -ge 1 || { echo "❌ inventory.levels empty"; exit 1; }
test "$PRICING_MODE" = "NOT_IMPLEMENTED" || { echo "❌ pricing.mode expected NOT_IMPLEMENTED"; exit 1; }

echo "✅ variant detail contract ok"

echo
echo "🎉 SMOKE ADMIN FULL GREEN — tamam"
echo
echo "export TENANT_ID=$TENANT_ID"
echo "export ADMIN_ACCESS_TOKEN=$ADMIN_ACCESS_TOKEN"
echo "export STORE_ACCESS_TOKEN=$STORE_ACCESS_TOKEN"

############################################
# Commit G — Variant metadata patch
############################################
step "Commit G — Variant metadata patch"
reqline "PATCH" "$API/admin/variants/$VARIANT_ID"

META_PAYLOAD="$(jq -cn \
  --arg title "Variant Patched $TS" \
  --arg sku "SMOKE-PATCH-$TS" \
  --arg barcode "BRC-$TS" \
  --argjson rank 7 \
  --argjson isActive true \
  --arg source "smoke" \
  --argjson ts "$TS" \
  '{title:$title, sku:$sku, barcode:$barcode, rank:$rank, isActive:$isActive, metadata:{source:$source, ts:$ts}}')"
  
CODE="$(admin_call_code PATCH "$API/admin/variants/$VARIANT_ID" "$META_PAYLOAD" /tmp/variant_patch.json)"
cat /tmp/variant_patch.json | jq .
expect_2xx "$CODE" || { echo "❌ variant patch failed (HTTP $CODE)"; exit 1; }

PATCHED_ID="$(jq -r '.id // .variant.id // empty' /tmp/variant_patch.json)"
test "$PATCHED_ID" = "$VARIANT_ID" || { echo "❌ patched variant id mismatch"; exit 1; }
############################################
# Commit H — Product media roles + reorder (GREEN + self-debug)
############################################
step "Commit H — Product media roles + reorder"

need awk
need tr
need grep

is_uuid() {
  [[ "${1:-}" =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$ ]]
}

mkfile() {
  local filename="$1"
  local content_type="$2"
  local size="${3:-1024}"

  local presign_json file_id put_url etag

  presign_json="$(curl -sS --fail \
    -X POST "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
    -d "$(jq -cn --arg filename "$filename" --arg contentType "$content_type" --argjson size "$size" \
      '{filename:$filename, contentType:$contentType, size:$size}')" \
    "$API/admin/files/presign-put")"

  file_id="$(echo "$presign_json" | jq -r '.file.id // .fileId // empty')"
  put_url="$(echo "$presign_json" | jq -r '.putUrl // .uploadUrl // .url // .presignedUrl // empty')"

  if ! is_uuid "$file_id" || [ -z "${put_url:-}" ]; then
    echo "❌ presign-put parse failed" >&2
    echo "$presign_json" | jq . >&2 || true
    return 1
  fi

  put_url="$(echo "$put_url" \
    | sed -E 's#http://(minio|ecom_minio):9000#http://localhost:9000#g' \
    | sed -E 's#https://(minio|ecom_minio):9000#https://localhost:9000#g')"

  echo "ℹ️  fileId=$file_id" >&2
  echo "ℹ️  putUrl=$put_url" >&2

  rm -f /tmp/put_headers.txt
  dd if=/dev/zero bs="$size" count=1 2>/dev/null | \
    curl -sS --fail --max-time 30 \
      -D /tmp/put_headers.txt \
      -o /dev/null \
      -X PUT -H "Content-Type: $content_type" \
      --data-binary @- \
      "$put_url"

  etag="$(grep -i '^etag:' /tmp/put_headers.txt | head -n1 | awk '{print $2}' | tr -d '\r' | tr -d '"')"
  [ -n "${etag:-}" ] || etag="dummy"

  # complete: TRY with body, fallback to no-body
  local code
  code="$(admin_call_code POST "$API/admin/files/$file_id/complete" "$(jq -cn --arg etag "$etag" '{etag:$etag}')" /tmp/file_complete.json)"
  if ! expect_2xx "$code"; then
    echo "⚠️  complete with body failed (HTTP $code). retrying without body..."
    code="$(admin_call_code POST "$API/admin/files/$file_id/complete" "" /tmp/file_complete2.json)"
    expect_2xx "$code" || {
      echo "❌ complete failed (HTTP $code) fileId=$file_id"
      cat /tmp/file_complete2.json 2>/dev/null || true
      return 1
    }
  fi

  echo "$file_id"
}

FILE_HERO="${FILE_HERO:-$(mkfile "smoke-hero.bin" "application/octet-stream" 1024)}"
FILE_THUMB="${FILE_THUMB:-$(mkfile "smoke-thumb.bin" "application/octet-stream" 1024)}"
FILE_G1="${FILE_G1:-$(mkfile "smoke-g1.bin" "application/octet-stream" 1024)}"
FILE_G2="${FILE_G2:-$(mkfile "smoke-g2.bin" "application/octet-stream" 1024)}"

echo "✅ FILE_HERO=$FILE_HERO"
echo "✅ FILE_THUMB=$FILE_THUMB"
echo "✅ FILE_G1=$FILE_G1"
echo "✅ FILE_G2=$FILE_G2"

step "Cleaning existing media to avoid 409 Conflict"
CODE="$(admin_call_code GET "$API/admin/products/$PRODUCT_ID/media" "" /tmp/media_list.json)"
expect_2xx "$CODE" || {
  echo "❌ list media failed (HTTP $CODE)"
  cat /tmp/media_list.json
  exit 1
}

cat /tmp/media_list.json | jq .

MEDIA_IDS="$(
  jq -r '(.items // []) | .[]? | .id? // empty' /tmp/media_list.json \
    | grep -E '^[0-9a-fA-F-]{36}$' || true
)"

if [ -z "$MEDIA_IDS" ]; then
  echo "ℹ️  no existing media found (skip delete)"
else
  echo "$MEDIA_IDS" | sort -u | while IFS= read -r mid; do
    [ -n "$mid" ] || continue
    echo "  → delete media: $mid"
    admin_call_code DELETE \
      "$API/admin/products/$PRODUCT_ID/media/$mid" \
      "" /tmp/media_del.json >/dev/null || true
  done
fi


attach_media() {
  local file_id="$1"
  local role="$2"
  local rank="$3"

  local payload out code mid
  payload="$(jq -cn --arg fileId "$file_id" --arg role "$role" --argjson rank "$rank" \
    '{fileId:$fileId, role:$role, rank:$rank}')"

  out="/tmp/attach_${role}_${rank}.json"
  echo "➡️  POST $API/admin/products/$PRODUCT_ID/media (role=$role rank=$rank)" >&2

  code="$(admin_call_code POST "$API/admin/products/$PRODUCT_ID/media" "$payload" "$out")"
  echo "HTTP=$code" >&2
  cat "$out" | jq . >&2

  if [[ "$code" =~ ^2 ]]; then
    mid="$(jq -r '.media.id // empty' "$out")"
    echo "$mid"   # ✅ stdout = sadece id
    return 0
  fi

  echo "❌ attach failed" >&2
  return 1
}




step "Attach new media set"
MID_HERO="$(attach_media "$FILE_HERO" "HERO" 0)" || { echo "❌ HERO attach failed"; exit 1; }
MID_THUMB="$(attach_media "$FILE_THUMB" "THUMBNAIL" 0)" || { echo "❌ THUMB attach failed"; exit 1; }
MID_G1="$(attach_media "$FILE_G1" "GALLERY" 0)" || { echo "❌ G1 attach failed"; exit 1; }
MID_G2="$(attach_media "$FILE_G2" "GALLERY" 1)" || { echo "❌ G2 attach failed"; exit 1; }

echo "✅ MID_HERO=$MID_HERO"
echo "✅ MID_THUMB=$MID_THUMB"
echo "✅ MID_G1=$MID_G1"
echo "✅ MID_G2=$MID_G2"

is_uuid() { [[ "$1" =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$ ]]; }

must_uuid() { is_uuid "$1" || { echo "❌ not uuid: [$1]" >&2; exit 1; }; }

must_uuid "$MID_G1"
must_uuid "$MID_G2"


reorder_gallery() {
  local ordered_json="$1"
  local payload out code

  payload="$(jq -cn --argjson orderedIds "$ordered_json" '{orderedIds:$orderedIds}')"
  out="/tmp/reorder.json"
  code="$(admin_call_code POST "$API/admin/products/$PRODUCT_ID/media/reorder" "$payload" "$out")"

  echo "➡️  POST $API/admin/products/$PRODUCT_ID/media/reorder"
  echo "HTTP=$code"
  cat "$out" | jq . || cat "$out"

  expect_2xx "$code"
}

step "Reorder gallery ONLY"
ORDER_JSON="$(jq -cn --arg a "$MID_G2" --arg b "$MID_G1" '[$a,$b]')"
payload="$(jq -cn --argjson orderedIds "$ORDER_JSON" '{orderedIds:$orderedIds}')"
reorder_gallery "$ORDER_JSON" || { echo "❌ reorder failed"; exit 1; }

step "Verify media"
CODE="$(admin_call_code GET "$API/admin/products/$PRODUCT_ID/media" "" /tmp/media_verify.json)"
expect_2xx "$CODE" || { echo "❌ verify list failed"; cat /tmp/media_verify.json; exit 1; }
cat /tmp/media_verify.json | jq .

echo "🎉 Commit H GREEN"
############################################
# Commit I — PriceList activation / scoped pricing
############################################
step "Commit I — PriceList activation / scoped pricing"

# Varsayım:
# - VARIANT_ID mevcut
# - DEFAULT_LOC_ID mevcut
# - Base price zaten seed edilmiş (örn: 1999)

############################################
# 1) Create PriceList
############################################
reqline "POST" "$API/admin/price-lists"

PL_PAYLOAD="$(jq -cn \
  --arg title "Smoke PriceList $TS" \
  --arg code "smoke-pl-$TS" \
  '{title:$title, code:$code}')"

PL_CODE="$(admin_call_code POST "$API/admin/price-lists" "$PL_PAYLOAD" /tmp/pl_create.json)"
cat /tmp/pl_create.json | jq .
expect_2xx "$PL_CODE" || { echo "❌ price list create failed (HTTP $PL_CODE)"; exit 1; }

PRICE_LIST_ID="$(jq -r '.id // .priceList.id // empty' /tmp/pl_create.json)"
test -n "$PRICE_LIST_ID" || { echo "❌ PRICE_LIST_ID yok"; exit 1; }
echo "✅ PRICE_LIST_ID=$PRICE_LIST_ID"

############################################
# 2) Activate PriceList
############################################
reqline "PATCH" "$API/admin/price-lists/$PRICE_LIST_ID/activate"

ACT_CODE="$(admin_call_code PATCH "$API/admin/price-lists/$PRICE_LIST_ID/activate" '{}' /tmp/pl_activate.json)"
cat /tmp/pl_activate.json | jq .
expect_2xx "$ACT_CODE" || { echo "❌ price list activate failed (HTTP $ACT_CODE)"; exit 1; }
echo "✅ price list activated"

############################################
# 3) Seed scoped price (EUR 1499)
############################################
reqline "POST" "$API/admin/variants/$VARIANT_ID/prices"

SCOPED_PRICE_PAYLOAD="$(jq -cn \
  --arg currencyCode "EUR" \
  --argjson amount 1499 \
  --arg priceListId "$PRICE_LIST_ID" \
  '{currencyCode:$currencyCode, amount:$amount, priceListId:$priceListId}')"

SP_CODE="$(admin_call_code POST "$API/admin/variants/$VARIANT_ID/prices" "$SCOPED_PRICE_PAYLOAD" /tmp/scoped_price.json)"
cat /tmp/scoped_price.json | jq .
expect_2xx "$SP_CODE" || { echo "❌ scoped price seed failed (HTTP $SP_CODE)"; exit 1; }
echo "✅ scoped price seeded"



############################################
# 4) Create new cart
############################################
reqline "POST" "$API/store/cart"

CART_CODE="$(store_call_code POST "$API/store/cart" '{}' /tmp/cart_i.json)"
cat /tmp/cart_i.json | jq .
expect_2xx "$CART_CODE" || { echo "❌ cart create failed (HTTP $CART_CODE)"; exit 1; }

CART_I_ID="$(jq -r '.cart.id // .id // empty' /tmp/cart_i.json)"
test -n "$CART_I_ID" || { echo "❌ CART_I_ID yok"; exit 1; }
echo "✅ CART_I_ID=$CART_I_ID"

############################################
# 5) Set cart price list
############################################
reqline "PATCH" "$API/store/cart/$CART_I_ID/price-list"

SET_PL_PAYLOAD="$(jq -cn --arg priceListId "$PRICE_LIST_ID" '{priceListId:$priceListId}')"

SET_PL_CODE="$(store_call_code PATCH "$API/store/cart/$CART_I_ID/price-list" "$SET_PL_PAYLOAD" /tmp/cart_set_pl.json)"
cat /tmp/cart_set_pl.json | jq .
expect_2xx "$SET_PL_CODE" || { echo "❌ set cart price list failed (HTTP $SET_PL_CODE)"; exit 1; }
echo "✅ cart priceList set"

############################################
# 6) Add line item → MUST use scoped price (1499)
############################################
reqline "POST" "$API/store/cart/line-items"

ADD_PAYLOAD="$(jq -cn \
  --arg variantId "$VARIANT_ID" \
  --arg locationId "$DEFAULT_LOC_ID" \
  '{variantId:$variantId, quantity:1, locationId:$locationId}')"

ADD_CODE="$(store_call_code POST "$API/store/cart/line-items" "$ADD_PAYLOAD" /tmp/add_item_scoped.json)"
cat /tmp/add_item_scoped.json | jq .
expect_2xx "$ADD_CODE" || { echo "❌ add line item (scoped) failed (HTTP $ADD_CODE)"; exit 1; }

EFFECTIVE_CART_ID="$(jq -r '.cart.id // empty' /tmp/add_item_scoped.json)"
test "$EFFECTIVE_CART_ID" = "$CART_I_ID" || {
  echo "❌ cart drift: expected $CART_I_ID got $EFFECTIVE_CART_ID"
  exit 1
}

UNIT_PRICE="$(jq -r '.cart.items[0].unitPrice.amount // empty' /tmp/add_item_scoped.json)"
test "$UNIT_PRICE" = "1499" || {
  echo "❌ scoped pricing failed: expected 1499, got $UNIT_PRICE"
  exit 1
}
echo "✅ scoped pricing OK (1499)"

############################################
# 7) Unset cart price list
############################################
reqline "PATCH" "$API/store/cart/$CART_I_ID/price-list"

UNSET_PL_CODE="$(store_call_code PATCH "$API/store/cart/$CART_I_ID/price-list" '{ "priceListId": null }' /tmp/cart_unset_pl.json)"
cat /tmp/cart_unset_pl.json | jq .
expect_2xx "$UNSET_PL_CODE" || { echo "❌ unset cart price list failed"; exit 1; }
echo "✅ cart priceList unset"

############################################
# 8) Add second item → MUST fallback to base price (1999)
############################################
reqline "POST" "$API/store/cart/line-items"

ADD2_CODE="$(store_call_code POST "$API/store/cart/line-items" "$ADD_PAYLOAD" /tmp/add_item_base.json)"
cat /tmp/add_item_base.json | jq .
expect_2xx "$ADD2_CODE" || { echo "❌ add line item (base) failed (HTTP $ADD2_CODE)"; exit 1; }

QTY2="$(jq -r '.cart.items[0].quantity // empty' /tmp/add_item_base.json)"
UNIT_PRICE2="$(jq -r '.cart.items[0].unitPrice.amount // empty' /tmp/add_item_base.json)"

test "$QTY2" = "2" || { echo "❌ expected quantity 2, got $QTY2"; exit 1; }
test "$UNIT_PRICE2" = "1999" || { echo "❌ base pricing fallback failed: expected 1999, got $UNIT_PRICE2"; exit 1; }

echo "✅ base pricing fallback OK (1999)"

echo "🎉 Commit I GREEN — PriceList scoped pricing works"
