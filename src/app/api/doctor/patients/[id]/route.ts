import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  doctorCanAccessPatient,
  getPatient,
  listAppointments,
  listRecords,
} from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireSession("doctor");
  if (!session?.doctorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const patientId = Number(id);
  if (!doctorCanAccessPatient(session.doctorId, patientId)) {
    return NextResponse.json(
      { error: "You can only view patients with appointments assigned to you." },
      { status: 403 },
    );
  }

  const patient = getPatient(patientId);
  if (!patient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    patient,
    records: listRecords(patientId),
    appointments: listAppointments(patientId).filter(
      (item) => item.doctor_id === session.doctorId,
    ),
  });
}
