#!/usr/bin/env bash
# One-time Hetzner VPS setup for HarborCare.
# Run as root (or with sudo): bash bootstrap.sh
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
  ca-certificates curl git ufw fail2ban

# Docker Engine + Compose plugin
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

id -u "${DEPLOY_USER}" >/dev/null 2>&1 || useradd --create-home --shell /bin/bash "${DEPLOY_USER}"
usermod -aG docker "${DEPLOY_USER}"

mkdir -p "${APP_DIR}/data"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}"

# Open HTTP/HTTPS; keep SSH
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable || true

if [[ ! -f "${APP_DIR}/.env" ]]; then
  cat > "${APP_DIR}/.env" <<'EOF'
# Required
DOMAIN=example.com
ACME_EMAIL=you@example.com
SESSION_SECRET=replace-with-a-long-random-string
ADMIN_USERNAME=
ADMIN_PASSWORD=

# Optional demo accounts (leave blank in production)
DEMO_PATIENT_USERNAME=
DEMO_PATIENT_PASSWORD=
DEMO_DOCTOR_USERNAME=
DEMO_DOCTOR_PASSWORD=
DEMO_COORDINATOR_USERNAME=
DEMO_COORDINATOR_PASSWORD=
EOF
  chown "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}/.env"
  chmod 600 "${APP_DIR}/.env"
  echo "Created ${APP_DIR}/.env — edit DOMAIN, ACME_EMAIL, SESSION_SECRET, and admin credentials."
fi

echo
echo "Bootstrap complete."
echo "1) Edit ${APP_DIR}/.env"
echo "2) Add GitHub Actions secrets: HETZNER_HOST, HETZNER_USER, HETZNER_SSH_KEY"
echo "3) Push to main (or run the deploy workflow) to ship the first release."
