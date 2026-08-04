"use client";

import type { UserRole } from "./roles";

export interface CoreUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  roleLabel: string;
  departmentId: string;
  departmentName: string;
  initials: string;
}

export const DEMO_USERS: CoreUser[] = [
  {
    id: "EMP-014",
    name: "Jane Doe",
    email: "jane.doe@core.io",
    password: "employee123",
    role: "employee",
    roleLabel: "Frontend Engineer",
    departmentId: "dept-engineering",
    departmentName: "Engineering",
    initials: "JD",
  },
  {
    id: "EMP-021",
    name: "Alex Johnson",
    email: "alex.j@core.io",
    password: "employee123",
    role: "employee",
    roleLabel: "Backend Engineer",
    departmentId: "dept-engineering",
    departmentName: "Engineering",
    initials: "AJ",
  },
  {
    id: "EMP-055",
    name: "Sarah Wong",
    email: "sarah.wong@core.io",
    password: "depthead123",
    role: "department",
    roleLabel: "Head of Engineering",
    departmentId: "dept-engineering",
    departmentName: "Engineering",
    initials: "SW",
  },
  {
    id: "EMP-082",
    name: "David Chen",
    email: "david.chen@core.io",
    password: "depthead123",
    role: "department",
    roleLabel: "Head of Product",
    departmentId: "dept-product",
    departmentName: "Product",
    initials: "DC",
  },
  {
    id: "EMP-001",
    name: "Michael Kim",
    email: "michael.kim@core.io",
    password: "exec123",
    role: "executive",
    roleLabel: "CEO",
    departmentId: "org-global",
    departmentName: "Global",
    initials: "MK",
  },
  {
    id: "OPS-010",
    name: "Priya Kapoor",
    email: "priya.k@core.io",
    password: "opsadmin123",
    role: "work-admin",
    roleLabel: "Operations Lead",
    departmentId: "org-ops",
    departmentName: "Operations",
    initials: "PK",
  },
  {
    id: "SYS-001",
    name: "Ray Torres",
    email: "ray.torres@core.io",
    password: "sysadmin123",
    role: "system-admin",
    roleLabel: "System Administrator",
    departmentId: "org-it",
    departmentName: "IT",
    initials: "RT",
  }
];

const IS_CLIENT = typeof window !== "undefined";

function setSessionCookie(user: CoreUser | null) {
  if (!IS_CLIENT) return;
  if (user) {
    // Set cookie valid for 7 days
    document.cookie = `core_session_role=${user.role}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `core_session_user=${encodeURIComponent(JSON.stringify({ id: user.id, email: user.email, role: user.role, name: user.name }))}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    document.cookie = `core_session_role=; path=/; max-age=0`;
    document.cookie = `core_session_user=; path=/; max-age=0`;
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

let currentUser: CoreUser | null = loadUser();
type Listener = (user: CoreUser) => void;
const listeners = new Set<Listener>();

export function getCurrentUser(): CoreUser | null {
  return currentUser;
}

export function isAuthenticatedUser(): boolean {
  return currentUser !== null;
}

export function setCurrentUser(user: CoreUser | null) {
  currentUser = user;
  if (IS_CLIENT) {
    if (user) {
      localStorage.setItem("core_session_user", JSON.stringify(user));
      setSessionCookie(user);
    } else {
      localStorage.removeItem("core_session_user");
      setSessionCookie(null);
    }
  }
  listeners.forEach(l => l(currentUser || DEMO_USERS[0]));
}

export function loginWithCredentials(email: string, pass: string): { success: boolean; user?: CoreUser; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const found = DEMO_USERS.find(u => u.email.toLowerCase() === cleanEmail);
  if (!found) {
    return { success: false, error: "Invalid email address or account not found." };
  }
  if (found.password !== pass) {
    return { success: false, error: "Incorrect password. Please try again." };
  }

  setCurrentUser(found);
  return { success: true, user: found };
}

export function logoutUser() {
  setCurrentUser(null);
}

export function subscribeSession(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
