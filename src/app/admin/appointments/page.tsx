import { AppointmentsManager } from "@/components/admin/AppointmentsManager";
import { listAppointmentsWithPatientNames, listPatients } from "@/lib/db";

export default async function AdminAppointmentsPage() {
  const patients = await listPatients();
  const appointments = await listAppointmentsWithPatientNames();

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
