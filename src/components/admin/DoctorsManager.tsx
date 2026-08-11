"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import {
  DOCTOR_CATEGORIES,
  type ClinicSummary,
  type DoctorListItem,
} from "@/lib/types";

export function DoctorsManager({
  clinics,
  doctors,
  total,
  page,
  totalPages,
  query,
  clinicId,
}: {
  clinics: ClinicSummary[];
  doctors: DoctorListItem[];
  total: number;
  page: number;
  totalPages: number;
  query: string;
  clinicId: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    clinicId: clinics[0]?.id?.toString() || "",
    category: DOCTOR_CATEGORIES[0] as string,
    specialty: "",
    yearsExperience: "5",
    experienceSummary: "",
    education: "",
    languages: "",
    acceptingPatients: true,
  });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [search, setSearch] = useState(query);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      await apiClient("/api/admin/doctors", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          clinicId: Number(form.clinicId),
          yearsExperience: Number(form.yearsExperience),
        }),
      });
      setForm((current) => ({
        ...current,
        fullName: "",
        specialty: "",
        experienceSummary: "",
        education: "",
        languages: "",
      }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create doctor.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Remove this doctor from the directory?")) {
      return;
    }

    await apiClient(`/api/admin/doctors?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  function applySearch(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) {
      params.set("q", search.trim());
    }
    if (clinicId) {
      params.set("clinic", clinicId);
    }
    router.push(
      params.toString() ? `/admin/doctors?${params.toString()}` : "/admin/doctors",
    );
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 md:grid-cols-2"
      >
        <h2 className="md:col-span-2 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Add doctor
        </h2>

        <label className="space-y-1 text-sm">
          <span className="text-[var(--ink-soft)]">Full name</span>
          <input
            value={form.fullName}
            onChange={(e) =>
              setForm((current) => ({ ...current, fullName: e.target.value }))
            }
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-[var(--ink-soft)]">Clinic</span>
          <select
            value={form.clinicId}
            onChange={(e) =>
              setForm((current) => ({ ...current, clinicId: e.target.value }))
            }
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
            required
          >
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name} · {clinic.city}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-[var(--ink-soft)]">Category</span>
          <select
            value={form.category}
            onChange={(e) =>
              setForm((current) => ({ ...current, category: e.target.value }))
            }
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
          >
            {DOCTOR_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-[var(--ink-soft)]">Specialty</span>
          <input
            value={form.specialty}
            onChange={(e) =>
              setForm((current) => ({ ...current, specialty: e.target.value }))
            }
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-[var(--ink-soft)]">Years of experience</span>
          <input
            type="number"
            min={0}
            max={80}
            value={form.yearsExperience}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                yearsExperience: e.target.value,
              }))
            }
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-[var(--ink-soft)]">Languages</span>
          <input
            value={form.languages}
            onChange={(e) =>
              setForm((current) => ({ ...current, languages: e.target.value }))
            }
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
          />
        </label>

        <label className="md:col-span-2 space-y-1 text-sm">
          <span className="text-[var(--ink-soft)]">Experience description</span>
          <textarea
            value={form.experienceSummary}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                experienceSummary: e.target.value,
              }))
            }
            className="min-h-28 w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
            required
          />
        </label>

        {error ? (
          <p className="md:col-span-2 text-sm text-[var(--danger)]">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending || clinics.length === 0}
          className="md:col-span-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Add doctor"}
        </button>
      </form>

      <form
        onSubmit={applySearch}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4"
      >
        <label className="min-w-[220px] flex-1 space-y-1 text-sm">
          <span className="text-[var(--ink-soft)]">Search directory</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
            placeholder="Name or specialty"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/doctors"
            className="rounded-md border border-[var(--line)] px-3 py-2 text-sm"
          >
            All clinics
          </Link>
          {clinics.map((clinic) => (
            <Link
              key={clinic.id}
              href={`/admin/doctors?clinic=${clinic.id}`}
              className={`rounded-md border px-3 py-2 text-sm ${
                clinicId === String(clinic.id)
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--line)]"
              }`}
            >
              {clinic.name}
            </Link>
          ))}
        </div>
        <button
          type="submit"
          className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
        >
          Search
        </button>
      </form>

      <p className="text-sm text-[var(--muted)]">
        Showing page {page} of {totalPages} · {total} doctors
      </p>

      <div className="space-y-3">
        {doctors.map((doctor) => (
          <article
            key={doctor.id}
            className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  {doctor.clinic_name || "Unassigned"} · {doctor.category}
                </p>
                <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                  {doctor.full_name}
                </h3>
                <p className="text-sm text-[var(--ink-soft)]">
                  {doctor.specialty} · {doctor.years_experience} years
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(doctor.id)}
                className="text-sm text-[var(--danger)] hover:underline"
              >
                Delete
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
              {doctor.experience_summary}
            </p>
          </article>
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="flex gap-3">
          {page > 1 ? (
            <Link
              href={`/admin/doctors?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}${clinicId ? `&clinic=${clinicId}` : ""}`}
              className="rounded-md border border-[var(--line)] px-3 py-1.5 text-sm"
            >
              Previous
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link
              href={`/admin/doctors?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}${clinicId ? `&clinic=${clinicId}` : ""}`}
              className="rounded-md border border-[var(--line)] px-3 py-1.5 text-sm"
            >
              Next
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
