"use client";

import type { UserRole } from "./roles";
import { apiClient } from "./api-client";

export interface CoreUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  departmentId: string;
  departmentName: string;
  initials: string;
}

const IS_CLIENT = typeof window !== "undefined";

function setSessionCookie(user: CoreUser | null, token: string | null = null) {
  if (!IS_CLIENT) return;
  if (user && token) {
    document.cookie = `core_session_role=${user.role}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `core_session_user=${encodeURIComponent(JSON.stringify({ id: user.id, email: user.email, role: user.role, name: user.name }))}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `core_session_token=${token}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    document.cookie = `core_session_role=; path=/; max-age=0`;
    document.cookie = `core_session_user=; path=/; max-age=0`;
    document.cookie = `core_session_token=; path=/; max-age=0`;
  }
}

function loadUser(): CoreUser | null {
  if (!IS_CLIENT) return null;
  try {
    const item = localStorage.getItem("core_session_user");
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
}

function loadToken(): string | null {
  if (!IS_CLIENT) return null;
  return localStorage.getItem("core_session_token");
}

let currentUser: CoreUser | null = loadUser();
let currentToken: string | null = loadToken();

type Listener = (user: CoreUser | null) => void;
const listeners = new Set<Listener>();

export function getCurrentUser(): CoreUser | null {
  return currentUser;
}

export function getCurrentToken(): string | null {
  return currentToken;
}

export function isAuthenticatedUser(): boolean {
  return currentUser !== null;
}

export function setCurrentUser(user: CoreUser | null, token: string | null = null) {
  currentUser = user;
  currentToken = token;
  if (IS_CLIENT) {
    if (user && token) {
      localStorage.setItem("core_session_user", JSON.stringify(user));
      localStorage.setItem("core_session_token", token);
      setSessionCookie(user, token);
    } else {
      localStorage.removeItem("core_session_user");
      localStorage.removeItem("core_session_token");
      setSessionCookie(null);
    }
  }
  listeners.forEach(l => l(currentUser));
}

export async function loginWithCredentials(email: string, pass: string): Promise<{ success: boolean; user?: CoreUser; error?: string }> {
  try {
    // 1. Authenticate
    const tokenResponse = await apiClient<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: email, password: pass }),
    });

    const token = tokenResponse.access_token;

    // 2. Fetch current user info (includes full_name, department_id, department_name)
    const me = await apiClient<{
      id: string;
      username: string;
      email: string;
      role: string;
      full_name?: string | null;
      department_id?: string | null;
      department_name?: string | null;
    }>("/me", { method: "GET", token });

    const ROLE_LABELS: Record<string, string> = {
      employee: "Employee",
      manager: "Manager",
      team_leader: "Team Leader",
      department_head: "Department Head",
      work_admin: "Work Admin",
      system_admin: "System Admin",
      executive: "Executive",
    };

    const displayName = me.full_name || me.username;
    const initials = displayName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const user: CoreUser = {
      id: me.id,
      name: displayName,
      email: me.email,
      role: me.role as CoreUser["role"],
      roleLabel: ROLE_LABELS[me.role] ?? me.role,
      departmentId: me.department_id ?? "",
      departmentName: me.department_name ?? "",
      initials,
    };

    setCurrentUser(user, token);
    return { success: true, user };
  } catch (err: any) {
    return { success: false, error: err.message || "Invalid credentials." };
  }
}

export function logoutUser() {
  setCurrentUser(null);
}

export function subscribeSession(listener: Listener) {
  listeners.add(listener);
  // Fire immediately with current state if needed
  // listener(currentUser);
  return () => {
    listeners.delete(listener);
  };
}
