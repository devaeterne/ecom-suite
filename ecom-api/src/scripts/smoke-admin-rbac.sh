BASE="http://localhost:3001"

TOKEN="$(curl -sS -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"ChangeMe123!"}' \
  "$BASE/api/admin/auth/login" | jq -r '.accessToken')"

echo "TOKEN_LEN=${#TOKEN}"
test "${#TOKEN}" -gt 50

# 1) bootstrap
curl -sS -X POST -H "Authorization: Bearer $TOKEN" \
  "$BASE/api/admin/rbac/bootstrap" | jq .

# 2) tenants/me (tenant:read)
curl -sS -H "Authorization: Bearer $TOKEN" \
  "$BASE/api/admin/tenants/me" | jq .

# 3) roles list (rbac:read)
curl -sS -H "Authorization: Bearer $TOKEN" \
  "$BASE/api/admin/roles" | jq .

# 4) identities list (identity:read)
curl -sS -H "Authorization: Bearer $TOKEN" \
  "$BASE/api/admin/identities" | jq .

