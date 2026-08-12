import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createRecord, getPatient } from "@/lib/db";
import { recordSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await requireSession(["coordinator", "admin"]);
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
  const patient = await getPatient(data.patientId);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const record = await createRecord({
    patientId: data.patientId,
    appointmentId: data.appointmentId || null,
    title: data.title,
    recordType: data.recordType,
    summary: data.summary,
    diagnosis: data.diagnosis || null,
    treatment: data.treatment || null,
    providerName: data.providerName || `Assistance · ${session.username}`,
    recordedAt: data.recordedAt,
  });

  return NextResponse.json({ record }, { status: 201 });
}
