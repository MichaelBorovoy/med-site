import { PatientsManager } from "@/components/admin/PatientsManager";
import { listPatients } from "@/lib/db";

export default async function AdminPatientsPage() {
  const patients = await listPatients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Patients
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Create patient profiles and optional portal login credentials.
        </p>
      </div>
      <PatientsManager patients={patients} />
    </div>
  );
}
