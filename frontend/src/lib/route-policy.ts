import type { UserRole } from "./roles";

export const routeAccess: Record<string, UserRole[]> = {
  "/employee": ["employee", "department", "executive", "work-admin", "system-admin"],
  "/department": ["department", "executive", "system-admin"],
  "/executive": ["executive", "system-admin"],
  "/work-admin": ["work-admin", "system-admin"],
  "/system": ["system-admin"],
};

export function canAccessRoute(pathname: string, role: UserRole): boolean {
  const route = Object.keys(routeAccess).find((prefix) => pathname.startsWith(prefix));

  if (!route) {
    return true;
  }

  return routeAccess[route].includes(role);
}
