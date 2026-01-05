#!/usr/bin/env bash
set -euo pipefail

LOG_DIR="${LOG_DIR:-/tmp}"
TS="$(date +%Y%m%d_%H%M%S)"
LOG_FILE="${LOG_DIR}/smoke-store-${TS}.log"

# full smoke script path (repo içinde neredeyse onu ver)
SMOKE="${SMOKE:-./src/scripts/smoke-store-full.sh}"
# --- compact UI helpers ---
ok()  { echo "✅ $*"; }
bad() { echo "❌ $*"; }

log_file="${LOG_FILE:-/tmp/smoke-store-$(date +%Y%m%d_%H%M%S).log}"

run_step() {
  # usage: run_step "label" "expected1|expected2" "cmd..."
  local label="$1"; shift
  local expected="$1"; shift

  local out code body
  out="$("$@" 2>&1 || true)"
  code="$(printf '%s' "$out" | status_code)"
  body="$(printf '%s' "$out" | json_body)"

  {
    echo
    echo "== $label =="
    echo "$out"
  } >>"$log_file"

  IFS='|' read -r e1 e2 e3 <<<"$expected"
  if need_ok "$code" "$e1" "$e2" "$e3"; then
    ok "$label ($code)"
    return 0
  fi

  # fail: terminal minimal, log full
  bad "$label ($code)  details: $log_file"

  # kısa hata özeti: json body varsa onu bas
  if [[ -n "$body" ]]; then
    echo "$body" | head -c 500; echo
  fi

  # son satırlar
  echo "---- tail (log) ----"
  tail -n 30 "$log_file" || true
  echo "--------------------"
  return 1
}

# Unicode/emoji destekli tek satır ikonlar
OK_ICON="✅"
ERR_ICON="❌"
INFO_ICON="ℹ️"

# stdout+stderr log'a
set +e
bash "$SMOKE" >"$LOG_FILE" 2>&1
code=$?
set -e

if [[ $code -eq 0 ]]; then
  echo "${OK_ICON} smoke: AUTH OK | CUSTOMER OK | CHECKOUT OK | PAYMENTS OK | ORDERS OK"
  exit 0
fi

# Hata: terminale kısa bir özet bas, detay log dosyada kalsın
last_http="$(grep -nE '^HTTP/|register_status=|login_status=|checkout_id=|inventory_.*_status=|payment_start_status=|order_create_status=|\"statusCode\"|\"message\"|❌' "$LOG_FILE" | tail -n 60 || true)"
echo "${ERR_ICON} smoke FAILED (${INFO_ICON} details: ${LOG_FILE})"
echo "---- tail summary ----"
echo "$last_http"
echo "----------------------"

exit $code
