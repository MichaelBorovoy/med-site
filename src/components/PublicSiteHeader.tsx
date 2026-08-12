import Link from "next/link";
import { homeForRole } from "@/lib/permissions";
import type { SessionUser } from "@/lib/types";

const links = [
  { href: "/", label: "Home" },
  { href: "/clinics", label: "Clinics" },
  { href: "/doctors", label: "Doctors" },
  { href: "/services", label: "Services" },
] as const;

export function PublicSiteHeader({ session }: { session: SessionUser | null }) {
  const portalHref = session ? homeForRole(session.role) : "/login";

  return (
    <header className="border-b border-[var(--line)] bg-[var(--panel)]/90 backdrop-blur">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4">
        <Link
          href="/"
          className="justify-self-start font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]"
        >
          HarborCare
        </Link>

        <nav className="flex items-center justify-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex h-9 w-24 items-center justify-center rounded-md text-sm text-[var(--ink-soft)] hover:bg-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="justify-self-end">
          <Link
            href={portalHref}
            className="inline-flex h-9 min-w-24 items-center justify-center rounded-md bg-[var(--accent)] px-3 text-sm font-medium text-white hover:bg-[var(--accent-strong)]"
          >
            {session ? "Open portal" : "Sign in"}
          </Link>
        </div>
      </div>
    </header>
  );
}
