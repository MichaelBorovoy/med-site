import { RecordsManager } from "@/components/admin/RecordsManager";
import { listPatients, listRecordsWithPatientNames } from "@/lib/db";

export default async function AdminRecordsPage() {
  const patients = await listPatients();
  const records = await listRecordsWithPatientNames();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Medical records
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Add visit notes, labs, and care summaries for patients.
        </p>
      </div>
      <RecordsManager patients={patients} records={records} />
    </div>
  );
}
