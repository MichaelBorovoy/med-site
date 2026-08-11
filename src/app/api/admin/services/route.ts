import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";
import {
  createService,
  deleteService,
  getServiceById,
  listServices,
  updateService,
} from "@/lib/db";
import { serviceSchema } from "@/lib/validators";

export async function GET() {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ services: await listServices() });
}

export async function POST(request: NextRequest) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid service payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const id = await createService(parsed.data);
  return NextResponse.json(
    { service: await getServiceById(id) },
    { status: 201 },
  );
}

export async function PUT(request: NextRequest) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...rest } = body as { id?: number };
  if (!id) {
    return NextResponse.json({ error: "Service id is required" }, { status: 400 });
  }

  const parsed = serviceSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid service payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await getServiceById(id);
  if (!existing) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  await updateService(id, parsed.data);
  return NextResponse.json({ service: await getServiceById(id) });
}

export async function DELETE(request: NextRequest) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "Service id is required" }, { status: 400 });
  }

  await deleteService(id);
  return NextResponse.json({ ok: true });
}
