import { getDashboardStats, listUsers } from "@/lib/db";

export default async function AdminHomePage() {
  const stats = await getDashboardStats();
  const users = await listUsers();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Admin console
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Full permissions across patients, doctors, records, appointments, and
          accounts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        {(
          [
            ["Patients", stats.patients],
            ["Clinics", stats.clinics],
            ["Doctors", stats.doctors],
            ["Services", stats.services],
            ["Records", stats.records],
            ["Scheduled", stats.appointments],
            ["Accounts", stats.users],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"
          >
            <p className="text-sm text-[var(--muted)]">{label}</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Role accounts
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Passwords are hashed. Credentials are never committed to the
          repository.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[var(--muted)]">
              <tr>
                <th className="py-2 pr-4 font-medium">Username</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Linked profile</th>
                <th className="py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-[var(--line)]/70">
                  <td className="py-3 pr-4 text-[var(--ink)]">{user.username}</td>
                  <td className="py-3 pr-4 capitalize text-[var(--ink-soft)]">
                    {user.role}
                  </td>
                  <td className="py-3 pr-4 text-[var(--ink-soft)]">
                    {user.patient_name || user.doctor_name || "—"}
                  </td>
                  <td className="py-3 text-[var(--muted)]">
                    {new Date(user.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
