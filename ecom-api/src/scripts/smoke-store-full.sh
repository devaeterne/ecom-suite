#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"
TENANT="${TENANT:-acme}"
EMAIL="${EMAIL:-buyer1+$(date +%s)@acme.com}"
PASS="${PASS:-Password123!}"

# Core endpoints
EP_STORE_REGISTER="/api/store/auth/register"
EP_STORE_LOGIN="/api/store/auth/login"
EP_STORE_ME="/api/store/auth/me"

EP_CUSTOMER_ME="/api/store/customers/me"
EP_CUSTOMER_ADDR="/api/store/customers/me/addresses"

EP_CHECKOUTS="/api/store/checkouts"

# New endpoints (store scope)
EP_STORE_PAYMENTS="/api/store/payments"       # optional
EP_STORE_ORDERS="/api/store/orders"

hdr_common=(-H "content-type: application/json" -H "x-tenant: ${TENANT}")

wait_for_api() {
  echo "⏳ Waiting for API..."
  for i in $(seq 1 60); do
    if curl -fsS "$BASE_URL/api/health" >/dev/null 2>&1; then
      echo "✅ API is up"
      return 0
    fi
    sleep 1
  done
  echo "❌ API did not become ready in time"
  return 1
}

retry() {
  local n=0 max=20
  until "$@"; do
    n=$((n+1))
    if [[ $n -ge $max ]]; then return 1; fi
    sleep 0.4
  done
}

req() {
  local method="$1" path="$2" token="${3:-}" body="${4:-}"

  local hdr=()
  # DELETE ve body yoksa Content-Type ekleme
  if [[ "$method" != "DELETE" || -n "${body}" ]]; then
    hdr=("${hdr_common[@]}")
  fi

  if [[ -n "${token}" ]]; then
    hdr+=(-H "authorization: Bearer ${token}")
  fi

  if [[ -n "${body}" ]]; then
    printf '%s' "${body}" | curl -sS -i -X "${method}" "${BASE_URL}${path}" \
      "${hdr[@]}" --data-binary @-
  else
    curl -sS -i -X "${method}" "${BASE_URL}${path}" "${hdr[@]}"
  fi
}

status_code() { awk 'NR==1{print $2}'; }
json_body() { awk 'BEGIN{p=0} /^\r?$/{p=1;next} {if(p)print}'; }

print_step() {
  echo
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "$1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

head_http() { head -n "${1:-60}"; }

need_ok() {
  local code="$1" ok1="$2" ok2="${3:-}" ok3="${4:-}"
  [[ "$code" == "$ok1" || ( -n "$ok2" && "$code" == "$ok2" ) || ( -n "$ok3" && "$code" == "$ok3" ) ]]
}

echo "BASE_URL=$BASE_URL TENANT=$TENANT EMAIL=$EMAIL"

wait_for_api || exit 1

print_step "1) Health"
retry curl -sS -o /dev/null "${BASE_URL}/api/health"
curl -sS "${BASE_URL}/api/health" | head -c 300; echo

print_step "2) Store Register (idempotent)"
reg_body="$(jq -n --arg email "$EMAIL" --arg password "$PASS" '{email:$email,password:$password}')"
reg_resp="$(req POST "${EP_STORE_REGISTER}" "" "$reg_body" || true)"
reg_code="$(printf '%s' "$reg_resp" | status_code)"
echo "register_status=$reg_code (200/201 ok, 409 ok)"
if ! need_ok "$reg_code" "200" "201" "409"; then
  echo "$reg_resp" | head_http 120
  exit 1
fi

print_step "3) Store Login"
login_body="$(jq -n --arg email "$EMAIL" --arg password "$PASS" '{email:$email,password:$password}')"
login_resp="$(req POST "${EP_STORE_LOGIN}" "" "$login_body" || true)"
login_code="$(printf '%s' "$login_resp" | status_code)"
login_json="$(printf '%s' "$login_resp" | json_body)"
token="$(printf '%s' "$login_json" | jq -r '.accessToken // empty' 2>/dev/null || true)"
echo "login_status=$login_code token_len=${#token}"
if [[ -z "$token" ]]; then
  echo "❌ Login failed: accessToken empty"
  echo "$login_resp" | head_http 120
  exit 1
fi

print_step "4) Store Me"
req GET "${EP_STORE_ME}" "$token" | head_http 60

print_step "5) Customer Me"
req GET "${EP_CUSTOMER_ME}" "$token" | head_http 80

print_step "6) Customer Update (noop)"
upd_body="$(jq -n '{firstName:"Buyer", lastName:"One"}')"
req PATCH "${EP_CUSTOMER_ME}" "$token" "$upd_body" | head_http 80

print_step "7) Address Create/List/Delete"
addr_body="$(jq -n '{
  label:"Home",
  firstName:"Buyer",
  lastName:"One",
  phone:"0000000",
  address1:"Street 1",
  city:"Podgorica",
  postalCode:"81000",
  countryIso2:"ME",
  isDefault:true
}')"

create_resp="$(req POST "${EP_CUSTOMER_ADDR}" "$token" "$addr_body")"
addr_id="$(printf '%s' "$create_resp" | json_body | jq -r '.address.id // empty')"
echo "address_id=$addr_id"
[[ -n "$addr_id" ]] || { echo "$create_resp" | head_http 160; exit 1; }

