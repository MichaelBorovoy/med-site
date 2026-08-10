import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { recordSchema } from "@/lib/validators";

export async function GET() {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const records = db
    .prepare(
      `SELECT r.*, p.full_name AS patient_name
       FROM medical_records r
       JOIN patients p ON p.id = r.patient_id
       ORDER BY r.recorded_at DESC`,
    )
    .all();

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
  const db = getDb();

  try {
    const result = db
      .prepare(
        `INSERT INTO medical_records (
          patient_id, title, record_type, summary, diagnosis,
          treatment, provider_name, recorded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        data.patientId,
        data.title,
        data.recordType,
        data.summary,
        data.diagnosis || null,
        data.treatment || null,
        data.providerName || null,
        data.recordedAt,
      );

    const record = db
      .prepare("SELECT * FROM medical_records WHERE id = ?")
      .get(Number(result.lastInsertRowid));

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

  getDb().prepare("DELETE FROM medical_records WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
