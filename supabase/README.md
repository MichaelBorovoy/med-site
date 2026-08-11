# Database: local Docker + production Supabase

HarborCare uses **Postgres** everywhere. Same schema, different hosts:

| Environment | Host | How |
| --- | --- | --- |
| Local | Docker Compose Postgres | `npm run db:up` |
| Production | Supabase | Set `DATABASE_URL` to the pooler URI |

Auth stays in the app (JWT cookie + bcrypt). Supabase is the managed DB in prod.

## Local development

```bash
# 1) Start Postgres (applies supabase/migrations on first boot)
npm run db:up

# 2) Copy env and keep the local DATABASE_URL
cp .env.example .env.local
# Set SESSION_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD, optional demo users

# 3) Run the app
npm run dev
```

Default local URL:

```text
postgresql://harborcare:harborcare@127.0.0.1:5432/harborcare
```

Useful commands:

```bash
npm run db:logs    # follow Postgres logs
npm run db:down    # stop container (keeps data)
npm run db:reset   # wipe volume + re-apply schema
```

Health check: open `/api/health` — should return `{ "ok": true }`.

## Production (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`migrations/20260311120000_init.sql`](./migrations/20260311120000_init.sql).
3. In **Project Settings → Database**, copy the **Transaction pooler** URI.
4. On the host (or hosting secrets), set:

```bash
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
SESSION_SECRET=...
ADMIN_USERNAME=...
ADMIN_PASSWORD=...
```

Do **not** set `DATABASE_SSL=false` in production — SSL is enabled automatically for non-local hosts.

## Schema source of truth

All environments use:

`supabase/migrations/20260311120000_init.sql`

- Local Docker mounts it into `/docker-entrypoint-initdb.d/` (runs once on empty volume).
- Supabase: paste into SQL Editor (or `npx supabase db push` if you use the CLI).
