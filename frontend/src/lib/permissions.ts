import type { UserRole } from "./roles";

export type Permission =
  | "assignments:read"
  | "assignments:write"
  | "projects:read"
  | "projects:write"
  | "people:read"
  | "people:write"
  | "system:admin";

export const rolePermissions: Record<UserRole, Permission[]> = {
  employee: ["assignments:read", "projects:read"],
  department_head: ["assignments:read", "assignments:write", "projects:read", "people:read"],
  executive: ["assignments:read", "projects:read", "people:read"],
  work_admin: ["assignments:read", "assignments:write", "projects:read", "projects:write"],
  system_admin: [
    "assignments:read",
    "assignments:write",
    "projects:read",
    "projects:write",
    "people:read",
    "people:write",
    "system:admin",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}
