import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import {
  doctorCanAccessPatient,
  getPatient,
  listRecords,
} from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export default async function DoctorPatientPage({ params }: Params) {
  const session = await requireSession("doctor");
  if (!session?.doctorId) {
    redirect("/login");
  }

  const { id } = await params;
  const patientId = Number(id);
  if (!(await doctorCanAccessPatient(session.doctorId, patientId))) {
    redirect("/doctor");
  }

  const patient = await getPatient(patientId);
  if (!patient) {
    notFound();
  }

  const records = await listRecords(patientId);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/doctor/appointments" className="text-sm text-[var(--accent)]">
          ← Back to appointments
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          {patient.full_name}
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Documents for a patient assigned to you.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 text-sm">
        <p>
          <span className="text-[var(--muted)]">DOB:</span> {patient.date_of_birth}
        </p>
        <p>
          <span className="text-[var(--muted)]">Allergies:</span>{" "}
          {patient.allergies || "None on file"}
        </p>
        <p>
          <span className="text-[var(--muted)]">Blood type:</span>{" "}
          {patient.blood_type || "—"}
        </p>
      </section>

      <div className="space-y-3">
        {records.map((record) => (
          <article
            key={record.id}
            className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              {record.record_type}
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl">
              {record.title}
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              {record.summary}
            </p>
          </article>
        ))}
        {records.length === 0 ? (
          <p className="text-[var(--muted)]">No documents yet.</p>
        ) : null}
      </div>
    </div>
  );
}
