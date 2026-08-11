"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { apiClient } from "@/lib/api-client";
import {
  DOCTOR_CATEGORIES,
  type DoctorRow,
  type ServiceListItem,
} from "@/lib/types";

type FormState = {
  id?: number;
  name: string;
  specialty: string;
  description: string;
  durationMinutes: string;
  doctorIds: number[];
};

const emptyForm = (): FormState => ({
  name: "",
  specialty: DOCTOR_CATEGORIES[0],
  description: "",
  durationMinutes: "30",
  doctorIds: [],
});

function parseDoctorIds(value: string) {
  return value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isFinite(id) && id > 0);
}

export function ServicesManager({
  initialServices,
  doctors,
}: {
  initialServices: ServiceListItem[];
  doctors: DoctorRow[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const filteredDoctors = useMemo(
    () => doctors.filter((doctor) => doctor.category === form.specialty),
    [doctors, form.specialty],
  );

  function editService(service: ServiceListItem) {
    setForm({
      id: service.id,
      name: service.name,
      specialty: service.specialty,
      description: service.description,
      durationMinutes: String(service.duration_minutes ?? 30),
      doctorIds: parseDoctorIds(service.doctor_ids),
    });
    setError("");
    setMessage("");
  }

  function toggleDoctor(doctorId: number) {
    setForm((current) => ({
      ...current,
      doctorIds: current.doctorIds.includes(doctorId)
        ? current.doctorIds.filter((id) => id !== doctorId)
        : [...current.doctorIds, doctorId],
    }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPending(true);

    const durationMinutes = Number(form.durationMinutes);
    if (!Number.isFinite(durationMinutes) || durationMinutes < 5) {
      setError("Duration must be at least 5 minutes.");
      setPending(false);
      return;
    }

    if (!form.doctorIds.length) {
      setError("Assign at least one doctor.");
      setPending(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      specialty: form.specialty.trim(),
      description: form.description.trim(),
      durationMinutes,
      doctorIds: form.doctorIds,
    };

    try {
      if (form.id) {
        await apiClient("/api/admin/services", {
          method: "PUT",
          body: JSON.stringify({ id: form.id, ...payload }),
        });
        setMessage("Service updated.");
      } else {
        await apiClient("/api/admin/services", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Service created.");
      }
      setForm(emptyForm());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save service");
    } finally {
      setPending(false);
    }
  }

  async function removeService(id: number) {
    if (!confirm("Delete this service?")) {
      return;
    }

    setError("");
    setMessage("");
    try {
      await apiClient(`/api/admin/services?id=${id}`, { method: "DELETE" });
      setMessage("Service deleted.");
      if (form.id === id) {
        setForm(emptyForm());
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete service");
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"
      >
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          {form.id ? "Edit service" : "Add service"}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
            placeholder="Service name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <select
            className="rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
            value={form.specialty}
            onChange={(event) =>
              setForm({
                ...form,
                specialty: event.target.value,
                doctorIds: [],
              })
            }
            required
          >
            {DOCTOR_CATEGORIES.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
          <input
            className="rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
            type="number"
            min={5}
            step={5}
            placeholder="Duration (minutes)"
            value={form.durationMinutes}
            onChange={(event) =>
              setForm({ ...form, durationMinutes: event.target.value })
            }
            required
          />
        </div>
        <textarea
          className="min-h-24 w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
          placeholder="What patients can expect from this service"
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          required
        />
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--ink-soft)]">
            Doctors who offer this service
          </p>
          {filteredDoctors.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No doctors in {form.specialty} yet.
            </p>
          ) : (
            <div className="grid max-h-48 gap-2 overflow-y-auto rounded-lg border border-[var(--line)] p-3 sm:grid-cols-2">
              {filteredDoctors.map((doctor) => (
                <label
                  key={doctor.id}
                  className="flex items-start gap-2 text-sm text-[var(--ink-soft)]"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={form.doctorIds.includes(doctor.id)}
                    onChange={() => toggleDoctor(doctor.id)}
                  />
                  <span>
                    {doctor.full_name}
                    <span className="block text-xs text-[var(--muted)]">
                      {doctor.specialty}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        {message ? <p className="text-sm text-[var(--accent)]">{message}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] disabled:opacity-60"
          >
            {form.id ? "Save changes" : "Create service"}
          </button>
          {form.id ? (
            <button
              type="button"
              onClick={() => setForm(emptyForm())}
              className="rounded-md border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
        <table className="min-w-full text-left text-sm">
          <thead className="text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Specialty</th>
              <th className="px-4 py-3 font-medium">Doctors</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialServices.map((service) => (
              <tr key={service.id} className="border-t border-[var(--line)]/70">
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--ink)]">{service.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {service.duration_minutes
                      ? `${service.duration_minutes} min`
                      : "Duration varies"}
                    {service.clinic_name ? ` · ${service.clinic_name}` : ""}
                  </p>
                </td>
                <td className="px-4 py-3 text-[var(--ink-soft)]">
                  {service.specialty}
                </td>
                <td className="px-4 py-3 text-[var(--ink-soft)]">
                  {service.doctor_names || "Unassigned"}
                </td>
                <td className="space-x-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => editService(service)}
                    className="text-[var(--accent)] hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeService(service.id)}
                    className="text-rose-700 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
