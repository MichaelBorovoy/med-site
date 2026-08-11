import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createPatient, listPatients } from "@/lib/db";
import { patientSchema } from "@/lib/validators";

export async function GET() {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ patients: await listPatients() });
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

  try {
    const patient = await createPatient({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || null,
      dateOfBirth: data.dateOfBirth,
      bloodType: data.bloodType || null,
      allergies: data.allergies || null,
      emergencyContact: data.emergencyContact || null,
      notes: data.notes || null,
      username: data.username,
      password: data.password,
    });

    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create patient.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
