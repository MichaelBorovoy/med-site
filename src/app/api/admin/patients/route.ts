import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getDb, listPatients } from "@/lib/db";
import { patientSchema } from "@/lib/validators";

export async function GET() {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ patients: listPatients() });
}

export async function POST(request: Request) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const result = db
      .prepare(
        `INSERT INTO patients (
          full_name, email, phone, date_of_birth, blood_type,
          allergies, emergency_contact, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        data.fullName,
        data.email,
        data.phone || null,
        data.dateOfBirth,
        data.bloodType || null,
        data.allergies || null,
        data.emergencyContact || null,
        data.notes || null,
      );

    const patientId = Number(result.lastInsertRowid);

    if (data.username && data.password) {
      db.prepare(
        `INSERT INTO users (username, password_hash, role, patient_id)
         VALUES (?, ?, 'patient', ?)`,
      ).run(data.username, bcrypt.hashSync(data.password, 12), patientId);
    }

    const patient = db
      .prepare("SELECT * FROM patients WHERE id = ?")
      .get(patientId);

    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create patient.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
