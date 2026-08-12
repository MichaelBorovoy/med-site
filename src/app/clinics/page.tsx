import Link from "next/link";
import { PublicSiteHeader } from "@/components/PublicSiteHeader";
import { getSession } from "@/lib/auth";
import { ensureDb, listClinics } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ClinicsPage() {
  await ensureDb();
  const session = await getSession();
  const clinics = await listClinics();

  return (
    <div className="min-h-screen">
      <PublicSiteHeader session={session} subtitle="Clinic network" />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
            Our clinics
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Start with a clinic, then browse its doctors. Designed for networks
            with many clinicians across a small set of locations.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clinics.map((clinic) => (
            <article
              key={clinic.id}
              className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"
            >
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                {clinic.city}
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                {clinic.name}
              </h2>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                {clinic.address}
              </p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                {clinic.doctor_count} doctor
                {clinic.doctor_count === 1 ? "" : "s"}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
                {clinic.description}
              </p>
              <Link
                href={`/doctors?clinic=${clinic.id}`}
                className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
              >
                View doctors at this clinic
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
