import { DoctorsDirectory } from "@/components/doctors/DoctorsDirectory";
import { listDoctorCategories, listDoctors } from "@/lib/db";

export default async function PatientDoctorsPage() {
  const doctors = listDoctors();
  const categories = listDoctorCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Our doctors
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Browse clinicians by category and read about their experience and
          focus areas.
        </p>
      </div>
      <DoctorsDirectory doctors={doctors} categories={categories} />
    </div>
  );
}
