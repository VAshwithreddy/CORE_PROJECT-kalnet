import type { AuthUser } from "./auth";

export type UserScope = {
  userId: string;
  role: AuthUser["role"];
  canViewAllDepartments: boolean;
};

export function buildUserScope(user: AuthUser): UserScope {
  return {
    userId: user.id,
    role: user.role,
    canViewAllDepartments: user.role === "executive" || user.role === "system-admin",
  };
}
