import { redirect } from "next/navigation";
import { RecordComposer } from "@/components/doctor/RecordComposer";
import { requireSession } from "@/lib/auth";
import { listDoctorAppointments } from "@/lib/db";

export default async function DoctorRecordsPage() {
  const session = await requireSession("doctor");
  if (!session?.doctorId) {
    redirect("/login");
  }

  const appointments = await listDoctorAppointments(session.doctorId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Clinical documents
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Create visit notes linked to an appointment.
        </p>
      </div>
      <RecordComposer appointments={appointments} />
    </div>
  );
}
