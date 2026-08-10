import type { UserRole } from "./roles";

export const routeAccess: Record<string, UserRole[]> = {
  "/employee": ["employee", "department_head", "executive", "work_admin", "system_admin"],
  "/department": ["department_head", "executive", "system_admin"],
  "/executive": ["executive", "system_admin"],
  "/work-admin": ["work_admin", "system_admin"],
  "/system": ["system_admin"],
};

export function canAccessRoute(pathname: string, role: UserRole): boolean {
  const route = Object.keys(routeAccess).find((prefix) => pathname.startsWith(prefix));

  if (!route) {
    return true;
  }

  return routeAccess[route].includes(role);
}
