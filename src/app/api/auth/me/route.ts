import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    getDb();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: session.id,
        username: session.username,
        role: session.role,
        patientId: session.patientId,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
