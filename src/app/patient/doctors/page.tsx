import { Suspense } from "react";
import { DoctorsDirectory } from "@/components/doctors/DoctorsDirectory";
import { listClinics, listDoctorCategories, searchDoctors } from "@/lib/db";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  clinic?: string;
  page?: string;
}>;

export default async function PatientDoctorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const category = params.category?.trim() || "All";
  const clinicId = Number(params.clinic || "0") || 0;
  const page = Number(params.page || "1") || 1;

  const result = searchDoctors({
    query,
    category,
    clinicId,
    page,
    pageSize: 10,
  });
  const categories = listDoctorCategories();
  const clinics = listClinics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Our doctors
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Filter by clinic and specialty, then search within the current page
          set.
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
    </div>
  );
}
