import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/patient/ProfileEditor";
import { requireSession } from "@/lib/auth";
import {
  getPatient,
  listAppointments,
  listPrescriptions,
  listRecords,
} from "@/lib/db";

export default async function PatientHomePage() {
  const session = await requireSession("patient");
  if (!session?.patientId) {
    redirect("/login");
  }

  const patient = await getPatient(session.patientId);
  if (!patient) {
    redirect("/login");
  }

  const records = await listRecords(session.patientId);
  const appointments = await listAppointments(session.patientId);
  const prescriptions = await listPrescriptions(session.patientId);
  const nextAppointment = appointments.find((item) => item.status === "scheduled");

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-[var(--line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(232,245,240,0.9))] p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
          Welcome back
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] md:text-5xl">
          {patient.full_name}
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">
          You can view only your own records and update your profile contact
          details.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <p className="text-sm text-[var(--muted)]">Records</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-4xl">
            {records.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <p className="text-sm text-[var(--muted)]">Appointments</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-4xl">
            {appointments.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <p className="text-sm text-[var(--muted)]">Prescriptions</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-4xl">
            {prescriptions.length}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Profile
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Email</dt>
              <dd className="text-[var(--ink)]">{patient.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Date of birth</dt>
              <dd className="text-[var(--ink)]">{patient.date_of_birth}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Blood type</dt>
              <dd className="text-[var(--ink)]">{patient.blood_type || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Allergies</dt>
              <dd className="text-right text-[var(--ink)]">
                {patient.allergies || "None on file"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Emergency contact</dt>
              <dd className="text-right text-[var(--ink)]">
                {patient.emergency_contact || "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Next appointment
          </h2>
          {nextAppointment ? (
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-medium text-[var(--ink)]">
                {nextAppointment.reason}
              </p>
              <p className="text-[var(--ink-soft)]">
                with {nextAppointment.provider_name}
              </p>
              <p className="text-[var(--muted)]">
                {new Date(nextAppointment.scheduled_at).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--muted)]">
              No upcoming appointments on file.
            </p>
          )}

          <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Active prescriptions
          </h3>
          <ul className="mt-3 space-y-3">
            {prescriptions.slice(0, 3).map((rx) => (
              <li key={rx.id} className="text-sm">
                <p className="font-medium text-[var(--ink)]">
                  {rx.medication} · {rx.dosage}
                </p>
                <p className="text-[var(--muted)]">
                  {rx.instructions || "Follow provider instructions."}
                </p>
              </li>
            ))}
            {prescriptions.length === 0 ? (
              <li className="text-sm text-[var(--muted)]">
                No prescriptions on file.
              </li>
            ) : null}
          </ul>
        </section>
      </div>

      <ProfileEditor
        phone={patient.phone || ""}
        allergies={patient.allergies || ""}
        emergencyContact={patient.emergency_contact || ""}
      />
    </div>
  );
}
