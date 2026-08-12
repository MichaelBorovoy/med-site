"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { AssistanceQueueItem } from "@/lib/types";

export function AssistanceQueueBoard({
  items,
  patients,
}: {
  items: AssistanceQueueItem[];
  patients: Array<{ id: number; full_name: string; phone: string | null }>;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    patientId: patients[0]?.id?.toString() || "",
    channel: "phone",
    subject: "",
    priority: "normal",
    notes: "",
  });

  async function createItem(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await apiClient("/api/coordinator/queue", {
        method: "POST",
        body: JSON.stringify({
          patientId: Number(form.patientId),
          channel: form.channel,
          subject: form.subject,
          priority: form.priority,
          notes: form.notes,
        }),
      });
      setForm((current) => ({ ...current, subject: "", notes: "" }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add queue item");
    } finally {
      setPending(false);
    }
  }

  async function updateItem(
    id: number,
    payload: { status?: string; claim?: boolean },
  ) {
    setError("");
    try {
      await apiClient("/api/coordinator/queue", {
        method: "PATCH",
        body: JSON.stringify({ id, ...payload }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update queue item");
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={createItem}
        className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"
      >
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Add to incoming queue
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
            value={form.patientId}
            onChange={(event) =>
              setForm({ ...form, patientId: event.target.value })
            }
            required
          >
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.full_name}
                {patient.phone ? ` · ${patient.phone}` : ""}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
            value={form.channel}
            onChange={(event) =>
              setForm({ ...form, channel: event.target.value })
            }
          >
            <option value="phone">Phone</option>
            <option value="chat">Chat</option>
            <option value="walk_in">Walk-in</option>
            <option value="other">Other</option>
          </select>
          <select
            className="rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
            value={form.priority}
            onChange={(event) =>
              setForm({ ...form, priority: event.target.value })
            }
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <input
            className="rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
            placeholder="Subject"
            value={form.subject}
            onChange={(event) =>
              setForm({ ...form, subject: event.target.value })
            }
            required
          />
        </div>
        <textarea
          className="min-h-20 w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
          placeholder="Notes for the assistant"
          value={form.notes}
          onChange={(event) => setForm({ ...form, notes: event.target.value })}
        />
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        <button
          type="submit"
          disabled={pending || !patients.length}
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Add to queue
        </button>
      </form>

      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  {item.channel} · {item.priority} · {item.status}
                </p>
                <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                  {item.subject}
                </h3>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  {item.patient_name}
                  {item.patient_phone ? ` · ${item.patient_phone}` : ""}
                </p>
                {item.notes ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">{item.notes}</p>
                ) : null}
                {item.claimed_by_username ? (
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Claimed by {item.claimed_by_username}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/coordinator/patients/${item.patient_id}?queue=${item.id}`}
                  className="rounded-md border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--ink)]"
                >
                  Open consult
                </Link>
                {item.status === "waiting" ? (
                  <button
                    type="button"
                    onClick={() =>
                      updateItem(item.id, { claim: true, status: "in_progress" })
                    }
                    className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
                  >
                    Claim
                  </button>
                ) : null}
                {item.status === "in_progress" ? (
                  <button
                    type="button"
                    onClick={() => updateItem(item.id, { status: "done" })}
                    className="rounded-md border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--ink)]"
                  >
                    Complete
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-10 text-center text-[var(--muted)]">
            Queue is clear.
          </p>
        ) : null}
      </div>
    </div>
  );
}
