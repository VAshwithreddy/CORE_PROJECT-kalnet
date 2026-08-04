export type UserRole = "employee" | "department" | "executive" | "work-admin" | "system-admin";

export const ROLE_LABELS: Record<UserRole, string> = {
  employee: "Employee",
  department: "Department Head",
  executive: "Executive",
  "work-admin": "Work Admin",
  "system-admin": "System Admin",
};

export const ROLE_HOME_PATHS: Record<UserRole, string> = {
  employee: "/employee/home",
  department: "/department/home",
  executive: "/executive/overview",
  "work-admin": "/work-admin/home",
  "system-admin": "/system/users",
};
