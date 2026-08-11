import { Suspense } from "react";
import { DoctorsDirectory } from "@/components/doctors/DoctorsDirectory";
import { listDoctorCategories, searchDoctors } from "@/lib/db";

type SearchParams = Promise<{
  q?: string;
  category?: string;
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
  const page = Number(params.page || "1") || 1;

  const result = searchDoctors({
    query,
    category,
    page,
    pageSize: 10,
  });
  const categories = listDoctorCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Our doctors
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Search clinicians by name or specialty, or browse by category.
        </p>
      </div>
      <Suspense fallback={<p className="text-[var(--muted)]">Loading doctors…</p>}>
        <DoctorsDirectory
          doctors={result.doctors}
          categories={categories}
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
          totalPages={result.totalPages}
          initialQuery={query}
          initialCategory={category}
        />
      </Suspense>
    </div>
  );
}
