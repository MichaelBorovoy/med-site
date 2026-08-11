#!/usr/bin/env bash
# One-time Hetzner VPS setup for HarborCare.
# Run as root: sudo bash deploy/hetzner/bootstrap.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/harborcare}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo bash deploy/hetzner/bootstrap.sh"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends \
  ca-certificates curl git ufw fail2ban rsync

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

id -u "${DEPLOY_USER}" >/dev/null 2>&1 || useradd --create-home --shell /bin/bash "${DEPLOY_USER}"
usermod -aG docker "${DEPLOY_USER}"

mkdir -p "${APP_DIR}"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}"

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable || true

if [[ ! -f "${APP_DIR}/.env" ]]; then
  cat > "${APP_DIR}/.env" <<'EOF'
# Public site
DOMAIN=care.example.com
ACME_EMAIL=you@example.com

# Supabase Postgres (transaction pooler URI)
DATABASE_URL=postgresql://postgres.xxxx:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres

# App auth
SESSION_SECRET=replace-with-openssl-rand-hex-32
ADMIN_USERNAME=
ADMIN_PASSWORD=

# Leave demo accounts blank in production
DEMO_PATIENT_USERNAME=
DEMO_PATIENT_PASSWORD=
DEMO_DOCTOR_USERNAME=
DEMO_DOCTOR_PASSWORD=
DEMO_COORDINATOR_USERNAME=
DEMO_COORDINATOR_PASSWORD=
EOF
  chown "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}/.env"
  chmod 600 "${APP_DIR}/.env"
  echo "Created ${APP_DIR}/.env — edit DOMAIN, DATABASE_URL, SESSION_SECRET, and admin credentials."
fi

echo
echo "Bootstrap complete."
echo "1) Point your domain A/AAAA records at this server"
echo "2) Edit ${APP_DIR}/.env (Supabase DATABASE_URL + secrets)"
echo "3) Apply supabase/migrations/*.sql in the Supabase SQL Editor (once)"
echo "4) Add GitHub Actions secrets: HETZNER_HOST, HETZNER_USER, HETZNER_SSH_KEY"
echo "5) Merge to main — Actions will rsync and restart the stack"
