import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getDoctor, listDoctorAppointments } from "@/lib/db";

export default async function DoctorHomePage() {
  const session = await requireSession("doctor");
  if (!session?.doctorId) {
    redirect("/login");
  }

  const doctor = getDoctor(session.doctorId);
  const appointments = listDoctorAppointments(session.doctorId);
  const upcoming = appointments.filter((item) => item.status === "scheduled");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          {doctor?.full_name}
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          View assigned appointments and add clinical documents for your
          patients.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <p className="text-sm text-[var(--muted)]">Assigned appointments</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-4xl">
            {appointments.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <p className="text-sm text-[var(--muted)]">Upcoming</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-4xl">
            {upcoming.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <p className="text-sm text-[var(--muted)]">Specialty</p>
          <p className="mt-2 text-lg text-[var(--ink)]">
            {doctor?.specialty || "—"}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">
            Upcoming appointments
          </h2>
          <Link href="/doctor/records" className="text-sm text-[var(--accent)]">
            Add document
          </Link>
        </div>
        {upcoming.slice(0, 5).map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"
          >
            <p className="font-medium text-[var(--ink)]">{item.patient_name}</p>
            <p className="text-sm text-[var(--ink-soft)]">{item.reason}</p>
            <p className="text-sm text-[var(--muted)]">
              {new Date(item.scheduled_at).toLocaleString()}
            </p>
            <Link
              href={`/doctor/patients/${item.patient_id}`}
              className="mt-2 inline-block text-sm text-[var(--accent)] hover:underline"
            >
              View patient documents
            </Link>
          </article>
        ))}
        {upcoming.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-[var(--muted)]">
            No upcoming appointments assigned.
          </p>
        ) : null}
      </section>
    </div>
  );
}
