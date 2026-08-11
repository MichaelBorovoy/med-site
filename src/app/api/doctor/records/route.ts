import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  doctorCanAccessPatient,
  getDb,
  getDoctor,
  getPatient,
} from "@/lib/db";
import { recordSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await requireSession("doctor");
  if (!session?.doctorId) {
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
  if (!doctorCanAccessPatient(session.doctorId, data.patientId)) {
    return NextResponse.json(
      {
        error:
          "You can only add documents for patients with an appointment assigned to you.",
      },
      { status: 403 },
    );
  }

  if (data.appointmentId) {
    const appointment = getDb()
      .prepare(
        `SELECT id FROM appointments
         WHERE id = ? AND doctor_id = ? AND patient_id = ?`,
      )
      .get(data.appointmentId, session.doctorId, data.patientId) as
      | { id: number }
      | undefined;

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found for this doctor and patient." },
        { status: 400 },
      );
    }
  }

  const doctor = getDoctor(session.doctorId);
  const patient = getPatient(data.patientId);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const result = getDb()
    .prepare(
      `INSERT INTO medical_records (
        patient_id, appointment_id, title, record_type, summary, diagnosis,
        treatment, provider_name, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      data.patientId,
      data.appointmentId || null,
      data.title,
      data.recordType,
      data.summary,
      data.diagnosis || null,
      data.treatment || null,
      data.providerName || doctor?.full_name || null,
      data.recordedAt,
    );

  const record = getDb()
    .prepare("SELECT * FROM medical_records WHERE id = ?")
    .get(Number(result.lastInsertRowid));

  return NextResponse.json({ record }, { status: 201 });
}
