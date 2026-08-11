import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getDb, getPatient } from "@/lib/db";
import { patientProfileSchema } from "@/lib/validators";

export async function GET() {
  const session = await requireSession("patient");
  if (!session?.patientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patient = getPatient(session.patientId);
  if (!patient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ patient });
}

export async function PATCH(request: Request) {
  const session = await requireSession("patient");
  if (!session?.patientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = patientProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid profile payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  getDb()
    .prepare(
      `UPDATE patients SET
        phone = ?,
        allergies = ?,
        emergency_contact = ?,
        updated_at = datetime('now')
      WHERE id = ?`,
    )
    .run(
      data.phone || null,
      data.allergies || null,
      data.emergencyContact || null,
      session.patientId,
    );

  return NextResponse.json({ patient: getPatient(session.patientId) });
}
