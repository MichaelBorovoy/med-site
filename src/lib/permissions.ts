import type { SessionUser, UserRole } from "@/lib/types";
import { ROLE_HOME } from "@/lib/types";

export type Permission =
  | "public:read"
  | "patient:read_own"
  | "patient:update_own_profile"
  | "doctor:read_assigned"
  | "doctor:write_records"
  | "coordinator:assist"
  | "coordinator:manage_appointments"
  | "admin:all";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  patient: ["public:read", "patient:read_own", "patient:update_own_profile"],
  doctor: ["public:read", "doctor:read_assigned", "doctor:write_records"],
  coordinator: [
    "public:read",
    "coordinator:assist",
    "coordinator:manage_appointments",
  ],
  admin: [
    "public:read",
    "patient:read_own",
    "patient:update_own_profile",
    "doctor:read_assigned",
    "doctor:write_records",
    "coordinator:assist",
    "coordinator:manage_appointments",
    "admin:all",
  ],
};

export function homeForRole(role: UserRole) {
  return ROLE_HOME[role];
}

export function hasPermission(
  user: SessionUser | null | undefined,
  permission: Permission,
) {
  if (!user) {
    return permission === "public:read";
  }
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
}

export function hasAnyRole(
  user: SessionUser | null | undefined,
  roles: UserRole[],
) {
  return Boolean(user && roles.includes(user.role));
}

export function canAccessPath(role: UserRole, pathname: string) {
  if (pathname.startsWith("/admin")) {
    return role === "admin";
  }
  if (pathname.startsWith("/patient")) {
    return role === "patient";
  }
  if (pathname.startsWith("/doctor")) {
    return role === "doctor";
  }
  if (pathname.startsWith("/coordinator")) {
    return role === "coordinator";
  }
  return true;
}
