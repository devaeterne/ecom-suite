API_BASE="${API_BASE:-http://localhost:3001}"
OWNER_EMAIL="${OWNER_EMAIL:-admin@acme.com}"
OWNER_PASS="${OWNER_PASS:-ChangeMe123!}"

ts="$(date +%s)"
tmpdir="$(mktemp -d)"
COOKIE_JAR="$tmpdir/ecom.cookies"

die() { echo "❌ $*" >&2; exit 1; }
ok()  { echo "✅ $*"; }
warn(){ echo "⚠️  $*" >&2; }

code_of() { awk 'NR==1{print $2}'; }
body_of() { awk 'BEGIN{b=0} /^\r?$/{b=1;next} {if(b) print}'; }

# Tenant header will be set after tenants/me
TENANT_ID=""
tenant_args=()

http() {
  # http METHOD PATH [JSON_BODY]
  local method="$1"
  local path="$2"
  local body="${3:-}"

  if [ -n "${body}" ]; then
    curl -sS -i \
      -X "$method" "$API_BASE$path" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      "${tenant_args[@]}" \
      -H "content-type: application/json" \
      -d "$body"
  else
    curl -sS -i \
      -X "$method" "$API_BASE$path" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      "${tenant_args[@]}"
  fi
}

# --- login ---
LOGIN_RES="$(
  curl -sS -i \
    -c "$COOKIE_JAR" \
    -H 'content-type: application/json' \
    -X POST "$API_BASE/api/admin/auth/login" \
    -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$OWNER_PASS\"}"
)"
LOGIN_CODE="$(echo "$LOGIN_RES" | code_of)"
[ "$LOGIN_CODE" = "200" ] || die "Login expected 200 got $LOGIN_CODE: $(echo "$LOGIN_RES" | body_of)"

ACCESS_TOKEN="$(echo "$LOGIN_RES" | body_of | jq -r '.accessToken // empty')"
[ -n "$ACCESS_TOKEN" ] || die "Login returned empty accessToken"
ok "login 200"

# --- health ---
HEALTH_CODE="$(curl -sS -o /dev/null -w '%{http_code}' "$API_BASE/api/health")"
[ "$HEALTH_CODE" = "200" ] || die "/api/health expected 200 got $HEALTH_CODE"
ok "health 200"

# --- admin auth/me ---
ME_CODE="$(http GET /api/admin/auth/me | code_of)"
[ "$ME_CODE" = "200" ] || die "/api/admin/auth/me expected 200 got $ME_CODE"
ok "admin auth/me 200"

# --- tenants/me -> tenant header ---
TENANT_RES="$(http GET /api/admin/tenants/me)"
TENANT_CODE="$(echo "$TENANT_RES" | code_of)"
[ "$TENANT_CODE" = "200" ] || die "/api/admin/tenants/me expected 200 got $TENANT_CODE: $(echo "$TENANT_RES" | body_of)"

TENANT_ID="$(echo "$TENANT_RES" | body_of | jq -r '.id')"
[ -n "$TENANT_ID" ] && [ "$TENANT_ID" != "null" ] || die "TENANT_ID missing"
tenant_args=(-H "x-tenant-id: $TENANT_ID")
ok "tenant resolved: $TENANT_ID"

# --- permissions ---
PERM_CODE="$(http GET /api/admin/permissions | code_of)"
[ "$PERM_CODE" = "200" ] || die "/api/admin/permissions expected 200 got $PERM_CODE"
ok "permissions list 200"

# =========================
# ADMIN CATALOG SMOKE
# =========================

# create category
CAT_RES="$(http POST /api/admin/categories "{\"name\":\"Elektronik $ts\",\"handle\":\"elektronik-$ts\"}")"
CAT_CODE="$(echo "$CAT_RES" | code_of)"
[ "$CAT_CODE" = "200" ] || [ "$CAT_CODE" = "201" ] || die "create category expected 200/201 got $CAT_CODE: $(echo "$CAT_RES" | body_of)"
CAT_ID="$(echo "$CAT_RES" | body_of | jq -r '.id')"
[ -n "$CAT_ID" ] && [ "$CAT_ID" != "null" ] || die "CAT_ID missing"
ok "category created: $CAT_ID"

# update category
UPD_CAT_RES="$(http PATCH /api/admin/categories/$CAT_ID "{\"name\":\"Elektronik v2 $ts\"}")"
UPD_CAT_CODE="$(echo "$UPD_CAT_RES" | code_of)"
[ "$UPD_CAT_CODE" = "200" ] || [ "$UPD_CAT_CODE" = "201" ] || die "update category expected 200/201 got $UPD_CAT_CODE: $(echo "$UPD_CAT_RES" | body_of)"
ok "category updated"

# NOTE: Admin'de GET /api/admin/categories yok. Listeleme STORE tarafında var.
STORE_CAT_CODE="$(curl -sS -o /dev/null -w '%{http_code}' -H "x-tenant-id: $TENANT_ID" "$API_BASE/api/store/categories")"
if [ "$STORE_CAT_CODE" = "200" ]; then
  ok "store categories list 200"
else
  warn "store categories list returned $STORE_CAT_CODE (check store module bootstrapping)"
fi

# create product
PROD_PAYLOAD="$(cat <<JSON
{
  "title":"Kablo $ts",
  "handle":"kablo-$ts",
  "description":null,
  "status":"draft",
  "categoryIds":["$CAT_ID"],
  "variants":[{"title":"Tekli","sku":"KBL-1-$ts","isActive":true}]
}
JSON
)"
PROD_RES="$(http POST /api/admin/products "$PROD_PAYLOAD")"
PROD_CODE="$(echo "$PROD_RES" | code_of)"
[ "$PROD_CODE" = "200" ] || [ "$PROD_CODE" = "201" ] || die "create product expected 200/201 got $PROD_CODE: $(echo "$PROD_RES" | body_of)"
PROD_ID="$(echo "$PROD_RES" | body_of | jq -r '.id')"
[ -n "$PROD_ID" ] && [ "$PROD_ID" != "null" ] || die "PROD_ID missing"
ok "product created: $PROD_ID"

# update product
UPD_PROD_RES="$(http PATCH /api/admin/products/$PROD_ID "{\"title\":\"Kablo v2 $ts\",\"categoryIds\":[\"$CAT_ID\"]}")"
UPD_PROD_CODE="$(echo "$UPD_PROD_RES" | code_of)"
[ "$UPD_PROD_CODE" = "200" ] || [ "$UPD_PROD_CODE" = "201" ] || die "update product expected 200/201 got $UPD_PROD_CODE: $(echo "$UPD_PROD_RES" | body_of)"
ok "product updated"

# publish product (empty body)
PUB_RES="$(http POST /api/admin/products/$PROD_ID/publish)"
PUB_CODE="$(echo "$PUB_RES" | code_of)"
[ "$PUB_CODE" = "200" ] || [ "$PUB_CODE" = "201" ] || die "publish product expected 200/201 got $PUB_CODE: $(echo "$PUB_RES" | body_of)"
ok "product published"

echo
echo "🎉 ADMIN SMOKE OK"
echo "tenant=$TENANT_ID category=$CAT_ID product=$PROD_ID"