"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { PatientRow } from "@/lib/types";

type AppointmentItem = {
  id: number;
  patient_id: number;
  patient_name: string;
  provider_name: string;
  reason: string;
  status: "scheduled" | "completed" | "cancelled";
  scheduled_at: string;
  notes: string | null;
};

export function AppointmentsManager({
  patients,
  appointments,
}: {
  patients: PatientRow[];
  appointments: AppointmentItem[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    patientId: patients[0]?.id?.toString() || "",
    providerName: "",
    reason: "",
    status: "scheduled",
    scheduledAt: new Date().toISOString().slice(0, 16),
    notes: "",
  });

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    const response = await fetch("/api/admin/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        patientId: Number(form.patientId),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      }),
    });

    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Unable to create appointment.");
      return;
    }

    setForm((current) => ({
      ...current,
      providerName: "",
      reason: "",
      notes: "",
    }));
    router.refresh();
  }

  async function onStatus(
    id: number,
    status: "scheduled" | "completed" | "cancelled",
  ) {
    await fetch("/api/admin/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    router.refresh();
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this appointment?")) {
      return;
    }
    await fetch(`/api/admin/appointments?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 md:grid-cols-2"
      >
        <h2 className="md:col-span-2 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Schedule appointment
        </h2>
        <label className="space-y-1 text-sm">
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
        <label className="space-y-1 text-sm">
          <span className="text-[var(--ink-soft)]">Status</span>
          <select
            value={form.status}
            onChange={(e) =>
              setForm((current) => ({ ...current, status: e.target.value }))
            }
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
          >
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        {(
          [
            ["providerName", "Provider"],
            ["reason", "Reason"],
            ["scheduledAt", "Scheduled at"],
            ["notes", "Notes"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="space-y-1 text-sm">
            <span className="text-[var(--ink-soft)]">{label}</span>
            <input
              type={key === "scheduledAt" ? "datetime-local" : "text"}
              value={form[key]}
              onChange={(e) =>
                setForm((current) => ({ ...current, [key]: e.target.value }))
              }
              className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
              required={key !== "notes"}
            />
          </label>
        ))}
        {error ? (
          <p className="md:col-span-2 text-sm text-[var(--danger)]">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending || patients.length === 0}
          className="md:col-span-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Create appointment"}
        </button>
      </form>

      <div className="space-y-3">
        {appointments.map((appointment) => (
          <article
            key={appointment.id}
            className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  {appointment.status}
                </p>
                <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                  {appointment.reason}
                </h3>
                <p className="text-sm text-[var(--ink-soft)]">
                  {appointment.patient_name} with {appointment.provider_name}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  {new Date(appointment.scheduled_at).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onStatus(appointment.id, "completed")}
                  className="rounded-md border border-[var(--line)] px-2.5 py-1 text-xs"
                >
                  Complete
                </button>
                <button
                  type="button"
                  onClick={() => onStatus(appointment.id, "cancelled")}
                  className="rounded-md border border-[var(--line)] px-2.5 py-1 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(appointment.id)}
                  className="rounded-md px-2.5 py-1 text-xs text-[var(--danger)]"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
        {appointments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-[var(--muted)]">
            No appointments yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
