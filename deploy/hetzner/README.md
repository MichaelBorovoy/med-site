# HarborCare on Hetzner (CI/CD)

Deploys on every push to `main` (and via **Actions → Deploy to Hetzner → Run workflow**).

## One-time server setup

1. Create a Hetzner Cloud CX22+ (Ubuntu 24.04).
2. Point your domain **A/AAAA** records at the server IP.
3. SSH in as root and bootstrap:

```bash
# Copy bootstrap from the repo after first clone, or paste from GitHub
curl -fsSL https://raw.githubusercontent.com/MichaelBorovoy/med-site/main/deploy/hetzner/bootstrap.sh | bash
```

4. Create a non-root deploy user SSH key pair (if bootstrap did not):

```bash
# on your laptop
ssh-keygen -t ed25519 -f ~/.ssh/harborcare_deploy -N ""
ssh-copy-id -i ~/.ssh/harborcare_deploy.pub deploy@YOUR_SERVER_IP
```

5. Edit production secrets (never commit these):

```bash
sudo nano /opt/harborcare/.env
```

Required:

- `DOMAIN` — e.g. `care.example.com`
- `ACME_EMAIL` — Let’s Encrypt contact email
- `SESSION_SECRET` — long random string (`openssl rand -hex 32`)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`

6. Ensure the deploy user can manage Docker and the app dir (bootstrap already does this).

## GitHub Actions secrets

Repo → **Settings → Secrets and variables → Actions**:

| Secret | Value |
| --- | --- |
| `HETZNER_HOST` | Server IP or hostname |
| `HETZNER_USER` | `deploy` |
| `HETZNER_SSH_KEY` | Private key contents (`harborcare_deploy`) |
| `HETZNER_SSH_PORT` | Optional, default `22` |

## How deploy works

1. GitHub Actions rsyncs the repo to `/opt/harborcare` (keeps `.env` and `data/`).
2. Server runs `deploy/hetzner/deploy.sh`:
   - builds the Docker image (compiles `better-sqlite3` for Linux)
   - starts `app` + `caddy` (HTTPS)
   - health-checks `/api/health`

## Useful commands on the VPS

```bash
cd /opt/harborcare
docker compose ps
docker compose logs -f app
docker compose restart app
```

SQLite lives in `/opt/harborcare/data/medportal.db` — back it up daily.
