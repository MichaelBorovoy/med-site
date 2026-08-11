import { NextResponse } from "next/server";
import { authenticate, setSessionCookie } from "@/lib/auth";
import { ensureDb } from "@/lib/db";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    await ensureDb();
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 400 },
      );
    }

    const user = await authenticate(
      parsed.data.username,
      parsed.data.password,
    );

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 },
      );
    }

    await setSessionCookie(user);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        patientId: user.patientId,
        doctorId: user.doctorId,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sign in.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