req GET "${EP_CUSTOMER_ADDR}" "$token" | head_http 100
req DELETE "${EP_CUSTOMER_ADDR}/${addr_id}" "$token" | head_http 60

print_step "8) Checkout Create (auto cart)"
co_body="$(jq -n --arg email "$EMAIL" '{email:$email, currencyCode:"EUR"}')"
co_resp="$(req POST "${EP_CHECKOUTS}" "$token" "$co_body")"
co_json="$(printf '%s' "$co_resp" | json_body)"
checkout_id="$(printf '%s' "$co_json" | jq -r '.checkout.id // empty')"
cart_id="$(printf '%s' "$co_json" | jq -r '.checkout.cartId // empty')"
echo "checkout_id=$checkout_id cart_id=$cart_id"
[[ -n "$checkout_id" ]] || { echo "$co_resp" | head_http 200; exit 1; }

print_step "9) Checkout Address Upsert"
co_addr_body="$(jq -n '{
  type:"SHIPPING",
  fullName:"Buyer One",
  phone:"0000000",
  line1:"Street 1",
  city:"Podgorica",
  postalCode:"81000",
  countryIso2:"ME"
}')"
req PATCH "${EP_CHECKOUTS}/${checkout_id}/address" "$token" "$co_addr_body" | head_http 160

print_step "10) Payment Providers"
req GET "${EP_CHECKOUTS}/${checkout_id}/payment-providers" "$token" | head_http 200

# ──────────────────────────────────────────────────────────────
# Payments
# ──────────────────────────────────────────────────────────────
echo
echo "11) Start Payment (Checkout endpoint)"
idem="idem-$(date +%s)"
pay_body="$(jq -n --arg provider "MANUAL" \
                 --arg manualMethod "BANK_TRANSFER" \
                 --arg idem "$idem" \
                 '{
                    provider: $provider,
                    manualMethod: $manualMethod,
                    idempotencyKey: $idem,
                    returnUrl: "https://example.com/return",
                    cancelUrl: "https://example.com/cancel",
                    locale: null
                  }')"

pay_resp="$(req POST "${EP_CHECKOUTS}/${checkout_id}/payments" "$token" "$pay_body" || true)"
pay_code="$(printf '%s' "$pay_resp" | status_code)"
echo "payment_start_status=$pay_code"
if [[ "$pay_code" != "200" && "$pay_code" != "201" ]]; then
  echo "$pay_resp" | head -n 240
  exit 1
fi

echo
echo "11b) Start Payment (NEW: /store/payments) (optional)"
idem2="smoke-$(date +%s)-$RANDOM"
# NOTE: burada DTO manualMethod kabul etmiyorsa göndermiyoruz.
pay2_body="$(jq -n \
  --arg checkoutId "$checkout_id" \
  --arg idem "$idem2" \
  '{
    checkoutId: $checkoutId,
    provider:"MANUAL",
    idempotencyKey: $idem,
    returnUrl:"https://example.com/return",
    cancelUrl:"https://example.com/cancel",
    locale:"en"
  }')"

pay2_resp="$(req POST "${EP_STORE_PAYMENTS}" "$token" "$pay2_body" || true)"
pay2_code="$(printf '%s' "$pay2_resp" | status_code)"
echo "payment_start2_status=$pay2_code"
if [[ "$pay2_code" == "400" || "$pay2_code" == "404" ]]; then
  echo "ℹ️  /store/payments optional step skipped (status=$pay2_code)"
else
  if [[ "$pay2_code" != "200" && "$pay2_code" != "201" ]]; then
    echo "$pay2_resp" | head -n 240
    exit 1
  fi
fi

echo
echo "12) Get Checkout Payment Collection (NEW)"
pc_resp="$(req GET "${EP_CHECKOUTS}/${checkout_id}/payment-collection" "$token" || true)"
pc_code="$(printf '%s' "$pc_resp" | status_code)"
echo "payment_collection_status=$pc_code"
printf '%s' "$pc_resp" | head -n 160

# ──────────────────────────────────────────────────────────────
# Orders
# ──────────────────────────────────────────────────────────────
echo
echo "13) Create Order From Checkout (POST /store/orders/from-checkout)"
order_body="$(jq -n --arg checkoutId "$checkout_id" '{ checkoutId: $checkoutId }')"

order_resp="$(req POST "${EP_STORE_ORDERS}/from-checkout" "$token" "$order_body" || true)"
order_code="$(printf '%s' "$order_resp" | status_code)"
echo "order_create_status=$order_code"
if [[ "$order_code" != "200" && "$order_code" != "201" ]]; then
  echo "$order_resp" | head -n 240
  exit 1
fi

order_json="$(printf '%s' "$order_resp" | json_body)"
order_id="$(printf '%s' "$order_json" | jq -r '.order.id // empty')"
echo "order_id=$order_id"
[[ -n "$order_id" ]] || { echo "$order_resp" | head -n 240; exit 1; }

print_step "14) Orders List (NEW)"
# NOT: backend query dto strict ise params göndermeyelim; boş çağrı her zaman çalışmalı.
req GET "${EP_STORE_ORDERS}" "$token" | head_http 200

print_step "15) Order Detail (NEW)"
req GET "${EP_STORE_ORDERS}/${order_id}" "$token" | head_http 240

echo
echo "✅ Store smoke OK (including payments + orders)"
