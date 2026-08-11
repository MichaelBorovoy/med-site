import { getDashboardStats, listUsers } from "@/lib/db";

export default async function AdminHomePage() {
  const stats = getDashboardStats();
  const users = listUsers();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Operations overview
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Manage patients, medical records, and appointments from one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {(
          [
            ["Patients", stats.patients],
            ["Doctors", stats.doctors],
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
          User accounts
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Passwords are stored as hashes only. Usernames and passwords are never
          committed to the repository.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[var(--muted)]">
              <tr>
                <th className="py-2 pr-4 font-medium">Username</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Linked patient</th>
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
                    {user.full_name || "—"}
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
