"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { PatientRow } from "@/lib/types";

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  bloodType: "",
  allergies: "",
  emergencyContact: "",
  notes: "",
  username: "",
  password: "",
};

export function PatientsManager({ patients }: { patients: PatientRow[] }) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      await apiClient("/api/admin/patients", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(emptyForm);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create patient.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this patient and related records?")) {
      return;
    }

    await apiClient(`/api/admin/patients/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 md:grid-cols-2"
      >
        <h2 className="md:col-span-2 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Add patient
        </h2>
        {(
          [
            ["fullName", "Full name"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["dateOfBirth", "Date of birth (YYYY-MM-DD)"],
            ["bloodType", "Blood type"],
            ["allergies", "Allergies"],
            ["emergencyContact", "Emergency contact"],
            ["notes", "Notes"],
            ["username", "Portal username (optional)"],
            ["password", "Portal password (optional)"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="space-y-1 text-sm">
            <span className="text-[var(--ink-soft)]">{label}</span>
            <input
              type={key === "password" ? "password" : "text"}
              value={form[key]}
              onChange={(e) =>
                setForm((current) => ({ ...current, [key]: e.target.value }))
              }
              className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 outline-none ring-[var(--accent)] focus:ring-2"
              required={key === "fullName" || key === "email" || key === "dateOfBirth"}
              autoComplete={
                key === "username"
                  ? "off"
                  : key === "password"
                    ? "new-password"
                    : undefined
              }
            />
          </label>
        ))}
        {error ? (
          <p className="md:col-span-2 text-sm text-[var(--danger)]">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="md:col-span-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Create patient"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">DOB</th>
              <th className="px-4 py-3 font-medium">Blood</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id} className="border-b border-[var(--line)]/70">
                <td className="px-4 py-3 text-[var(--ink)]">{patient.full_name}</td>
                <td className="px-4 py-3 text-[var(--ink-soft)]">{patient.email}</td>
                <td className="px-4 py-3 text-[var(--ink-soft)]">
                  {patient.date_of_birth}
                </td>
                <td className="px-4 py-3 text-[var(--ink-soft)]">
                  {patient.blood_type || "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(patient.id)}
                    className="text-[var(--danger)] hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {patients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--muted)]">
                  No patients yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
