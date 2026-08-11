import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  createRecord,
  deleteRecord,
  listRecordsWithPatientNames,
} from "@/lib/db";
import { recordSchema } from "@/lib/validators";

export async function GET() {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await listRecordsWithPatientNames();

  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = recordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid record payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  try {
    const record = await createRecord({
      patientId: data.patientId,
      title: data.title,
      recordType: data.recordType,
      summary: data.summary,
      diagnosis: data.diagnosis || null,
      treatment: data.treatment || null,
      providerName: data.providerName || null,
      recordedAt: data.recordedAt,
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create record.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await deleteRecord(id);
  return NextResponse.json({ ok: true });
}
