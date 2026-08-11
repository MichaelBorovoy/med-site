import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getPatient, updatePatientProfile } from "@/lib/db";
import { patientProfileSchema } from "@/lib/validators";

export async function GET() {
  const session = await requireSession("patient");
  if (!session?.patientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patient = await getPatient(session.patientId);
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
  const patient = await updatePatientProfile(session.patientId, {
    phone: data.phone || null,
    allergies: data.allergies || null,
    emergencyContact: data.emergencyContact || null,
  });

  return NextResponse.json({ patient });
}
