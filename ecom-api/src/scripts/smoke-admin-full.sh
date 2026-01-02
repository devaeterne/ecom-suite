#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-http://localhost:3001}"
EMAIL="${OWNER_EMAIL:-admin@acme.com}"
PASS="${OWNER_PASS:-ChangeMe123!}"

# İstersen dışarıdan API_BASE kullanıyorsan bunu da destekle:
API_BASE="${API_BASE:-$BASE}"

echo "🔐 Login…"

TOKEN="$(curl -sS \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  "$BASE/api/admin/auth/login" | jq -r '.accessToken')"

echo "TOKEN_LEN=${#TOKEN}"
test "${#TOKEN}" -gt 50 || { echo "❌ token alınamadı"; exit 1; }

AUTH=(-H "Authorization: Bearer $TOKEN")
JSON=(-H "Content-Type: application/json")

echo "✅ login ok"
echo

# 1) RBAC bootstrap
echo "🧱 RBAC bootstrap"
curl -sS -X POST "${AUTH[@]}" \
  "$BASE/api/admin/rbac/bootstrap" | jq .
echo

# 2) tenants/me
echo "🏢 tenant resolve"
TENANT_JSON="$(curl -sS "${AUTH[@]}" \
  "$BASE/api/admin/tenants/me")"

echo "$TENANT_JSON" | jq .
TENANT_ID="$(echo "$TENANT_JSON" | jq -r '.id')"
test -n "$TENANT_ID" || { echo "❌ tenantId yok"; exit 1; }

echo "TENANT_ID=$TENANT_ID"
echo

TENANT=(-H "x-tenant-id: $TENANT_ID")

# 3) roles list
echo "🧑‍⚖️ roles list"
curl -sS "${AUTH[@]}" "${TENANT[@]}" \
  "$BASE/api/admin/roles" | jq .
echo

# 4) identities list
echo "👤 identities list"
curl -sS "${AUTH[@]}" "${TENANT[@]}" \
  "$BASE/api/admin/identities" | jq .
echo

# 5) identity create
INV_EMAIL="invitee-$(date +%s)@acme.com"
echo "📨 create identity ($INV_EMAIL)"

CREATE_ID_RES="$(curl -sS -X POST \
  "${AUTH[@]}" "${TENANT[@]}" "${JSON[@]}" \
  -d "{\"email\":\"$INV_EMAIL\",\"roleScope\":\"STAFF\"}" \
  "$BASE/api/admin/identities")"

echo "$CREATE_ID_RES" | jq .

IDENTITY_ID="$(echo "$CREATE_ID_RES" | jq -r '.id')"
test -n "$IDENTITY_ID" || { echo "❌ identity create failed"; exit 1; }

echo "IDENTITY_ID=$IDENTITY_ID"
echo

# 6) invite
echo "✉️ invite identity"

INVITE_RES="$(curl -sS \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "content-type: application/json" \
  -X POST "$BASE/api/admin/identities/$IDENTITY_ID/invite" \
  -d '{}' | jq .
)"

echo "$INVITE_RES" | jq .

OK="$(echo "$INVITE_RES" | jq -r '.ok // empty')"
test "$OK" = "true" || { echo "❌ invite failed"; exit 1; }

echo
echo "🎉 ADMIN SMOKE OK"
echo "tenant=$TENANT_ID identity=$IDENTITY_ID"
