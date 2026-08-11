"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

type AppointmentOption = {
  id: number;
  patient_id: number;
  patient_name: string;
  reason: string;
  scheduled_at: string;
  status: string;
};

export function RecordComposer({
  appointments,
}: {
  appointments: AppointmentOption[];
}) {
  const router = useRouter();
  const openAppointments = appointments.filter(
    (item) => item.status !== "cancelled",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    appointmentId: openAppointments[0]?.id?.toString() || "",
    title: "",
    recordType: "Visit note",
    summary: "",
    diagnosis: "",
    treatment: "",
    recordedAt: new Date().toISOString().slice(0, 16),
  });

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    const appointment = openAppointments.find(
      (item) => item.id === Number(form.appointmentId),
    );
    if (!appointment) {
      setError("Select an appointment first.");
      setPending(false);
      return;
    }

    try {
      await apiClient("/api/doctor/records", {
        method: "POST",
        body: JSON.stringify({
          patientId: appointment.patient_id,
          appointmentId: appointment.id,
          title: form.title,
          recordType: form.recordType,
          summary: form.summary,
          diagnosis: form.diagnosis,
          treatment: form.treatment,
          recordedAt: new Date(form.recordedAt).toISOString(),
        }),
      });

      setForm((current) => ({
        ...current,
        title: "",
        summary: "",
        diagnosis: "",
        treatment: "",
      }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save document.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 md:grid-cols-2"
    >
      <h2 className="md:col-span-2 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
        Add document from appointment
      </h2>
      <p className="md:col-span-2 text-sm text-[var(--muted)]">
        Doctors can create clinical documents only for patients with appointments
        assigned to them.
      </p>

      <label className="md:col-span-2 space-y-1 text-sm">
        <span className="text-[var(--ink-soft)]">Appointment</span>
        <select
          value={form.appointmentId}
          onChange={(e) =>
            setForm((current) => ({
              ...current,
              appointmentId: e.target.value,
            }))
          }
          className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
          required
        >
          {openAppointments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.patient_name} · {item.reason} ·{" "}
              {new Date(item.scheduled_at).toLocaleString()}
            </option>
          ))}
        </select>
      </label>

      {(
        [
          ["title", "Title"],
          ["recordType", "Type"],
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

      <label className="md:col-span-2 space-y-1 text-sm">
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
        disabled={pending || openAppointments.length === 0}
        className="md:col-span-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save document"}
      </button>
    </form>
  );
}
