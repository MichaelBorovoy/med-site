import { NextResponse } from "next/server";
import { getSql } from "@/lib/sql";

export const dynamic = "force-dynamic";

function safeErrorMessage(error: unknown) {
  const raw =
    error instanceof Error ? error.message : "Database health check failed.";
  return raw.replace(/postgresql:\/\/\S+/gi, "postgresql://***");
}

export async function GET() {
  try {
    // Lightweight check only — do not run seeds here (deploy health probes this).
    const sql = getSql();
    await sql`SELECT 1 AS ok`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: safeErrorMessage(error) },
      { status: 503 },
    );
  }
}
