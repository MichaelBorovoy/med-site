#!/usr/bin/env bash
# Runs on the Hetzner VPS after CI syncs the release.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/harborcare}"
ENV_FILE_PREFERRED="${ENV_FILE_PREFERRED:-/etc/harborcare/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
cd "${APP_DIR}"

resolve_env_file() {
  if [[ -f "${ENV_FILE_PREFERRED}" ]]; then
    ln -sfn "${ENV_FILE_PREFERRED}" "${APP_DIR}/.env"
    printf '%s\n' "${ENV_FILE_PREFERRED}"
    return
  fi
  if [[ -L "${APP_DIR}/.env" || -f "${APP_DIR}/.env" ]]; then
    readlink -f "${APP_DIR}/.env" 2>/dev/null || printf '%s\n' "${APP_DIR}/.env"
    return
  fi
  return 1
}

ENV_FILE="$(resolve_env_file)" || {
  echo "Missing production env file."
  echo "Create ${ENV_FILE_PREFERRED} and set required keys (see deploy/hetzner/README.md)."
  exit 1
}

echo "Loading env from ${ENV_FILE}"

# shellcheck disable=SC1091
set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "${name} is missing or empty in ${ENV_FILE}"
    exit 1
  fi
}

require_var DOMAIN
if [[ -z "${DATABASE_URL:-}" && -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "DATABASE_URL is missing or empty in ${ENV_FILE}"
  exit 1
fi
require_var SESSION_SECRET

docker compose -f "${COMPOSE_FILE}" pull caddy || true
docker compose -f "${COMPOSE_FILE}" build --pull app
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans

echo "Waiting for health…"
for attempt in $(seq 1 40); do
  if docker compose -f "${COMPOSE_FILE}" exec -T app \
    node -e "fetch('http://127.0.0.1:3000/api/health').then(async r=>{const t=await r.text(); if(!r.ok){console.error(t); process.exit(1)} process.exit(0)}).catch(e=>{console.error(String(e)); process.exit(1)})" \
    ; then
    echo "HarborCare is healthy."
    docker compose -f "${COMPOSE_FILE}" ps
    exit 0
  fi
  echo "Health attempt ${attempt}/40 failed; retrying…"
  sleep 3
done

echo "Deploy finished but health check did not pass."
echo "--- app logs (tail) ---"
docker compose -f "${COMPOSE_FILE}" logs --tail=120 app || true
echo "--- container status ---"
docker compose -f "${COMPOSE_FILE}" ps || true
exit 1
