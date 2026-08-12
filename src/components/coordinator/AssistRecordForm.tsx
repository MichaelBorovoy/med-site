"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  patientId: number;
};

function nowLocalInputValue() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AssistRecordForm({ patientId }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [recordType, setRecordType] = useState("assistance_consult");
  const [summary, setSummary] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [recordedAt, setRecordedAt] = useState(nowLocalInputValue);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setPending(true);
    try {
      const res = await fetch("/api/coordinator/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          title,
          recordType,
          summary,
          diagnosis,
          treatment,
          recordedAt: new Date(recordedAt).toISOString(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not create medical record.");
        return;
      }
      setTitle("");
      setSummary("");
      setDiagnosis("");
      setTreatment("");
      setRecordedAt(nowLocalInputValue());
      setOk("Medical record created.");
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
          <label className="mb-1 block text-sm font-medium text-[var(--ink)]" htmlFor="assist-record-title">
            Title
          </label>
          <input
            id="assist-record-title"
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={160}
            placeholder="e.g. Phone triage — headache"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--ink)]" htmlFor="assist-record-type">
            Record type
          </label>
          <select
            id="assist-record-type"
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
            value={recordType}
            onChange={(e) => setRecordType(e.target.value)}
          >
            <option value="assistance_consult">Assistance consult</option>
            <option value="phone_triage">Phone triage</option>
            <option value="chat_follow_up">Chat follow-up</option>
            <option value="note">Clinical note</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--ink)]" htmlFor="assist-record-summary">
          Summary
        </label>
        <textarea
          id="assist-record-summary"
          className="min-h-28 w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
          maxLength={4000}
          placeholder="Consultation notes, advice given, follow-up plan…"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--ink)]" htmlFor="assist-record-diagnosis">
            Diagnosis (optional)
          </label>
          <input
            id="assist-record-diagnosis"
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            maxLength={500}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--ink)]" htmlFor="assist-record-treatment">
            Treatment / advice (optional)
          </label>
          <input
            id="assist-record-treatment"
            className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            maxLength={1000}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--ink)]" htmlFor="assist-record-at">
          Recorded at
        </label>
        <input
          id="assist-record-at"
          type="datetime-local"
          className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2 text-sm sm:max-w-xs"
          value={recordedAt}
          onChange={(e) => setRecordedAt(e.target.value)}
          required
        />
      </div>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-700">{ok}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Create medical record"}
      </button>
    </form>
  );
}
