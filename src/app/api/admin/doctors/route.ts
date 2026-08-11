import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getDb, getDoctor, searchDoctors } from "@/lib/db";
import { doctorSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const result = searchDoctors({
    query: searchParams.get("q") || undefined,
    clinicId: Number(searchParams.get("clinic") || "0") || undefined,
    page: Number(searchParams.get("page") || "1") || 1,
    pageSize: Number(searchParams.get("pageSize") || "20") || 20,
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = doctorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid doctor payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const db = getDb();

  try {
    const result = db
      .prepare(
        `INSERT INTO doctors (
          full_name, clinic_id, category, specialty, years_experience,
          experience_summary, education, languages, accepting_patients
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        data.fullName,
        data.clinicId,
        data.category,
        data.specialty,
        data.yearsExperience,
        data.experienceSummary,
        data.education || null,
        data.languages || null,
        data.acceptingPatients === false ? 0 : 1,
      );

    return NextResponse.json(
      { doctor: getDoctor(Number(result.lastInsertRowid)) },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create doctor.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
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

  getDb().prepare("DELETE FROM doctors WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
