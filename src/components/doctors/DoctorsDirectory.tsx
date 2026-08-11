"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import type { DoctorRow } from "@/lib/types";

type CategoryCount = { category: string; count: number };

export function DoctorsDirectory({
  doctors,
  categories,
  total,
  page,
  pageSize,
  totalPages,
  initialQuery = "",
  initialCategory = "All",
}: {
  doctors: DoctorRow[];
  categories: CategoryCount[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  initialQuery?: string;
  initialCategory?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  function updateParams(next: {
    category?: string;
    q?: string;
    page?: number;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const category = next.category ?? initialCategory;
    const q = next.q ?? deferredQuery;
    const nextPage = next.page ?? 1;

    if (!category || category === "All") {
      params.delete("category");
    } else {
      params.set("category", category);
    }

    if (!q.trim()) {
      params.delete("q");
    } else {
      params.set("q", q.trim());
    }

    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }

    const queryString = params.toString();
    startTransition(() => {
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    });
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (deferredQuery === initialQuery) {
        return;
      }
      updateParams({ q: deferredQuery, page: 1 });
    }, 250);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredQuery]);

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <aside className="h-fit rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Categories
        </p>
        <nav className="mt-3 flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          <CategoryButton
            label="All"
            count={categories.reduce((sum, item) => sum + item.count, 0)}
            active={initialCategory === "All"}
            onClick={() => updateParams({ category: "All", page: 1 })}
          />
          {categories.map((item) => (
            <CategoryButton
              key={item.category}
              label={item.category}
              count={item.count}
              active={initialCategory === item.category}
              onClick={() => updateParams({ category: item.category, page: 1 })}
            />
          ))}
        </nav>
      </aside>

      <div className={`space-y-6 ${isPending ? "opacity-70" : ""}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="block w-full max-w-md space-y-1 text-sm">
            <span className="text-[var(--ink-soft)]">Search doctors</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, specialty, language…"
              className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 outline-none ring-[var(--accent)] focus:ring-2"
            />
          </label>
          <p className="text-sm text-[var(--muted)]">
            Showing {from}-{to} of {total}
          </p>
        </div>

        <div className="space-y-4">
          {doctors.map((doctor) => (
            <article
              key={doctor.id}
              className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 transition hover:border-[var(--accent)]/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                    {doctor.category} · {doctor.specialty}
                  </p>
                  <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                    {doctor.full_name}
                  </h3>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium text-[var(--ink)]">
                    {doctor.years_experience} years experience
                  </p>
                  <p
                    className={
                      doctor.accepting_patients
                        ? "text-[var(--accent)]"
                        : "text-[var(--muted)]"
                    }
                  >
                    {doctor.accepting_patients
                      ? "Accepting patients"
                      : "Waitlist only"}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                {doctor.experience_summary}
              </p>

              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[var(--muted)]">Education</dt>
                  <dd className="text-[var(--ink)]">{doctor.education || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Languages</dt>
                  <dd className="text-[var(--ink)]">{doctor.languages || "—"}</dd>
                </div>
              </dl>
            </article>
          ))}

          {doctors.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-10 text-center text-[var(--muted)]">
              No doctors match this search.
            </p>
          ) : null}
        </div>

        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => updateParams({ page: page - 1 })}
              className="rounded-md border border-[var(--line)] bg-white/70 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <p className="text-sm text-[var(--muted)]">
              Page {page} of {totalPages}
            </p>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: page + 1 })}
              className="rounded-md border border-[var(--line)] bg-white/70 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}

        <p className="text-xs text-[var(--muted)]">
          Tip: use category filters and search to browse large doctor lists
          without loading everyone at once.{" "}
          <Link href={pathname} className="text-[var(--accent)] hover:underline">
            Reset filters
          </Link>
        </p>
      </div>
    </div>
  );
}

function CategoryButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-max items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition lg:w-full ${
        active
          ? "bg-[var(--accent)] text-white"
          : "bg-white/60 text-[var(--ink-soft)] hover:bg-white"
      }`}
    >
      <span>{label}</span>
      <span className={active ? "text-white/80" : "text-[var(--muted)]"}>
        {count}
      </span>
    </button>
  );
}
