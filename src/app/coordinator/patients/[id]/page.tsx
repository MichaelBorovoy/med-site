import Link from "next/link";
import { notFound } from "next/navigation";
import { AssistRecordForm } from "@/components/coordinator/AssistRecordForm";
import { ContactLogForm } from "@/components/coordinator/ContactLogForm";
import {
  getPatient,
  listPatientContactLogs,
  listRecords,
} from "@/lib/db";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ queue?: string }>;
};

export default async function CoordinatorPatientConsultPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { queue } = await searchParams;
  const patientId = Number(id);
  if (!patientId) {
    notFound();
  }

  const patient = await getPatient(patientId);
  if (!patient) {
    notFound();
  }

  const [records, contacts] = await Promise.all([
    listRecords(patientId),
    listPatientContactLogs(patientId),
  ]);

  const queueItemId = queue ? Number(queue) : undefined;
  const phoneHref = patient.phone
    ? `tel:${patient.phone.replace(/\s+/g, "")}`
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            Patient consult
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
            {patient.full_name}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {patient.email}
            {patient.phone ? ` · ${patient.phone}` : ""}
          </p>
          {queueItemId ? (
            <p className="mt-2 text-xs text-[var(--muted)]">
              Linked queue item #{queueItemId}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {phoneHref ? (
            <a
              href={phoneHref}
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              Call patient
            </a>
          ) : null}
          <Link
            href="/coordinator/queue"
            className="rounded-md border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink)]"
          >
            Back to queue
          </Link>
          <Link
            href="/coordinator/patients"
            className="rounded-md border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink)]"
          >
            All patients
          </Link>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Log phone / chat
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Reference patient chats and phone calls against this chart.
          </p>
          <div className="mt-4">
            <ContactLogForm
              patientId={patientId}
              defaultChannel="phone"
              queueItemId={
                queueItemId && Number.isFinite(queueItemId)
                  ? queueItemId
                  : undefined
              }
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            New medical record
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Document the assistance consult for the patient record.
          </p>
          <div className="mt-4">
            <AssistRecordForm patientId={patientId} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Medical records
        </h2>
        <ul className="mt-4 space-y-3">
          {records.map((record) => (
            <li
              key={record.id}
              className="border-b border-[var(--line)]/70 pb-3 last:border-0"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-[var(--ink)]">{record.title}</p>
                <p className="text-xs text-[var(--muted)]">
                  {new Date(record.recorded_at).toLocaleString()}
                </p>
              </div>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                {record.record_type}
                {record.provider_name ? ` · ${record.provider_name}` : ""}
              </p>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">{record.summary}</p>
            </li>
          ))}
          {records.length === 0 ? (
            <li className="text-sm text-[var(--muted)]">No records yet.</li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Contact history
        </h2>
        <ul className="mt-4 space-y-3">
          {contacts.map((log) => (
            <li
              key={log.id}
              className="border-b border-[var(--line)]/70 pb-3 last:border-0"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                  {log.channel} · {log.direction}
                  {log.reference_code ? ` · ref ${log.reference_code}` : ""}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">{log.summary}</p>
              {log.agent_username ? (
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Logged by {log.agent_username}
                </p>
              ) : null}
            </li>
          ))}
          {contacts.length === 0 ? (
            <li className="text-sm text-[var(--muted)]">No contacts logged yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
