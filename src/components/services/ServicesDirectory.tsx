"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import type { ServiceListItem } from "@/lib/types";

type SpecialtyCount = { specialty: string; count: number };
type DoctorOption = {
  id: number;
  full_name: string;
  category: string;
};

export function ServicesDirectory({
  services,
  specialties,
  doctors,
  total,
  page,
  pageSize,
  totalPages,
  initialQuery = "",
  initialSpecialty = "All",
  initialDoctorId = "",
}: {
  services: ServiceListItem[];
  specialties: SpecialtyCount[];
  doctors: DoctorOption[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  initialQuery?: string;
  initialSpecialty?: string;
  initialDoctorId?: string;
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
    specialty?: string;
    doctorId?: string;
    q?: string;
    page?: number;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const specialty = next.specialty ?? initialSpecialty;
    const doctorId = next.doctorId ?? initialDoctorId;
    const q = next.q ?? deferredQuery;
    const nextPage = next.page ?? 1;

    if (!specialty || specialty === "All") {
      params.delete("specialty");
    } else {
      params.set("specialty", specialty);
    }

    if (!doctorId) {
      params.delete("doctor");
    } else {
      params.set("doctor", doctorId);
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
  const allCount = specialties.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="h-fit space-y-4">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Specialties
          </p>
          <nav className="mt-3 flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            <FilterButton
              label="All specialties"
              count={allCount}
              active={initialSpecialty === "All"}
              onClick={() =>
                updateParams({ specialty: "All", doctorId: "", page: 1 })
              }
            />
            {specialties.map((item) => (
              <FilterButton
                key={item.specialty}
                label={item.specialty}
                count={item.count}
                active={initialSpecialty === item.specialty}
                onClick={() =>
                  updateParams({
                    specialty: item.specialty,
                    doctorId: "",
                    page: 1,
                  })
                }
              />
            ))}
          </nav>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Doctors
          </p>
          <label className="mt-3 block text-sm">
            <select
              value={initialDoctorId}
              onChange={(e) =>
                updateParams({ doctorId: e.target.value, page: 1 })
              }
              className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
            >
              <option value="">All doctors</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.full_name}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Choose a specialty first to narrow the doctor list.
          </p>
        </div>
      </aside>

      <div className={`space-y-6 ${isPending ? "opacity-70" : ""}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="block w-full max-w-md space-y-1 text-sm">
            <span className="text-[var(--ink-soft)]">Search services</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Service name or description…"
              className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 outline-none ring-[var(--accent)] focus:ring-2"
            />
          </label>
          <p className="text-sm text-[var(--muted)]">
            Showing {from}-{to} of {total}
          </p>
        </div>

        <div className="space-y-4">
          {services.map((service) => (
            <article
              key={service.id}
              className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"
            >
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                {service.specialty}
                {service.clinic_name ? ` · ${service.clinic_name}` : ""}
              </p>
              <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                {service.name}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                {service.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <p className="text-[var(--muted)]">
                  Duration:{" "}
                  <span className="text-[var(--ink)]">
                    {service.duration_minutes
                      ? `${service.duration_minutes} min`
                      : "Varies"}
                  </span>
                </p>
                <p className="text-[var(--muted)]">
                  Doctors:{" "}
                  <span className="text-[var(--ink)]">
                    {service.doctor_names || "Unassigned"}
                  </span>
                </p>
              </div>
            </article>
          ))}

          {services.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-10 text-center text-[var(--muted)]">
              No services match this specialty/doctor filter.
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
          Filter by specialty and doctor to browse large service catalogs.{" "}
          <Link href={pathname} className="text-[var(--accent)] hover:underline">
            Reset filters
          </Link>
        </p>
      </div>
    </div>
  );
}

function FilterButton({
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
      <span className="truncate">{label}</span>
      <span className={active ? "text-white/80" : "text-[var(--muted)]"}>
        {count}
      </span>
    </button>
  );
}
