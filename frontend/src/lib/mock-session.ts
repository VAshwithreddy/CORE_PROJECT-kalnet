"use client";

import type { UserRole } from "./roles";

export interface CoreUser {
  id: string;
  name: string;
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
    role: "employee",
    roleLabel: "Frontend Engineer",
    departmentId: "dept-engineering",
    departmentName: "Engineering",
    initials: "JD",
  },
  {
    id: "EMP-021",
    name: "Alex Johnson",
    role: "employee",
    roleLabel: "Backend Engineer",
    departmentId: "dept-engineering",
    departmentName: "Engineering",
    initials: "AJ",
  },
  {
    id: "EMP-055",
    name: "Sarah Wong",
    role: "department",
    roleLabel: "Head of Engineering",
    departmentId: "dept-engineering",
    departmentName: "Engineering",
    initials: "SW",
  },
  {
    id: "EMP-082",
    name: "David Chen",
    role: "department",
    roleLabel: "Head of Product",
    departmentId: "dept-product",
    departmentName: "Product",
    initials: "DC",
  },
  {
    id: "EMP-001",
    name: "Michael Kim",
    role: "executive",
    roleLabel: "CEO",
    departmentId: "org-global",
    departmentName: "Global",
    initials: "MK",
  },
  {
    id: "OPS-010",
    name: "Priya Kapoor",
    role: "work-admin",
    roleLabel: "Operations Lead",
    departmentId: "org-ops",
    departmentName: "Operations",
    initials: "PK",
  },
  {
    id: "SYS-001",
    name: "Ray Torres",
    role: "system-admin",
    roleLabel: "System Administrator",
    departmentId: "org-it",
    departmentName: "IT",
    initials: "RT",
  }
];

const IS_CLIENT = typeof window !== "undefined";

function loadUser(): CoreUser {
  if (!IS_CLIENT) return DEMO_USERS[0];
  try {
    const item = localStorage.getItem("core_session_user");
    return item ? JSON.parse(item) : DEMO_USERS[0];
  } catch (e) {
    return DEMO_USERS[0];
  }
}

let currentUser = loadUser();
type Listener = (user: CoreUser) => void;
const listeners = new Set<Listener>();

export function getCurrentUser(): CoreUser {
  return currentUser;
}

export function setCurrentUser(user: CoreUser) {
  currentUser = user;
  if (IS_CLIENT) {
    localStorage.setItem("core_session_user", JSON.stringify(user));
  }
  listeners.forEach(l => l(currentUser));
}

export function subscribeSession(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
