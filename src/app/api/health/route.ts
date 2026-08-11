import { NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";
import { getSql } from "@/lib/sql";

export async function GET() {
  try {
    await ensureDb();
    await getSql()`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Database health check failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
