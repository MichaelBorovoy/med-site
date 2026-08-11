import { AssistAppointments } from "@/components/coordinator/AssistAppointments";
import { getDb, listDoctors, listPatients } from "@/lib/db";

export default async function CoordinatorAppointmentsPage() {
  const patients = listPatients();
  const doctors = listDoctors();
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
  }>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Appointment assistance
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Schedule visits and update status while supporting patients.
        </p>
      </div>
      <AssistAppointments
        patients={patients}
        doctors={doctors}
        appointments={appointments}
      />
    </div>
  );
}
