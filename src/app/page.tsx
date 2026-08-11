import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getDb, listDoctorCategories, listDoctors } from "@/lib/db";
import { homeForRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  getDb();
  const session = await getSession();
  const portalHref = session ? homeForRole(session.role) : "/login";

  const doctors = listDoctors().slice(0, 3);
  const categories = listDoctorCategories();

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--panel)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]">
            HarborCare
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/doctors"
              className="rounded-md px-3 py-1.5 text-sm text-[var(--ink-soft)] hover:bg-white"
            >
              Doctors
            </Link>
            {session ? (
              <Link
                href={portalHref}
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-strong)]"
              >
                Open {session.role} portal
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-strong)]"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

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
              Browse clinic and doctor information without signing in.
            </h1>
            <p className="mt-4 max-w-xl text-[var(--muted)]">
              Guests can explore public care info. Patients, doctors,
              coordinators, and admins sign in for their private workspaces.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/doctors"
                className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-strong)]"
              >
                Browse doctors
              </Link>
              <Link
                href={portalHref}
                className="rounded-lg border border-[var(--line)] bg-white/70 px-4 py-2.5 text-sm font-semibold text-[var(--ink)]"
              >
                {session ? "Go to your portal" : "Portal sign in"}
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
            Care categories
          </h2>
          <p className="mt-2 text-[var(--muted)]">
            {categories.length} specialties with clinicians available to review.
          </p>
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
                  {doctor.category}
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
