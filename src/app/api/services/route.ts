import { NextResponse } from "next/server";
import {
  getDb,
  listDoctorsForFilter,
  listServiceSpecialties,
  searchServices,
} from "@/lib/db";

export async function GET(request: Request) {
  getDb();
  const { searchParams } = new URL(request.url);
  const specialty = searchParams.get("specialty") || "All";
  const doctorId = Number(searchParams.get("doctor") || "0") || undefined;
  const query = searchParams.get("q") || undefined;
  const page = Number(searchParams.get("page") || "1") || 1;
  const pageSize = Number(searchParams.get("pageSize") || "10") || 10;

  const result = searchServices({
    query,
    specialty,
    doctorId,
    page,
    pageSize,
  });

  return NextResponse.json({
    ...result,
    specialties: listServiceSpecialties(),
    doctors: listDoctorsForFilter({
      specialty,
      limit: specialty === "All" ? 100 : 300,
    }),
  });
}
