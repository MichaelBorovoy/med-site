"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { DOCTOR_CATEGORIES, type DoctorRow } from "@/lib/types";

const emptyForm = {
  fullName: "",
  category: DOCTOR_CATEGORIES[0] as string,
  specialty: "",
  yearsExperience: "5",
  experienceSummary: "",
  education: "",
  languages: "",
  acceptingPatients: true,
};

export function DoctorsManager({ doctors }: { doctors: DoctorRow[] }) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      await apiClient("/api/admin/doctors", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          yearsExperience: Number(form.yearsExperience),
        }),
      });
      setForm(emptyForm);
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
          <span className="text-[var(--ink-soft)]">Education</span>
          <input
            value={form.education}
            onChange={(e) =>
              setForm((current) => ({ ...current, education: e.target.value }))
            }
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
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

        <label className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
          <input
            type="checkbox"
            checked={form.acceptingPatients}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                acceptingPatients: e.target.checked,
              }))
            }
          />
          Accepting new patients
        </label>

        {error ? (
          <p className="md:col-span-2 text-sm text-[var(--danger)]">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="md:col-span-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Add doctor"}
        </button>
      </form>

      <div className="space-y-3">
        {doctors.map((doctor) => (
          <article
            key={doctor.id}
            className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  {doctor.category} · {doctor.specialty}
                </p>
                <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                  {doctor.full_name}
                </h3>
                <p className="text-sm text-[var(--ink-soft)]">
                  {doctor.years_experience} years experience
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

        {doctors.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-[var(--muted)]">
            No doctors in the directory yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
