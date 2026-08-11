import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { listPatients } from "@/lib/db";

export async function GET() {
  const session = await requireSession(["coordinator", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ patients: await listPatients() });
}
