import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getDb, getPatient } from "@/lib/db";
import { patientSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const patient = getPatient(Number(id));
  if (!patient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ patient });
}

export async function PUT(request: Request, { params }: Params) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const patientId = Number(id);
  const existing = getPatient(patientId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = patientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid patient payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const db = getDb();

  try {
    db.prepare(
      `UPDATE patients SET
        full_name = ?,
        email = ?,
        phone = ?,
        date_of_birth = ?,
        blood_type = ?,
        allergies = ?,
        emergency_contact = ?,
        notes = ?,
        updated_at = datetime('now')
      WHERE id = ?`,
    ).run(
      data.fullName,
      data.email,
      data.phone || null,
      data.dateOfBirth,
      data.bloodType || null,
      data.allergies || null,
      data.emergencyContact || null,
      data.notes || null,
      patientId,
    );

    return NextResponse.json({ patient: getPatient(patientId) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update patient.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const patientId = Number(id);
  const existing = getPatient(patientId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  getDb().prepare("DELETE FROM patients WHERE id = ?").run(patientId);
  return NextResponse.json({ ok: true });
}
