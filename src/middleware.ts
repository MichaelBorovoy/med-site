import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { ALL_ROLES, ROLE_HOME, type UserRole } from "@/lib/types";
import { canAccessPath } from "@/lib/permissions";

const COOKIE_NAME = "med_portal_session";

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && ALL_ROLES.includes(value as UserRole);
}

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
      !isUserRole(payload.role)
    ) {
      return null;
    }

    return { role: payload.role };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readSession(request);
  const protectedPrefixes = ["/admin", "/patient", "/doctor", "/coordinator"];
  const matched = protectedPrefixes.find((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!matched) {
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!canAccessPath(session.role, pathname)) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/patient/:path*",
    "/doctor/:path*",
    "/coordinator/:path*",
  ],
};
