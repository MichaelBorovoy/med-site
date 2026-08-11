import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getClinic, getDb, listClinics } from "@/lib/db";
import { clinicSchema } from "@/lib/validators";

export async function GET() {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ clinics: listClinics() });
}

export async function POST(request: Request) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = clinicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid clinic payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  try {
    const result = getDb()
      .prepare(
        `INSERT INTO clinics (name, city, address, phone, description)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        data.name,
        data.city,
        data.address,
        data.phone || null,
        data.description || null,
      );

    return NextResponse.json(
      { clinic: getClinic(Number(result.lastInsertRowid)) },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create clinic.";
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

  getDb().prepare("DELETE FROM clinics WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
