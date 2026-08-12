"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  const portalLabel = session ? "Open portal" : "Sign in";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--panel)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]"
          onClick={() => setOpen(false)}
        >
          HarborCare
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex h-9 items-center justify-center rounded-md px-2.5 text-sm text-[var(--ink-soft)] hover:bg-white"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={portalHref}
            className="ml-1 inline-flex h-9 items-center justify-center rounded-md bg-[var(--accent)] px-3 text-sm font-medium text-white hover:bg-[var(--accent-strong)]"
          >
            {portalLabel}
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--line)] bg-white/70 text-[var(--ink)] md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span className="flex w-4 flex-col gap-1.5">
            <span
              className={`h-0.5 w-full rounded bg-current transition ${open ? "translate-y-[7px] rotate-45" : ""}`}
            />
            <span
              className={`h-0.5 w-full rounded bg-current transition ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`h-0.5 w-full rounded bg-current transition ${open ? "-translate-y-[7px] -rotate-45" : ""}`}
            />
          </span>
        </button>
      </div>

      {open ? (
        <div className="border-t border-[var(--line)] bg-[var(--panel)] md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2.5 text-sm text-[var(--ink-soft)] hover:bg-white"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={portalHref}
              className="mt-1 rounded-md bg-[var(--accent)] px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-[var(--accent-strong)]"
              onClick={() => setOpen(false)}
            >
              {portalLabel}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
