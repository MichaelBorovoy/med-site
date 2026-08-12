# Deploy HarborCare to Hetzner (CD on `main`)

On every merge/push to `main`, GitHub Actions:

1. Rsyncs the repo to `/opt/harborcare` (**does not delete** `/etc/harborcare/.env`)
2. Builds the Docker app image
3. Restarts `app` + `caddy` (HTTPS)

**Database:** Supabase Postgres (not on the VPS).  
**Local DB:** use `npm run db:up` on your laptop — separate from this stack.

## Production secrets location

Put secrets in **`/etc/harborcare/.env`** (outside the synced app folder).

Deploys rsync `/opt/harborcare` and can wipe files there. Keeping `.env` under `/etc/harborcare/` avoids that. The deploy script symlinks it to `/opt/harborcare/.env` for Docker Compose.

```bash
ssh root@YOUR_SERVER_IP

sudo mkdir -p /etc/harborcare
sudo nano /etc/harborcare/.env
sudo chown root:deploy /etc/harborcare /etc/harborcare/.env
sudo chmod 750 /etc/harborcare
sudo chmod 640 /etc/harborcare/.env
sudo ln -sfn /etc/harborcare/.env /opt/harborcare/.env
```

| Variable | Purpose |
| --- | --- |
| `DOMAIN` | Public hostname for the site |
| `ACME_EMAIL` | Email for HTTPS certificate notices |
| `DATABASE_URL` | Supabase DB connection URI (transaction pooler) |
| `SESSION_SECRET` | Long random secret for session cookies |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Initial admin login |

Fill values only on the server. Never commit them or paste them into PRs/issues/chat.

## One-time VPS setup

1. Create a Hetzner Cloud VPS (Ubuntu 24.04).
2. Point domain **A/AAAA** at the server IP.
3. As root, run `bash deploy/hetzner/bootstrap.sh` (creates `/etc/harborcare/.env`).
4. Edit `/etc/harborcare/.env` with real values.
5. Apply `supabase/migrations/20260311120000_init.sql` in Supabase SQL Editor once.
6. Add GitHub Actions secrets (below).

```bash
ssh-keygen -t ed25519 -f ~/.ssh/harborcare_deploy -C "harborcare-github-actions" -N ""
ssh-copy-id -i ~/.ssh/harborcare_deploy.pub deploy@YOUR_SERVER_IP
```

## GitHub Actions secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
| --- | --- |
| `HETZNER_HOST` | Server IP or hostname |
| `HETZNER_USER` | `deploy` |
| `HETZNER_SSH_KEY` | Full private key from `~/.ssh/harborcare_deploy` |
| `HETZNER_SSH_PORT` | Optional (default `22`) |

Then re-run **Actions → Deploy to Hetzner**.

## Ops on the VPS

```bash
cd /opt/harborcare
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml restart app
sudo nano /etc/harborcare/.env   # edit secrets safely
```
