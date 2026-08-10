export type UserRole = "employee" | "department_head" | "executive" | "work_admin" | "system_admin";

export const ROLE_LABELS: Record<UserRole, string> = {
  employee: "Employee",
  department_head: "Department Head",
  executive: "Executive",
  work_admin: "Work Admin",
  system_admin: "System Admin",
};

export const ROLE_HOME_PATHS: Record<UserRole, string> = {
  employee: "/employee/home",
  department_head: "/department/home",
  executive: "/executive/overview",
  work_admin: "/work-admin/home",
  system_admin: "/system/users",
};
