#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:3001}"
OWNER_EMAIL="${OWNER_EMAIL:-admin@acme.com}"
OWNER_PASS="${OWNER_PASS:-ChangeMe123!}"

ts="$(date +%s)"
tmpdir="$(mktemp -d)"
COOKIE_JAR="$tmpdir/ecom.cookies"

die() { echo "❌ $*" >&2; exit 1; }
ok()  { echo "✅ $*"; }

# --- login (bearer) ---
LOGIN_JSON="$(
  curl -sS \
    -c "$COOKIE_JAR" \
    -H 'content-type: application/json' \
    -X POST "$API_BASE/api/admin/auth/login" \
    -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$OWNER_PASS\"}"
)"

ACCESS_TOKEN="$(echo "$LOGIN_JSON" | jq -r '.accessToken // empty')"
[ -n "$ACCESS_TOKEN" ] || die "Login failed: $LOGIN_JSON"

H_AUTH=(-H "Authorization: Bearer $ACCESS_TOKEN")

# --- helpers ---
req() {
  local method="$1" path="$2" body="${3:-}"
  shift 3 || true
  if [ -n "$body" ]; then
    curl -sS -i "${H_AUTH[@]}" -H 'content-type: application/json' -X "$method" "$API_BASE$path" -d "$body" "$@"
  else
    curl -sS -i "${H_AUTH[@]}" -X "$method" "$API_BASE$path" "$@"
  fi
}

json_body() { awk 'BEGIN{b=0} /^\r?$/{b=1;next} {if(b) print}'; }
status_code() { awk 'NR==1{print $2}'; }

# --- health ---
code="$(req GET /api/health | status_code)"
[ "$code" = "200" ] || die "/api/health expected 200 got $code"
ok "health 200"

# --- auth/me ---
code="$(req GET /api/admin/auth/me | status_code)"
[ "$code" = "200" ] || die "/api/admin/auth/me expected 200 got $code"
ok "admin auth/me 200"

# --- tenants/me (tenant id) ---
TENANT_ME_RES="$(req GET /api/admin/tenants/me)"
code="$(echo "$TENANT_ME_RES" | status_code)"
[ "$code" = "200" ] || die "/api/admin/tenants/me expected 200 got $code"

TENANT_ID="$(echo "$TENANT_ME_RES" | json_body | jq -r '.id')"
[ -n "$TENANT_ID" ] && [ "$TENANT_ID" != "null" ] || die "TENANT_ID missing"
H_TENANT=(-H "x-tenant-id: $TENANT_ID")
ok "tenant resolved: $TENANT_ID"

# --- permissions (example) ---
code="$(curl -sS -i "${H_AUTH[@]}" "${H_TENANT[@]}" "$API_BASE/api/admin/permissions" | status_code)"
[ "$code" = "200" ] || die "/api/admin/permissions expected 200 got $code"
ok "permissions list 200"

# =========================
# CATALOG ADMIN SMOKE
# =========================

# --- create category ---
CAT_CREATE_RES="$(
  curl -sS -i "${H_AUTH[@]}" "${H_TENANT[@]}" \
    -H 'content-type: application/json' \
    -X POST "$API_BASE/api/admin/categories" \
    -d "{\"name\":\"Elektronik $ts\",\"handle\":\"elektronik-$ts\"}"
)"
code="$(echo "$CAT_CREATE_RES" | status_code)"
[ "$code" = "200" ] || [ "$code" = "201" ] || die "create category expected 200/201 got $code"
CAT_ID="$(echo "$CAT_CREATE_RES" | json_body | jq -r '.id')"
ok "category created: $CAT_ID"

# --- update category ---
CAT_UPD_RES="$(
  curl -sS -i "${H_AUTH[@]}" "${H_TENANT[@]}" \
    -H 'content-type: application/json' \
    -X PATCH "$API_BASE/api/admin/categories/$CAT_ID" \
    -d "{\"name\":\"Elektronik v2 $ts\"}"
)"
code="$(echo "$CAT_UPD_RES" | status_code)"
[ "$code" = "200" ] || [ "$code" = "201" ] || die "update category expected 200/201 got $code"
ok "category updated"

# --- list categories ---
code="$(curl -sS -i "${H_AUTH[@]}" "${H_TENANT[@]}" "$API_BASE/api/admin/categories" | status_code)"
[ "$code" = "200" ] || die "list categories expected 200 got $code"
ok "categories list 200"

# --- create product (draft) ---
PROD_CREATE_RES="$(
  curl -sS -i "${H_AUTH[@]}" "${H_TENANT[@]}" \
    -H 'content-type: application/json' \
    -X POST "$API_BASE/api/admin/products" \
    -d "{
      \"title\":\"Kablo $ts\",
      \"handle\":\"kablo-$ts\",
      \"description\":null,
      \"status\":\"draft\",
      \"categoryIds\":[\"$CAT_ID\"],
      \"variants\":[{\"title\":\"Tekli\",\"sku\":\"KBL-1-$ts\",\"isActive\":true}]
    }"
)"
code="$(echo "$PROD_CREATE_RES" | status_code)"
[ "$code" = "200" ] || [ "$code" = "201" ] || die "create product expected 200/201 got $code"
PROD_ID="$(echo "$PROD_CREATE_RES" | json_body | jq -r '.id')"
ok "product created: $PROD_ID"

# --- update product ---
PROD_UPD_RES="$(
  curl -sS -i "${H_AUTH[@]}" "${H_TENANT[@]}" \
    -H 'content-type: application/json' \
    -X PATCH "$API_BASE/api/admin/products/$PROD_ID" \
    -d "{\"title\":\"Kablo v2 $ts\",\"categoryIds\":[\"$CAT_ID\"]}"
)"
code="$(echo "$PROD_UPD_RES" | status_code)"
[ "$code" = "200" ] || [ "$code" = "201" ] || die "update product expected 200/201 got $code"
ok "product updated"

# --- publish product ---
PROD_PUB_RES="$(
  curl -sS -i "${H_AUTH[@]}" "${H_TENANT[@]}" \
    -X POST "$API_BASE/api/admin/products/$PROD_ID/publish"
)"
code="$(echo "$PROD_PUB_RES" | status_code)"
[ "$code" = "200" ] || [ "$code" = "201" ] || die "publish product expected 200/201 got $code"
ok "product published"

# --- get product ---
code="$(curl -sS -i "${H_AUTH[@]}" "${H_TENANT[@]}" "$API_BASE/api/admin/products/$PROD_ID" | status_code)"
[ "$code" = "200" ] || die "get product expected 200 got $code"
ok "product get 200"

# --- list products (basic) ---
code="$(curl -sS -i "${H_AUTH[@]}" "${H_TENANT[@]}" "$API_BASE/api/admin/products?offset=0&limit=20" | status_code)"
[ "$code" = "200" ] || die "list products expected 200 got $code"
ok "products list 200"

echo
echo "🎉 ADMIN SMOKE OK"
echo "tenant=$TENANT_ID product=$PROD_ID category=$CAT_ID"
