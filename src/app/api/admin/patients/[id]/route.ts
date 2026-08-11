import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { deletePatient, getPatient, updatePatient } from "@/lib/db";
import { patientSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const patient = await getPatient(Number(id));
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
  const existing = await getPatient(patientId);
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

  try {
    const patient = await updatePatient(patientId, {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || null,
      dateOfBirth: data.dateOfBirth,
      bloodType: data.bloodType || null,
      allergies: data.allergies || null,
      emergencyContact: data.emergencyContact || null,
      notes: data.notes || null,
    });

    return NextResponse.json({ patient });
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
  const existing = await getPatient(patientId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deletePatient(patientId);
  return NextResponse.json({ ok: true });
}
