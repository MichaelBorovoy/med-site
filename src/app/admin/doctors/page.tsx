import { DoctorsManager } from "@/components/admin/DoctorsManager";
import { listDoctors } from "@/lib/db";

export default async function AdminDoctorsPage() {
  const doctors = listDoctors();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Doctors
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Manage the directory of doctors, categories, and experience
          descriptions shown to patients.
        </p>
      </div>
      <DoctorsManager doctors={doctors} />
    </div>
  );
}
