import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { listDoctorAppointments } from "@/lib/db";

export default async function DoctorAppointmentsPage() {
  const session = await requireSession("doctor");
  if (!session?.doctorId) {
    redirect("/login");
  }

  const appointments = listDoctorAppointments(session.doctorId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Your appointments
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Only appointments assigned to you are visible here.
        </p>
      </div>

      <div className="space-y-3">
        {appointments.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              {item.status}
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl">
              {item.reason}
            </h2>
            <p className="text-sm text-[var(--ink-soft)]">{item.patient_name}</p>
            <p className="text-sm text-[var(--muted)]">
              {new Date(item.scheduled_at).toLocaleString()}
            </p>
            <Link
              href={`/doctor/patients/${item.patient_id}`}
              className="mt-2 inline-block text-sm text-[var(--accent)] hover:underline"
            >
              Open patient chart
            </Link>
          </article>
        ))}
        {appointments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-10 text-center text-[var(--muted)]">
            No appointments assigned yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
