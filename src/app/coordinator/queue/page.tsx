import { AssistanceQueueBoard } from "@/components/coordinator/AssistanceQueueBoard";
import { listAssistanceQueue, listPatients } from "@/lib/db";

export default async function CoordinatorQueuePage() {
  const [items, patients] = await Promise.all([
    listAssistanceQueue("open"),
    listPatients(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Incoming queue
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Claim phone and chat requests, open the patient chart, and complete
          each item when the consult is done.
        </p>
      </div>
      <AssistanceQueueBoard
        items={items}
        patients={patients.map((p) => ({
          id: p.id,
          full_name: p.full_name,
          phone: p.phone,
        }))}
      />
    </div>
  );
}
