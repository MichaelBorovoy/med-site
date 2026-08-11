import { DoctorsManager } from "@/components/admin/DoctorsManager";
import { listClinics, searchDoctors } from "@/lib/db";

type SearchParams = Promise<{
  q?: string;
  clinic?: string;
  page?: string;
}>;

export default async function AdminDoctorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const clinicId = Number(params.clinic || "0") || 0;
  const page = Number(params.page || "1") || 1;
  const clinics = listClinics();
  const result = searchDoctors({
    query,
    clinicId,
    page,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Doctors
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Assign doctors to clinics and manage directory profiles. Paginated for
          large networks.
        </p>
      </div>
      <DoctorsManager
        clinics={clinics}
        doctors={result.doctors}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        query={query}
        clinicId={clinicId ? String(clinicId) : ""}
      />
    </div>
  );
}
