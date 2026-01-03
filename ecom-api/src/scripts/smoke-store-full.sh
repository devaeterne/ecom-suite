#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"
TENANT="${TENANT:-acme}"
EMAIL="${EMAIL:-buyer1+$(date +%s)@acme.com}"
PASS="${PASS:-Password123!}"

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

wait_for_api || exit 1

retry() {
  local n=0 max=15
  until "$@"; do
    n=$((n+1))
    if [[ $n -ge $max ]]; then return 1; fi
    sleep 0.4
  done
}

req() {
  local method="$1" path="$2" token="${3:-}" body="${4:-}"
  shift || true

  local hdr=()
  
  # DELETE ve body yoksa Content-Type ekleme
  if [[ "$method" != "DELETE" || -n "$body" ]]; then
    hdr=("${hdr_common[@]}")
  fi
  
  if [[ -n "${token}" ]]; then
    hdr+=(-H "authorization: Bearer ${token}")
  fi

  if [[ -n "${body}" ]]; then
    printf '%s' "$body" | curl -sS -i -X "$method" "${BASE_URL}${path}" \
      "${hdr[@]}" --data-binary @-
  else
    curl -sS -i -X "$method" "${BASE_URL}${path}" "${hdr[@]}"
  fi
}

status_code() { awk 'NR==1{print $2}' ; }
json_body() { awk 'BEGIN{p=0} /^\r?$/{p=1;next} {if(p)print}' ; }

echo "BASE_URL=$BASE_URL TENANT=$TENANT EMAIL=$EMAIL"

echo
echo "1) Health"
retry curl -sS -o /dev/null "${BASE_URL}/api/health"
curl -sS "${BASE_URL}/api/health" | head -c 300; echo

echo
echo "2) Store Register (idempotent)"
reg_body="$(jq -n --arg email "$EMAIL" --arg password "$PASS" '{email:$email,password:$password}')"
reg_resp="$(req POST /api/store/auth/register "" "$reg_body" || true)"
reg_code="$(printf '%s' "$reg_resp" | status_code)"
echo "register_status=$reg_code (200/201 ok, 409 ok)"
if [[ "$reg_code" != "200" && "$reg_code" != "201" && "$reg_code" != "409" ]]; then
  echo "$reg_resp" | tail -n +1
  exit 1
fi

echo
echo "3) Store Login"
login_body="$(jq -n --arg email "$EMAIL" --arg password "$PASS" '{email:$email,password:$password}')"
login_resp="$(req POST /api/store/auth/login "" "$login_body" || true)"
login_code="$(printf '%s' "$login_resp" | status_code)"
login_json="$(printf '%s' "$login_resp" | json_body)"
token="$(printf '%s' "$login_json" | jq -r '.accessToken // empty' 2>/dev/null || true)"

echo "login_status=$login_code token_len=${#token}"
if [[ -z "$token" ]]; then
  echo "❌ Login failed: accessToken empty"
  echo "$login_resp"
  exit 1
fi

echo
echo "4) Store Me"
req GET /api/store/auth/me "$token" | head -n 40

echo
echo "5) Customer Me"
req GET /api/store/customers/me "$token" | head -n 60

echo
echo "6) Customer Update (noop)"
upd_body="$(jq -n '{firstName:"Buyer", lastName:"One"}')"
req PATCH /api/store/customers/me "$token" "$upd_body" | head -n 60

echo
echo "8) Checkout Create (auto cart)"
co_body="$(jq -n --arg email "$EMAIL" '{email:$email, currencyCode:"EUR"}')"
co_resp="$(req POST /api/store/checkouts "$token" "$co_body")"
co_json="$(printf '%s' "$co_resp" | json_body)"
checkout_id="$(printf '%s' "$co_json" | jq -r '.checkout.id // empty')"
cart_id="$(printf '%s' "$co_json" | jq -r '.checkout.cartId // empty')"
echo "checkout_id=$checkout_id cart_id=$cart_id"
[[ -n "$checkout_id" ]] || { echo "$co_resp"; exit 1; }

echo
echo "9) Checkout Address Upsert"
co_addr_body="$(jq -n '{
  type:"SHIPPING",
  fullName:"Buyer One",
  phone:"0000000",
  line1:"Street 1",
  city:"Podgorica",
  postalCode:"81000",
  countryIso2:"ME"
}')"
req PATCH "/api/store/checkouts/${checkout_id}/address" "$token" "$co_addr_body" | head -n 120

echo
echo "10) Payment Providers"
req GET "/api/store/checkouts/${checkout_id}/payment-providers" "$token" | head -n 160


echo
echo "7) Address Create/List/Delete"
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

create_resp="$(req POST /api/store/customers/me/addresses "$token" "$addr_body")"
addr_id="$(printf '%s' "$create_resp" | json_body | jq -r '.address.id // empty')"
echo "address_id=$addr_id"
[[ -n "$addr_id" ]] || { echo "$create_resp"; exit 1; }

req GET /api/store/customers/me/addresses "$token" | head -n 80
req DELETE "/api/store/customers/me/addresses/${addr_id}" "$token" | head -n 40

echo
echo "✅ Store smoke OK"
