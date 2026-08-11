# Deploy HarborCare to Hetzner (CD on `main`)

On every merge/push to `main`, GitHub Actions:

1. Rsyncs the repo to `/opt/harborcare` (keeps server `.env`)
2. Builds the Docker app image
3. Restarts `app` + `caddy` (HTTPS)

**Database:** Supabase Postgres (not on the VPS).  
**Local DB:** use `npm run db:up` on your laptop — separate from this stack.

## One-time VPS setup

1. Create a Hetzner Cloud VPS (Ubuntu 24.04).
2. Point domain **A/AAAA** at the server IP.
3. As root:

```bash
# After the repo exists on the machine, or curl the script from GitHub:
bash deploy/hetzner/bootstrap.sh
```

4. Edit `/opt/harborcare/.env`:

| Variable | Purpose |
| --- | --- |
| `DOMAIN` | e.g. `care.example.com` |
| `ACME_EMAIL` | Let’s Encrypt email |
| `DATABASE_URL` | Supabase **transaction pooler** URI |
| `SESSION_SECRET` | `openssl rand -hex 32` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Bootstrap admin |

5. In Supabase SQL Editor, run `supabase/migrations/20260311120000_init.sql` once.

6. Create a deploy SSH key and install the public key for user `deploy`.

## GitHub Actions secrets

Repo → **Settings → Secrets and variables → Actions**:

| Secret | Value |
| --- | --- |
| `HETZNER_HOST` | Server IP or hostname |
| `HETZNER_USER` | `deploy` |
| `HETZNER_SSH_KEY` | Private key (full PEM) |
| `HETZNER_SSH_PORT` | Optional (default `22`) |

## Trigger

- Automatic: merge/push to `main`
- Manual: Actions → **Deploy to Hetzner** → Run workflow

## Ops on the VPS

```bash
cd /opt/harborcare
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml restart app
```
