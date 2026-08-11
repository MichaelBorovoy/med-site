import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

const links = [
  { href: "/patient", label: "Home" },
  { href: "/patient/doctors", label: "Doctors" },
  { href: "/patient/services", label: "Services" },
  { href: "/patient/records", label: "Records" },
  { href: "/patient/appointments", label: "Appointments" },
];

export function PatientShell({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--panel)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]">
              HarborCare
            </p>
            <p className="text-sm text-[var(--muted)]">Patient portal</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--ink-soft)]">{name}</span>
            <LogoutButton />
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-3">
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
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
