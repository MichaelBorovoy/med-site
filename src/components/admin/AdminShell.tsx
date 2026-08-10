import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/patients", label: "Patients" },
  { href: "/admin/doctors", label: "Doctors" },
  { href: "/admin/records", label: "Records" },
  { href: "/admin/appointments", label: "Appointments" },
];

export function AdminShell({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--panel)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]">
              HarborCare
            </p>
            <p className="text-sm text-[var(--muted)]">Admin console</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--ink-soft)]">{username}</span>
            <LogoutButton />
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm text-[var(--ink-soft)] transition hover:bg-white hover:text-[var(--ink)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
