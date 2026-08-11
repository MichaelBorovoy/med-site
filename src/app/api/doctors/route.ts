import { NextResponse } from "next/server";
import {
  getDb,
  listClinics,
  listDoctorCategories,
  searchDoctors,
} from "@/lib/db";

export async function GET(request: Request) {
  getDb();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const query = searchParams.get("q") || undefined;
  const clinicId = Number(searchParams.get("clinic") || "0") || undefined;
  const page = Number(searchParams.get("page") || "1") || 1;
  const pageSize = Number(searchParams.get("pageSize") || "10") || 10;

  const result = searchDoctors({
    query,
    category,
    clinicId,
    page,
    pageSize,
  });

  return NextResponse.json({
    ...result,
    categories: listDoctorCategories(),
    clinics: listClinics(),
  });
}
