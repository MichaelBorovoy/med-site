import { ClinicsManager } from "@/components/admin/ClinicsManager";
import { listClinics } from "@/lib/db";

export default async function AdminClinicsPage() {
  const clinics = await listClinics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Clinics
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Manage clinic locations that group large doctor networks.
        </p>
      </div>
      <ClinicsManager clinics={clinics} />
    </div>
  );
}
