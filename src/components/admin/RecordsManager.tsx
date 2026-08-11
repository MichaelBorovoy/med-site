"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { PatientRow } from "@/lib/types";

type RecordItem = {
  id: number;
  patient_id: number;
  patient_name: string;
  title: string;
  record_type: string;
  summary: string;
  diagnosis: string | null;
  treatment: string | null;
  provider_name: string | null;
  recorded_at: string;
};

export function RecordsManager({
  patients,
  records,
}: {
  patients: PatientRow[];
  records: RecordItem[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    patientId: patients[0]?.id?.toString() || "",
    title: "",
    recordType: "Visit",
    summary: "",
    diagnosis: "",
    treatment: "",
    providerName: "",
    recordedAt: new Date().toISOString().slice(0, 16),
  });

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      await apiClient("/api/admin/records", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          patientId: Number(form.patientId),
          recordedAt: new Date(form.recordedAt).toISOString(),
        }),
      });

      setForm((current) => ({
        ...current,
        title: "",
        summary: "",
        diagnosis: "",
        treatment: "",
        providerName: "",
      }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create record.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this medical record?")) {
      return;
    }
    await apiClient(`/api/admin/records?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 md:grid-cols-2"
      >
        <h2 className="md:col-span-2 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Add medical record
        </h2>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-[var(--ink-soft)]">Patient</span>
          <select
            value={form.patientId}
            onChange={(e) =>
              setForm((current) => ({ ...current, patientId: e.target.value }))
            }
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
            required
          >
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.full_name}
              </option>
            ))}
          </select>
        </label>
        {(
          [
            ["title", "Title"],
            ["recordType", "Type"],
            ["providerName", "Provider"],
            ["recordedAt", "Recorded at"],
            ["diagnosis", "Diagnosis"],
            ["treatment", "Treatment"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="space-y-1 text-sm">
            <span className="text-[var(--ink-soft)]">{label}</span>
            <input
              type={key === "recordedAt" ? "datetime-local" : "text"}
              value={form[key]}
              onChange={(e) =>
                setForm((current) => ({ ...current, [key]: e.target.value }))
              }
              className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
              required={key === "title" || key === "recordType" || key === "recordedAt"}
            />
          </label>
        ))}
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-[var(--ink-soft)]">Summary</span>
          <textarea
            value={form.summary}
            onChange={(e) =>
              setForm((current) => ({ ...current, summary: e.target.value }))
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
          disabled={pending || patients.length === 0}
          className="md:col-span-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Create record"}
        </button>
      </form>

      <div className="space-y-3">
        {records.map((record) => (
          <article
            key={record.id}
            className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  {record.record_type}
                </p>
                <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                  {record.title}
                </h3>
                <p className="text-sm text-[var(--ink-soft)]">
                  {record.patient_name} ·{" "}
                  {new Date(record.recorded_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(record.id)}
                className="text-sm text-[var(--danger)] hover:underline"
              >
                Delete
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
              {record.summary}
            </p>
          </article>
        ))}
        {records.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-[var(--muted)]">
            No medical records yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
