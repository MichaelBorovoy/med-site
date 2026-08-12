import Link from "next/link";
import { homeForRole } from "@/lib/permissions";
import type { SessionUser } from "@/lib/types";

const links = [
  { href: "/", label: "Home" },
  { href: "/clinics", label: "Clinics" },
  { href: "/doctors", label: "Doctors" },
  { href: "/services", label: "Services" },
] as const;

export function PublicSiteHeader({
  session,
  subtitle,
}: {
  session: SessionUser | null;
  subtitle?: string;
}) {
  const portalHref = session ? homeForRole(session.role) : "/login";

  return (
    <header className="border-b border-[var(--line)] bg-[var(--panel)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div>
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]"
          >
            HarborCare
          </Link>
          {subtitle ? (
            <p className="text-sm text-[var(--muted)]">{subtitle}</p>
          ) : null}
        </div>
        <nav className="flex flex-wrap items-center gap-1 sm:gap-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm text-[var(--ink-soft)] hover:bg-white"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={portalHref}
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-strong)]"
          >
            {session ? "Open portal" : "Sign in"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
