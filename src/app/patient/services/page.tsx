import { Suspense } from "react";
import { ServicesDirectory } from "@/components/services/ServicesDirectory";
import {
  listDoctorsForFilter,
  listServiceSpecialties,
  searchServices,
} from "@/lib/db";

type SearchParams = Promise<{
  q?: string;
  specialty?: string;
  doctor?: string;
  page?: string;
}>;

export default async function PatientServicesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const specialty = params.specialty?.trim() || "All";
  const doctorId = Number(params.doctor || "0") || 0;
  const page = Number(params.page || "1") || 1;

  const result = searchServices({
    query,
    specialty,
    doctorId,
    page,
    pageSize: 10,
  });
  const specialties = listServiceSpecialties();
  const doctors = listDoctorsForFilter({
    specialty,
    limit: specialty === "All" ? 100 : 300,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Available services
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Browse by specialty, then narrow to a doctor who offers that service.
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
    </div>
  );
}
