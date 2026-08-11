import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { listAppointments } from "@/lib/db";

export default async function PatientAppointmentsPage() {
  const session = await requireSession("patient");
  if (!session?.patientId) {
    redirect("/login");
  }

  const appointments = await listAppointments(session.patientId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Appointments
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Upcoming and past visits on your care plan.
        </p>
      </div>

      <div className="space-y-4">
        {appointments.map((appointment) => (
          <article
            key={appointment.id}
            className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                {appointment.status}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {new Date(appointment.scheduled_at).toLocaleString()}
              </p>
            </div>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              {appointment.reason}
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              with {appointment.provider_name}
            </p>
            {appointment.notes ? (
              <p className="mt-3 text-sm text-[var(--ink-soft)]">
                {appointment.notes}
              </p>
            ) : null}
          </article>
        ))}

        {appointments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-10 text-center text-[var(--muted)]">
            No appointments are available yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
