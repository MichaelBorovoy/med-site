"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { DoctorRow, PatientRow } from "@/lib/types";

type AppointmentItem = {
  id: number;
  patient_id: number;
  patient_name: string;
  provider_name: string;
  reason: string;
  status: "scheduled" | "completed" | "cancelled";
  scheduled_at: string;
};

export function AssistAppointments({
  patients,
  doctors,
  appointments,
}: {
  patients: PatientRow[];
  doctors: DoctorRow[];
  appointments: AppointmentItem[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    patientId: patients[0]?.id?.toString() || "",
    doctorId: doctors[0]?.id?.toString() || "",
    reason: "",
    status: "scheduled",
    scheduledAt: new Date().toISOString().slice(0, 16),
    notes: "",
  });

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    const doctor = doctors.find((item) => item.id === Number(form.doctorId));

    try {
      await apiClient("/api/coordinator/appointments", {
        method: "POST",
        body: JSON.stringify({
          patientId: Number(form.patientId),
          doctorId: Number(form.doctorId) || null,
          providerName: doctor?.full_name || "Care team",
          reason: form.reason,
          status: form.status,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          notes: form.notes,
        }),
      });
      setForm((current) => ({ ...current, reason: "", notes: "" }));
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create appointment.",
      );
    } finally {
      setPending(false);
    }
  }

  async function onStatus(
    id: number,
    status: "scheduled" | "completed" | "cancelled",
  ) {
    await apiClient("/api/coordinator/appointments", {
      method: "PATCH",
      body: JSON.stringify({ id, status }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 md:grid-cols-2"
      >
        <h2 className="md:col-span-2 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Schedule for a patient
        </h2>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--ink-soft)]">Patient</span>
          <select
            value={form.patientId}
            onChange={(e) =>
              setForm((current) => ({ ...current, patientId: e.target.value }))
            }
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
          >
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--ink-soft)]">Doctor</span>
          <select
            value={form.doctorId}
            onChange={(e) =>
              setForm((current) => ({ ...current, doctorId: e.target.value }))
            }
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
          >
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.full_name} · {doctor.category}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--ink-soft)]">Reason</span>
          <input
            value={form.reason}
            onChange={(e) =>
              setForm((current) => ({ ...current, reason: e.target.value }))
            }
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
            required
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--ink-soft)]">When</span>
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                scheduledAt: e.target.value,
              }))
            }
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
            required
          />
        </label>
        {error ? (
          <p className="md:col-span-2 text-sm text-[var(--danger)]">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending || patients.length === 0 || doctors.length === 0}
          className="md:col-span-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
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
                <h3 className="font-[family-name:var(--font-display)] text-xl">
                  {appointment.reason}
                </h3>
                <p className="text-sm text-[var(--ink-soft)]">
                  {appointment.patient_name} with {appointment.provider_name}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  {new Date(appointment.scheduled_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
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
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
