#!/usr/bin/env bash
# Runs on the Hetzner VPS after CI syncs the release.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/harborcare}"
cd "${APP_DIR}"

if [[ ! -f .env ]]; then
  echo "Missing ${APP_DIR}/.env — copy from .env.example and set DOMAIN/SESSION_SECRET/admin creds."
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

if [[ -z "${DOMAIN:-}" ]]; then
  echo "DOMAIN must be set in ${APP_DIR}/.env"
  exit 1
fi

mkdir -p data
# Ensure the container user (uid 1001) can write SQLite files
if command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
  sudo chown -R 1001:1001 data || true
else
  chown -R 1001:1001 data 2>/dev/null || true
fi

docker compose pull caddy || true
docker compose build --pull app
docker compose up -d --remove-orphans

echo "Waiting for health…"
for _ in $(seq 1 30); do
  if docker compose exec -T app node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    echo "HarborCare is healthy on https://${DOMAIN}"
    docker compose ps
    exit 0
  fi
  sleep 2
done

echo "Deploy finished but health check did not pass yet. Check logs:"
echo "  docker compose -f ${APP_DIR}/docker-compose.yml logs --tail=100 app"
exit 1
