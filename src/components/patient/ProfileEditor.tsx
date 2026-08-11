"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

export function ProfileEditor({
  phone,
  allergies,
  emergencyContact,
}: {
  phone: string;
  allergies: string;
  emergencyContact: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ phone, allergies, emergencyContact });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");

    try {
      await apiClient("/api/patient/profile", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setMessage("Profile updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update profile.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"
    >
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
        Edit your profile
      </h2>
      <p className="text-sm text-[var(--muted)]">
        Patients can update contact details only. Medical records are read-only.
      </p>

      {(
        [
          ["phone", "Phone"],
          ["allergies", "Allergies"],
          ["emergencyContact", "Emergency contact"],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="block space-y-1 text-sm">
          <span className="text-[var(--ink-soft)]">{label}</span>
          <input
            value={form[key]}
            onChange={(e) =>
              setForm((current) => ({ ...current, [key]: e.target.value }))
            }
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2"
          />
        </label>
      ))}

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--accent)]">{message}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
