import { listPatients } from "@/lib/db";

export default async function CoordinatorPatientsPage() {
  const patients = listPatients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Patient assistance list
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Contact and scheduling details to help patients through visits.
          Coordinators cannot edit clinical records.
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
