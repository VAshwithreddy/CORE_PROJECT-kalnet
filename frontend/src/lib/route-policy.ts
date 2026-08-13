import type { UserRole } from "./roles";

export const routeAccess: Record<string, UserRole[]> = {
  "/employee": [
    "employee",
    "department_head",
    "department",
    "executive",
    "work_admin",
    "work-admin",
    "system_admin",
    "system-admin",
    "system",
    "manager",
    "team_leader",
  ],
  "/department": [
    "department_head",
    "department",
    "executive",
    "system_admin",
    "system-admin",
    "system",
    "work_admin",
    "work-admin",
  ],
  "/executive": ["executive", "system_admin", "system-admin", "system"],
  "/work-admin": ["work_admin", "work-admin", "system_admin", "system-admin", "system"],
  "/system": ["system_admin", "system-admin", "system"],
};

export function normalizeRole(role: string): string {
  const r = role.toLowerCase().replace(/-/g, "_");
  if (r === "department") return "department_head";
  if (r === "system") return "system_admin";
  return r;
}

export function canAccessRoute(pathname: string, role: string): boolean {
  const route = Object.keys(routeAccess).find((prefix) => pathname.startsWith(prefix));

  if (!route) {
    return true;
  }

  const normalized = normalizeRole(role);
  const allowedRoles = routeAccess[route].map((r) => normalizeRole(r));

  return allowedRoles.includes(normalized) || routeAccess[route].includes(role as UserRole);
}

