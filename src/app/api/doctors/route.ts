import { NextResponse } from "next/server";
import { getDb, listDoctorCategories, listDoctors } from "@/lib/db";

export async function GET(request: Request) {
  getDb();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;

  return NextResponse.json({
    doctors: listDoctors(category || undefined),
    categories: listDoctorCategories(),
  });
}
