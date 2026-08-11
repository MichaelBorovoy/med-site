import { getDashboardStats, listPatients } from "@/lib/db";

export default async function CoordinatorHomePage() {
  const stats = await getDashboardStats();
  const patients = (await listPatients()).slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Coordinator desk
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Assist patients with scheduling and appointment follow-up. Clinical
          document creation stays with doctors.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <p className="text-sm text-[var(--muted)]">Doctors</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-4xl">
            {stats.doctors}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Patients needing assistance
        </h2>
        <ul className="mt-4 space-y-2 text-sm">
          {patients.map((patient) => (
            <li key={patient.id} className="flex justify-between gap-4">
              <span className="text-[var(--ink)]">{patient.full_name}</span>
              <span className="text-[var(--muted)]">{patient.phone || "No phone"}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
