import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  getPatient,
  listAppointments,
  listPrescriptions,
  listRecords,
} from "@/lib/db";

export async function GET() {
  const session = await requireSession("patient");
  if (!session || !session.patientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patient = getPatient(session.patientId);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  return NextResponse.json({
    patient,
    records: listRecords(session.patientId),
    appointments: listAppointments(session.patientId),
    prescriptions: listPrescriptions(session.patientId),
  });
}
