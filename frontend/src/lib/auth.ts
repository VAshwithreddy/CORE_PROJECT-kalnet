import type { UserRole } from "./roles";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
};

export function isAuthenticated(session: AuthSession | null): session is AuthSession {
  return Boolean(session?.accessToken && session.user);
}
