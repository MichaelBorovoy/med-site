import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  createPatientContactLog,
  getPatient,
  listPatientContactLogs,
} from "@/lib/db";
import { patientContactLogSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const session = await requireSession(["coordinator", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patientId = Number(new URL(request.url).searchParams.get("patientId"));
  if (!patientId) {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
  }

  const patient = await getPatient(patientId);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const logs = await listPatientContactLogs(patientId);
  return NextResponse.json({ logs });
}

export async function POST(request: Request) {
  const session = await requireSession(["coordinator", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = patientContactLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid contact log payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const patient = await getPatient(data.patientId);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const log = await createPatientContactLog({
    patientId: data.patientId,
    userId: session.id,
    channel: data.channel,
    direction: data.direction,
    summary: data.summary,
    referenceCode: data.referenceCode || null,
    queueItemId: data.queueItemId || null,
  });

  return NextResponse.json({ log }, { status: 201 });
}
