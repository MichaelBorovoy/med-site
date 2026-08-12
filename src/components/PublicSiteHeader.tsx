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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]"
        >
          HarborCare
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
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
