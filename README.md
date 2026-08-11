# HarborCare Medical Portal

Secure patient portal for viewing medical records, plus an admin console for managing patients, records, and appointments.

## Features

- Patient portal: profile, medical records, appointments, prescriptions
- Doctor directory: browse clinicians by category with experience descriptions
- Admin panel: create/manage patients, doctors, records, appointments, and view accounts
- Session auth with HTTP-only cookies and role-based access
- Passwords stored as bcrypt hashes only
- **Usernames and passwords are never committed to the repository**

## Credentials policy

Real login values live only in local environment files:

1. Copy `.env.example` to `.env.local`
2. Fill in `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
3. Optionally set `DEMO_PATIENT_USERNAME` / `DEMO_PATIENT_PASSWORD` for a sample patient

`.env`, `.env.local`, and other `.env.*` files (except `.env.example`) are gitignored.  
`.env.example` contains placeholder keys only — no usernames or passwords.

The SQLite database under `data/` is also gitignored.

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local with your own credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Bootstrap accounts are created on first app start when admin credentials are present in `.env.local`.

## Scripts

- `npm run dev` — start development server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — lint the project

## Stack

- Next.js (App Router) + TypeScript
- SQLite (`better-sqlite3`)
- bcrypt password hashing
- JWT session cookies (`jose`)
