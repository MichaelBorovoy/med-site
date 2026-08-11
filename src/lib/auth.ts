import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { findUserByUsername, findUserById } from "@/lib/db";
import { ALL_ROLES, type SessionUser, type UserRole } from "@/lib/types";

const COOKIE_NAME = "med_portal_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function getSecret() {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET must be set in .env.local (min 16 characters).",
    );
  }
  return new TextEncoder().encode(secret);
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && ALL_ROLES.includes(value as UserRole);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    id: user.id,
    username: user.username,
    role: user.role,
    patientId: user.patientId,
    doctorId: user.doctorId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  if (
    typeof payload.id !== "number" ||
    typeof payload.username !== "string" ||
    !isUserRole(payload.role)
  ) {
    return null;
  }

  return {
    id: payload.id,
    username: payload.username,
    role: payload.role,
    patientId:
      typeof payload.patientId === "number" ? payload.patientId : null,
    doctorId: typeof payload.doctorId === "number" ? payload.doctorId : null,
  } satisfies SessionUser;
}

export async function authenticate(username: string, password: string) {
  const user = await findUserByUsername(username.trim());
  if (!user) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    patientId: user.patient_id,
    doctorId: user.doctor_id,
  } satisfies SessionUser;
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionToken(user);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    const session = await verifySessionToken(token);
    if (!session) {
      return null;
    }

    const fresh = await findUserById(session.id);
    if (!fresh) {
      return null;
    }

    return {
      id: fresh.id,
      username: fresh.username,
      role: fresh.role,
      patientId: fresh.patient_id,
      doctorId: fresh.doctor_id,
    };
  } catch {
    return null;
  }
}

export async function requireSession(role?: UserRole | UserRole[]) {
  const session = await getSession();
  if (!session) {
    return null;
  }

  if (!role) {
    return session;
  }

  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(session.role)) {
    return null;
  }

  return session;
}

export { COOKIE_NAME };
