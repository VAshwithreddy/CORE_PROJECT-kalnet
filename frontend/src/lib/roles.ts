export type UserRole =
  | "employee"
  | "department_head"
  | "department"
  | "executive"
  | "work_admin"
  | "work-admin"
  | "system_admin"
  | "system-admin"
  | "system"
  | "manager"
  | "team_leader";

export const ROLE_LABELS: Record<string, string> = {
  employee: "Employee",
  department_head: "Department Head",
  department: "Department Head",
  executive: "Executive",
  work_admin: "Work Admin",
  "work-admin": "Work Admin",
  system_admin: "System Admin",
  "system-admin": "System Admin",
  system: "System Admin",
  manager: "Manager",
  team_leader: "Team Leader",
};

export const ROLE_HOME_PATHS: Record<string, string> = {
  employee: "/employee/home",
  department_head: "/department/home",
  department: "/department/home",
  executive: "/executive/overview",
  work_admin: "/work-admin/home",
  "work-admin": "/work-admin/home",
  system_admin: "/system/users",
  "system-admin": "/system/users",
  system: "/system/users",
  manager: "/employee/home",
  team_leader: "/employee/home",
};

export const ROLE_NOTIFICATIONS_PATHS: Record<string, string> = {
  employee: "/employee/notifications",
  department_head: "/department/notifications",
  department: "/department/notifications",
  executive: "/executive/notifications",
  work_admin: "/work-admin/notifications",
  "work-admin": "/work-admin/notifications",
  system_admin: "/system/notifications",
  "system-admin": "/system/notifications",
  system: "/system/notifications",
  manager: "/employee/notifications",
  team_leader: "/employee/notifications",
};