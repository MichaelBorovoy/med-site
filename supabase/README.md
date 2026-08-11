# Supabase setup for HarborCare

HarborCare stores all app data in **Supabase Postgres**. Auth stays in the app (JWT cookie + bcrypt); Supabase is the database.

## 1. Create a project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **Project Settings → Database**.
3. Copy the connection string (URI). Prefer the **Transaction** pooler URL for serverless/Next.js.

## 2. Apply the schema

In the Supabase **SQL Editor**, paste and run:

[`migrations/20260311120000_init.sql`](./migrations/20260311120000_init.sql)

Or with the CLI:

```bash
npx supabase db push
```

## 3. Configure the app

In `.env.local`:

```bash
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
SESSION_SECRET=your-long-random-secret
ADMIN_USERNAME=...
ADMIN_PASSWORD=...
```

On first boot the app seeds clinics, doctors, services, and any demo accounts from env.

## 4. Local run

```bash
npm install
npm run dev
```

Open `/api/health` — it should return `{ "ok": true }` when the DB is reachable.
