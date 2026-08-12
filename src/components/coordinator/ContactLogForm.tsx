"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  patientId: number;
  defaultChannel?: "phone" | "chat";
  queueItemId?: number;
};

export function ContactLogForm({
  patientId,
  defaultChannel = "phone",
  queueItemId,
}: Props) {
  const router = useRouter();
  const [channel, setChannel] = useState<"phone" | "chat">(defaultChannel);
  const [direction, setDirection] = useState<"inbound" | "outbound">("inbound");
  const [summary, setSummary] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setPending(true);
    try {
      const res = await fetch("/api/coordinator/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          channel,
          direction,
          summary,
          referenceCode: referenceCode.trim() || undefined,
          queueItemId,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save contact log.");
        return;
      }
      setSummary("");
      setReferenceCode("");
      setOk("Contact logged.");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--ink)]" htmlFor="contact-channel">
            Channel
          </label>
          <select
            id="contact-channel"
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
            value={channel}
            onChange={(e) => setChannel(e.target.value as "phone" | "chat")}
          >
            <option value="phone">Phone</option>
            <option value="chat">Chat</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--ink)]" htmlFor="contact-direction">
            Direction
          </label>
          <select
            id="contact-direction"
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
            value={direction}
            onChange={(e) =>
              setDirection(e.target.value as "inbound" | "outbound")
            }
          >
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--ink)]" htmlFor="contact-ref">
          Chat / ticket reference
        </label>
        <input
          id="contact-ref"
          className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
          value={referenceCode}
          onChange={(e) => setReferenceCode(e.target.value)}
          maxLength={120}
          placeholder="e.g. CHAT-1042"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--ink)]" htmlFor="contact-summary">
          Summary
        </label>
        <textarea
          id="contact-summary"
          className="min-h-24 w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
          maxLength={4000}
          placeholder="What the patient asked, advice given, next steps…"
        />
      </div>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-700">{ok}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Log phone / chat contact"}
      </button>
    </form>
  );
}
