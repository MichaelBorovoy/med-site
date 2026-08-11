"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { ClinicRow } from "@/lib/types";

const emptyForm = {
  name: "",
  city: "",
  address: "",
  phone: "",
  description: "",
};

export function ClinicsManager({
  clinics,
}: {
  clinics: Array<ClinicRow & { doctor_count: number }>;
}) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      await apiClient("/api/admin/clinics", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(emptyForm);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create clinic.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this clinic? Doctors will become unassigned.")) {
      return;
    }
    await apiClient(`/api/admin/clinics?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 md:grid-cols-2"
      >
        <h2 className="md:col-span-2 font-[family-name:var(--font-display)] text-2xl">
          Add clinic
        </h2>
        {(
          [
            ["name", "Clinic name"],
            ["city", "City"],
            ["address", "Address"],
            ["phone", "Phone"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="space-y-1 text-sm">
            <span className="text-[var(--ink-soft)]">{label}</span>
            <input
              value={form[key]}
              onChange={(e) =>
                setForm((current) => ({ ...current, [key]: e.target.value }))
              }
              className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
              required={key !== "phone"}
            />
          </label>
        ))}
        <label className="md:col-span-2 space-y-1 text-sm">
          <span className="text-[var(--ink-soft)]">Description</span>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                description: e.target.value,
              }))
            }
            className="min-h-24 w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
          />
        </label>
        {error ? (
          <p className="md:col-span-2 text-sm text-[var(--danger)]">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="md:col-span-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Create clinic"}
        </button>
      </form>

      <div className="space-y-3">
        {clinics.map((clinic) => (
          <article
            key={clinic.id}
            className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-xl">
                  {clinic.name}
                </h3>
                <p className="text-sm text-[var(--ink-soft)]">
                  {clinic.city} · {clinic.doctor_count} doctors
                </p>
                <p className="text-sm text-[var(--muted)]">{clinic.address}</p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(clinic.id)}
                className="text-sm text-[var(--danger)] hover:underline"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
