import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getDashboardStats, listUsers } from "@/lib/db";

export async function GET() {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    stats: await getDashboardStats(),
    users: await listUsers(),
  });
}
