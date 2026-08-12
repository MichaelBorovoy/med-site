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

6. Create a deploy SSH key and add GitHub secrets (required or Actions will fail):

```bash
# on your laptop
ssh-keygen -t ed25519 -f ~/.ssh/harborcare_deploy -C "harborcare-github-actions" -N ""

# install public key on the VPS (after bootstrap created user deploy)
ssh-copy-id -i ~/.ssh/harborcare_deploy.pub deploy@YOUR_SERVER_IP
```

## GitHub Actions secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
| --- | --- |
| `HETZNER_HOST` | Server IP or hostname |
| `HETZNER_USER` | `deploy` |
| `HETZNER_SSH_KEY` | Full private key from `~/.ssh/harborcare_deploy` (includes `BEGIN`/`END` lines) |
| `HETZNER_SSH_PORT` | Optional (default `22`) |

```bash
cat ~/.ssh/harborcare_deploy   # copy entire output into HETZNER_SSH_KEY
```

Then re-run **Actions → Deploy to Hetzner → Run workflow** (or push to `main`).

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
