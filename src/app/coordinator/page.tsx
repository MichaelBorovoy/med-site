import Link from "next/link";
import { getDashboardStats, listAssistanceQueue, listPatients } from "@/lib/db";

export default async function CoordinatorHomePage() {
  const [stats, queue, patients] = await Promise.all([
    getDashboardStats(),
    listAssistanceQueue("open"),
    listPatients(),
  ]);

  const waiting = queue.filter((item) => item.status === "waiting").slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Assistance workplace
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Work the incoming queue, consult patients by phone or chat with their
          medical record, and create new chart notes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <p className="text-sm text-[var(--muted)]">Waiting in queue</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-4xl">
            {stats.queueWaiting}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <p className="text-sm text-[var(--muted)]">In progress</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-4xl">
            {stats.queueInProgress}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <p className="text-sm text-[var(--muted)]">Patients</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-4xl">
            {stats.patients}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <p className="text-sm text-[var(--muted)]">Scheduled visits</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-4xl">
            {stats.appointments}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">
            Incoming queue
          </h2>
          <Link
            href="/coordinator/queue"
            className="text-sm font-medium text-[var(--accent)]"
          >
            Open full queue
          </Link>
        </div>
        <ul className="mt-4 space-y-3">
          {waiting.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)]/70 pb-3 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-[var(--ink)]">
                  {item.subject}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {item.patient_name}
                  {item.patient_phone ? ` · ${item.patient_phone}` : ""} ·{" "}
                  {item.channel} · {item.priority}
                </p>
              </div>
              <Link
                href={`/coordinator/patients/${item.patient_id}?queue=${item.id}`}
                className="rounded-md border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--ink)]"
              >
                Open consult
              </Link>
            </li>
          ))}
          {waiting.length === 0 ? (
            <li className="text-sm text-[var(--muted)]">
              No waiting items right now.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">
            Patients
          </h2>
          <Link
            href="/coordinator/patients"
            className="text-sm font-medium text-[var(--accent)]"
          >
            View all
          </Link>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {patients.slice(0, 5).map((patient) => (
            <li key={patient.id} className="flex justify-between gap-4">
              <Link
                href={`/coordinator/patients/${patient.id}`}
                className="text-[var(--ink)] hover:underline"
              >
                {patient.full_name}
              </Link>
              <span className="text-[var(--muted)]">
                {patient.phone || "No phone"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
