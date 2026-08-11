import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  createRecord,
  doctorCanAccessPatient,
  findAppointmentForDoctorPatient,
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
  if (!(await doctorCanAccessPatient(session.doctorId, data.patientId))) {
    return NextResponse.json(
      {
        error:
          "You can only add documents for patients with an appointment assigned to you.",
      },
      { status: 403 },
    );
  }

  if (data.appointmentId) {
    const appointmentId = await findAppointmentForDoctorPatient(
      data.appointmentId,
      session.doctorId,
      data.patientId,
    );

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Appointment not found for this doctor and patient." },
        { status: 400 },
      );
    }
  }

  const doctor = await getDoctor(session.doctorId);
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
    providerName: data.providerName || doctor?.full_name || null,
    recordedAt: data.recordedAt,
  });

  return NextResponse.json({ record }, { status: 201 });
}
