import { NextResponse } from "next/server";
import {
  ensureDb,
  listDoctorsForFilter,
  listServiceSpecialties,
  searchServices,
} from "@/lib/db";

export async function GET(request: Request) {
  await ensureDb();
  const { searchParams } = new URL(request.url);
  const specialty = searchParams.get("specialty") || "All";
  const doctorId = Number(searchParams.get("doctor") || "0") || undefined;
  const query = searchParams.get("q") || undefined;
  const page = Number(searchParams.get("page") || "1") || 1;
  const pageSize = Number(searchParams.get("pageSize") || "10") || 10;

  const result = await searchServices({
    query,
    specialty,
    doctorId,
    page,
    pageSize,
  });

  return NextResponse.json({
    ...result,
    specialties: await listServiceSpecialties(),
    doctors: await listDoctorsForFilter({
      specialty,
      limit: specialty === "All" ? 100 : 300,
    }),
  });
}
