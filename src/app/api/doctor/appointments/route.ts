import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { listDoctorAppointments } from "@/lib/db";

export async function GET() {
  const session = await requireSession("doctor");
  if (!session?.doctorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    appointments: listDoctorAppointments(session.doctorId),
  });
}
