"use client";

import { useMemo, useState } from "react";
import type { DoctorRow } from "@/lib/types";

type CategoryCount = { category: string; count: number };

export function DoctorsDirectory({
  doctors,
  categories,
}: {
  doctors: DoctorRow[];
  categories: CategoryCount[];
}) {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = useMemo(() => {
    if (activeCategory === "All") {
      return doctors;
    }
    return doctors.filter((doctor) => doctor.category === activeCategory);
  }, [activeCategory, doctors]);

  const grouped = useMemo(() => {
    const map = new Map<string, DoctorRow[]>();
    for (const doctor of filtered) {
      const list = map.get(doctor.category) || [];
      list.push(doctor);
      map.set(doctor.category, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const total = doctors.length;

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <aside className="h-fit rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Categories
        </p>
        <nav className="mt-3 flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          <CategoryButton
            label="All"
            count={total}
            active={activeCategory === "All"}
            onClick={() => setActiveCategory("All")}
          />
          {categories.map((item) => (
            <CategoryButton
              key={item.category}
              label={item.category}
              count={item.count}
              active={activeCategory === item.category}
              onClick={() => setActiveCategory(item.category)}
            />
          ))}
        </nav>
      </aside>

      <div className="space-y-8">
        {grouped.map(([category, items]) => (
          <section key={category} className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
                {category}
              </h2>
              <p className="text-sm text-[var(--muted)]">
                {items.length} doctor{items.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="space-y-4">
              {items.map((doctor) => (
                <article
                  key={doctor.id}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 transition hover:border-[var(--accent)]/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                        {doctor.specialty}
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
                      <dd className="text-[var(--ink)]">
                        {doctor.education || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[var(--muted)]">Languages</dt>
                      <dd className="text-[var(--ink)]">
                        {doctor.languages || "—"}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        ))}

        {grouped.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-10 text-center text-[var(--muted)]">
            No doctors found in this category.
          </p>
        ) : null}
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
