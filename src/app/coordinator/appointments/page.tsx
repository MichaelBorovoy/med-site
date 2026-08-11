import { AssistAppointments } from "@/components/coordinator/AssistAppointments";
import {
  listAppointmentsWithPatientNames,
  listDoctors,
  listPatients,
} from "@/lib/db";

export default async function CoordinatorAppointmentsPage() {
  const patients = await listPatients();
  const doctors = await listDoctors();
  const appointments = await listAppointmentsWithPatientNames();

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
