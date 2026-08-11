import { Suspense } from "react";
import Link from "next/link";
import { ServicesDirectory } from "@/components/services/ServicesDirectory";
import { getSession } from "@/lib/auth";
import {
  ensureDb,
  listDoctorsForFilter,
  listServiceSpecialties,
  searchServices,
} from "@/lib/db";
import { homeForRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  specialty?: string;
  doctor?: string;
  page?: string;
}>;

export default async function PublicServicesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await ensureDb();
  const session = await getSession();
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const specialty = params.specialty?.trim() || "All";
  const doctorId = Number(params.doctor || "0") || 0;
  const page = Number(params.page || "1") || 1;

  const result = await searchServices({
    query,
    specialty,
    doctorId,
    page,
    pageSize: 10,
  });
  const specialties = await listServiceSpecialties();
  const doctors = await listDoctorsForFilter({
    specialty,
    limit: specialty === "All" ? 100 : 300,
  });

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--panel)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <Link
              href="/"
              className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]"
            >
              HarborCare
            </Link>
            <p className="text-sm text-[var(--muted)]">Services directory</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/doctors"
              className="rounded-md px-3 py-1.5 text-sm text-[var(--ink-soft)] hover:bg-white"
            >
              Doctors
            </Link>
            <Link
              href="/clinics"
              className="rounded-md px-3 py-1.5 text-sm text-[var(--ink-soft)] hover:bg-white"
            >
              Clinics
            </Link>
            <Link
              href={session ? homeForRole(session.role) : "/login"}
              className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
            >
              {session ? "Open portal" : "Sign in"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
            Care services
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Filter the service catalog by specialty and doctor when there are
            many offerings.
          </p>
        </div>
        <Suspense fallback={<p className="text-[var(--muted)]">Loading services…</p>}>
          <ServicesDirectory
            services={result.services}
            specialties={specialties}
            doctors={doctors}
            total={result.total}
            page={result.page}
            pageSize={result.pageSize}
            totalPages={result.totalPages}
            initialQuery={query}
            initialSpecialty={specialty}
            initialDoctorId={doctorId ? String(doctorId) : ""}
          />
        </Suspense>
      </main>
    </div>
  );
}
