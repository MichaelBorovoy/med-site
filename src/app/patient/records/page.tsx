import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { listRecords } from "@/lib/db";

export default async function PatientRecordsPage() {
  const session = await requireSession("patient");
  if (!session?.patientId) {
    redirect("/login");
  }

  const records = await listRecords(session.patientId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Medical records
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Visit notes, labs, and care summaries shared with you.
        </p>
      </div>

      <div className="space-y-4">
        {records.map((record) => (
          <article
            key={record.id}
            className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              {record.record_type}
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              {record.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              {record.provider_name || "Care team"} ·{" "}
              {new Date(record.recorded_at).toLocaleString()}
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
              {record.summary}
            </p>
            {record.diagnosis ? (
              <p className="mt-3 text-sm">
                <span className="text-[var(--muted)]">Diagnosis:</span>{" "}
                <span className="text-[var(--ink)]">{record.diagnosis}</span>
              </p>
            ) : null}
            {record.treatment ? (
              <p className="mt-1 text-sm">
                <span className="text-[var(--muted)]">Treatment:</span>{" "}
                <span className="text-[var(--ink)]">{record.treatment}</span>
              </p>
            ) : null}
          </article>
        ))}

        {records.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-10 text-center text-[var(--muted)]">
            No medical records are available yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
