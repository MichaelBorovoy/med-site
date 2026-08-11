import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  createAppointment,
  deleteAppointment,
  listAppointmentsWithPatientNames,
  updateAppointmentStatus,
} from "@/lib/db";
import { appointmentSchema } from "@/lib/validators";

export async function GET() {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appointments = await listAppointmentsWithPatientNames();

  return NextResponse.json({ appointments });
}

export async function POST(request: Request) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid appointment payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const data = parsed.data;

  try {
    const appointment = await createAppointment({
      patientId: data.patientId,
      doctorId: data.doctorId || null,
      providerName: data.providerName,
      reason: data.reason,
      status: data.status,
      scheduledAt: data.scheduledAt,
      notes: data.notes || null,
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create appointment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const id = Number(body.id);
  const status = body.status;

  if (!id || !["scheduled", "completed", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }

  await updateAppointmentStatus(id, status);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await deleteAppointment(id);
  return NextResponse.json({ ok: true });
}
