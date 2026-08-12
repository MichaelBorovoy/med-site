import { Suspense } from "react";
import { DoctorsDirectory } from "@/components/doctors/DoctorsDirectory";
import { PublicSiteHeader } from "@/components/PublicSiteHeader";
import { getSession } from "@/lib/auth";
import {
  ensureDb,
  listClinics,
  listDoctorCategories,
  searchDoctors,
} from "@/lib/db";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  clinic?: string;
  page?: string;
}>;

export default async function PublicDoctorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await ensureDb();
  const session = await getSession();
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const category = params.category?.trim() || "All";
  const clinicId = Number(params.clinic || "0") || 0;
  const page = Number(params.page || "1") || 1;

  const result = await searchDoctors({
    query,
    category,
    clinicId,
    page,
    pageSize: 10,
  });
  const categories = await listDoctorCategories();
  const clinics = await listClinics();

  return (
    <div className="min-h-screen">
      <PublicSiteHeader session={session} subtitle="Public doctor directory" />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] md:text-5xl">
            Meet the care team
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Browse by clinic and category. Results are paginated for large
            networks (for example 1000 doctors across 5 clinics).
          </p>
        </div>
        <Suspense fallback={<p className="text-[var(--muted)]">Loading doctors…</p>}>
          <DoctorsDirectory
            doctors={result.doctors}
            categories={categories}
            clinics={clinics}
            total={result.total}
            page={result.page}
            pageSize={result.pageSize}
            totalPages={result.totalPages}
            initialQuery={query}
            initialCategory={category}
            initialClinicId={clinicId ? String(clinicId) : ""}
          />
        </Suspense>
      </main>
    </div>
  );
}
