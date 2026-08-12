import Link from "next/link";
import { listPatients } from "@/lib/db";

export default async function CoordinatorPatientsPage() {
  const patients = await listPatients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Patients
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Open a consult to review medical records, log phone or chat contact,
          and create a new chart note.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Emergency contact</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id} className="border-b border-[var(--line)]/70">
                <td className="px-4 py-3">{patient.full_name}</td>
                <td className="px-4 py-3 text-[var(--ink-soft)]">{patient.email}</td>
                <td className="px-4 py-3 text-[var(--ink-soft)]">
                  {patient.phone || "—"}
                </td>
                <td className="px-4 py-3 text-[var(--ink-soft)]">
                  {patient.emergency_contact || "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/coordinator/patients/${patient.id}`}
                    className="font-medium text-[var(--accent)] hover:underline"
                  >
                    Open consult
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
