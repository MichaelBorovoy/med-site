import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "med_portal_session";

async function readSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const secret = process.env.SESSION_SECRET?.trim();

  if (!token || !secret || secret.length < 16) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );

    if (
      typeof payload.id !== "number" ||
      typeof payload.username !== "string" ||
      (payload.role !== "admin" && payload.role !== "patient")
    ) {
      return null;
    }

    return {
      role: payload.role as "admin" | "patient",
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readSession(request);

  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/patient", request.url));
    }
  }

  if (pathname.startsWith("/patient")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "patient") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/patient/:path*"],
};
