import { AppointmentsManager } from "@/components/admin/AppointmentsManager";
import { getDb, listPatients } from "@/lib/db";

export default async function AdminAppointmentsPage() {
  const patients = listPatients();
  const appointments = getDb()
    .prepare(
      `SELECT a.*, p.full_name AS patient_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       ORDER BY a.scheduled_at DESC`,
    )
    .all() as Array<{
    id: number;
    patient_id: number;
    patient_name: string;
    provider_name: string;
    reason: string;
    status: "scheduled" | "completed" | "cancelled";
    scheduled_at: string;
    notes: string | null;
  }>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Appointments
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Schedule visits and update appointment status.
        </p>
      </div>
      <AppointmentsManager patients={patients} appointments={appointments} />
    </div>
  );
}
