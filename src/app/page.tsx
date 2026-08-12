import Link from "next/link";
import { PublicSiteHeader } from "@/components/PublicSiteHeader";
import { getSession } from "@/lib/auth";
import {
  ensureDb,
  listClinics,
  listDoctorCategories,
  searchDoctors,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureDb();
  const session = await getSession();

  const { doctors } = await searchDoctors({ page: 1, pageSize: 3 });
  const categories = await listDoctorCategories();
  const clinics = await listClinics();

  return (
    <div className="min-h-screen">
      <PublicSiteHeader session={session} />

      <main>
        <section className="relative overflow-hidden px-4 py-16 md:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,118,110,0.12),transparent_45%),radial-gradient(700px_320px_at_80%_10%,rgba(22,78,99,0.16),transparent)]"
          />
          <div className="relative mx-auto max-w-6xl">
            <p className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
              Public guest page
            </p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-5xl tracking-tight text-[var(--ink)] md:text-6xl">
              HarborCare
            </p>
            <h1 className="mt-4 max-w-2xl text-2xl text-[var(--ink-soft)] md:text-3xl">
              Browse clinics, doctors, and services without signing in.
            </h1>
            <p className="mt-4 max-w-xl text-[var(--muted)]">
              Guests explore public care info across the clinic network.
              Patients, doctors, coordinators, and admins sign in for private
              workspaces.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/clinics"
                className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-strong)]"
              >
                View clinics
              </Link>
              <Link
                href="/doctors"
                className="rounded-lg border border-[var(--line)] bg-white/70 px-4 py-2.5 text-sm font-semibold text-[var(--ink)]"
              >
                Browse doctors
              </Link>
              <Link
                href="/services"
                className="rounded-lg border border-[var(--line)] bg-white/70 px-4 py-2.5 text-sm font-semibold text-[var(--ink)]"
              >
                Browse services
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-10">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
            Clinics
          </h2>
          <p className="mt-2 text-[var(--muted)]">
            {clinics.length} locations ·{" "}
            {clinics.reduce((sum, clinic) => sum + clinic.doctor_count, 0)}{" "}
            doctors in the network
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clinics.map((clinic) => (
              <Link
                key={clinic.id}
                href={`/doctors?clinic=${clinic.id}`}
                className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 transition hover:border-[var(--accent)]/40"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  {clinic.city}
                </p>
                <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                  {clinic.name}
                </h3>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  {clinic.doctor_count} doctors
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
            Care categories
          </h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((item) => (
              <Link
                key={item.category}
                href={`/doctors?category=${encodeURIComponent(item.category)}`}
                className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 text-sm text-[var(--ink-soft)]"
              >
                {item.category} · {item.count}
              </Link>
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {doctors.map((doctor) => (
              <article
                key={doctor.id}
                className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  {doctor.clinic_name || doctor.category}
                </p>
                <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                  {doctor.full_name}
                </h3>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  {doctor.specialty} · {doctor.years_experience} years
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
