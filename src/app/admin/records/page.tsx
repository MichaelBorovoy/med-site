import { RecordsManager } from "@/components/admin/RecordsManager";
import { getDb, listPatients } from "@/lib/db";

export default async function AdminRecordsPage() {
  const patients = listPatients();
  const records = getDb()
    .prepare(
      `SELECT r.*, p.full_name AS patient_name
       FROM medical_records r
       JOIN patients p ON p.id = r.patient_id
       ORDER BY r.recorded_at DESC`,
    )
    .all() as Array<{
    id: number;
    patient_id: number;
    patient_name: string;
    title: string;
    record_type: string;
    summary: string;
    diagnosis: string | null;
    treatment: string | null;
    provider_name: string | null;
    recorded_at: string;
  }>;

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
