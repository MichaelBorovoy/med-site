import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getDb, getDoctor } from "@/lib/db";
import { appointmentSchema } from "@/lib/validators";

export async function GET() {
  const session = await requireSession(["coordinator", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appointments = getDb()
    .prepare(
      `SELECT a.*, p.full_name AS patient_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       ORDER BY a.scheduled_at DESC`,
    )
    .all();

  return NextResponse.json({ appointments });
}

export async function POST(request: Request) {
  const session = await requireSession(["coordinator", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid appointment payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const data = parsed.data;
  let providerName = data.providerName;
  if (data.doctorId) {
    const doctor = getDoctor(data.doctorId);
    if (doctor) {
      providerName = doctor.full_name;
    }
  }

  const result = getDb()
    .prepare(
      `INSERT INTO appointments (
        patient_id, doctor_id, provider_name, reason, status, scheduled_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      data.patientId,
      data.doctorId || null,
      providerName,
      data.reason,
      data.status,
      data.scheduledAt,
      data.notes || null,
    );

  const appointment = getDb()
    .prepare("SELECT * FROM appointments WHERE id = ?")
    .get(Number(result.lastInsertRowid));

  return NextResponse.json({ appointment }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await requireSession(["coordinator", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const id = Number(body.id);
  const status = body.status;

  if (!id || !["scheduled", "completed", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }

  getDb()
    .prepare("UPDATE appointments SET status = ? WHERE id = ?")
    .run(status, id);

  return NextResponse.json({ ok: true });
}
