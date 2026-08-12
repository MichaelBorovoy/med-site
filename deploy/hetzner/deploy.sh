#!/usr/bin/env bash
# Runs on the Hetzner VPS after CI syncs the release.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/harborcare}"
ENV_FILE_PREFERRED="${ENV_FILE_PREFERRED:-/etc/harborcare/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
cd "${APP_DIR}"

if [[ -f "${ENV_FILE_PREFERRED}" ]]; then
  ln -sfn "${ENV_FILE_PREFERRED}" "${APP_DIR}/.env"
elif [[ ! -f "${APP_DIR}/.env" ]]; then
  echo "Missing production env."
  echo "Create ${ENV_FILE_PREFERRED} (preferred) or ${APP_DIR}/.env with DOMAIN, DATABASE_URL, SESSION_SECRET."
  exit 1
fi

# shellcheck disable=SC1091
set -a
source "${APP_DIR}/.env"
set +a

if [[ -z "${DOMAIN:-}" ]]; then
  echo "DOMAIN must be set in the production .env"
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" && -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "DATABASE_URL (Supabase Postgres) must be set in the production .env"
  exit 1
fi

docker compose -f "${COMPOSE_FILE}" pull caddy || true
docker compose -f "${COMPOSE_FILE}" build --pull app
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans

echo "Waiting for health…"
for _ in $(seq 1 40); do
  if docker compose -f "${COMPOSE_FILE}" exec -T app \
    node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" \
    2>/dev/null; then
    echo "HarborCare is healthy on https://${DOMAIN}"
    docker compose -f "${COMPOSE_FILE}" ps
    exit 0
  fi
  sleep 3
done

echo "Deploy finished but health check did not pass yet. Check logs:"
echo "  docker compose -f ${APP_DIR}/${COMPOSE_FILE} logs --tail=100 app"
exit 1
