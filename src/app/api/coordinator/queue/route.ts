import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  createAssistanceQueueItem,
  listAssistanceQueue,
  updateAssistanceQueueItem,
} from "@/lib/db";
import {
  assistanceQueueSchema,
  assistanceQueueUpdateSchema,
} from "@/lib/validators";

export async function GET(request: Request) {
  const session = await requireSession(["coordinator", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = new URL(request.url).searchParams.get("status") || "open";
  const allowed = ["open", "waiting", "in_progress", "done", "cancelled", "all"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }

  const items = await listAssistanceQueue(
    status === "all" ? undefined : (status as "open"),
  );
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await requireSession(["coordinator", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = assistanceQueueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid queue payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const item = await createAssistanceQueueItem({
    patientId: parsed.data.patientId,
    channel: parsed.data.channel,
    subject: parsed.data.subject,
    priority: parsed.data.priority,
    notes: parsed.data.notes || null,
  });

  return NextResponse.json({ item }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await requireSession(["coordinator", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = assistanceQueueUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid queue update.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const item = await updateAssistanceQueueItem({
    id: data.id,
    status: data.status,
    claimUserId: data.claim ? session.id : undefined,
    notes: data.notes,
  });

  if (!item) {
    return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}
