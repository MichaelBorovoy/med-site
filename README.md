# HarborCare Medical Portal

Role-based medical portal for guests, patients, doctors, coordinators, and admins.

## Roles

| Role | Access |
|------|--------|
| **Guest** | Public home, clinics, and doctor directory (`/`, `/clinics`, `/doctors`) |
| **Patient** | Own records, appointments, prescriptions; can edit own profile contact fields only |
| **Doctor** | Assigned appointments; view those patients' documents; create documents from appointments |
| **Coordinator** | Assist patients with scheduling and appointment status updates |
| **Admin** | Full management of patients, clinics, doctors, records, appointments, and accounts |

## Clinics + large doctor catalogs

HarborCare models a clinic network:

- 5 clinics group doctors by location
- Doctor directory supports clinic filter + category + search + pagination
- Optional local scale seed: set `DEMO_SCALE_DOCTORS=1000` in `.env.local`

## Credentials policy

Real login values live only in local environment files:

1. Copy `.env.example` to `.env.local`
2. Fill in `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
3. Optionally set demo patient / doctor / coordinator credentials

`.env*` files (except `.env.example`) and `data/` are gitignored.

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local with your own credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js (App Router) + TypeScript
- SQLite (`better-sqlite3`)
- bcrypt password hashing
- JWT session cookies (`jose`)
- Shared `apiClient` for browser requests
