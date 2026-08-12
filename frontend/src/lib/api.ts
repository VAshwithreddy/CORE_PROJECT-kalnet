const API_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "") + "/api/v1";

function getStoredToken(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("core_access_token") || "";
  }
  return "";
}

async function apiRequest(path: string, token?: string, options?: { method?: string; body?: any }) {
  const opts = options || {};
  const bearerToken = token || getStoredToken();
  const res = await fetch(API_URL + path, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: bearerToken ? "Bearer " + bearerToken : "",
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    let errMsg = `API error: ${res.status}`;
    try {
      const errData = await res.json();
      errMsg = errData.detail || errMsg;
    } catch {}
    throw new Error(errMsg);
  }
  return res.json();
}

export async function getAssignments(token?: string) {
  const res = await apiRequest("/assignments", token);
  return Array.isArray(res)
    ? res.map((a: any) => ({
        ...a,
        title: a.role || "Developer",
        project: a.project_name || "Unknown Project",
        projectId: a.project_id || "",
        owner: a.person_name || "Unassigned",
        ownerId: a.person_id || "",
        departmentId: a.department_id || "",
        dueDate: a.end_date || "2026-12-31",
        progress: a.status === "completed" || a.status === "done" ? 100 : 50,
        priority: "Medium",
      }))
    : [];
}

export async function getPeople(token?: string) {
  const res = await apiRequest("/people", token);
  return Array.isArray(res)
    ? res.map((p: any) => ({
        ...p,
        name: p.full_name || p.name,
        departmentId: p.department_id || p.departmentId,
      }))
    : [];
}

export function getEmployeeDashboard(token?: string) {
  return apiRequest("/dashboard/employee", token);
}

export function getAlerts(token?: string) {
  return apiRequest("/alerts/stale", token);
}

export function getDigests(token?: string) {
  return apiRequest("/digests/weekly", token);
}

export function getProjects(token?: string) {
  return apiRequest("/projects", token);
}

export function getDepartments(token?: string) {
  return apiRequest("/departments", token);
}

export function getSystemUsers(token?: string) {
  return apiRequest("/system/users", token);
}

export function getAuditEvents(token?: string) {
  return apiRequest("/system/audit", token);
}

export function getRequests(token?: string) {
  return apiRequest("/requests", token);
}

export async function getBlockers(token?: string) {
  const assignments = await getAssignments(token);
  return assignments.filter((a: any) => a.status === "blocked");
}

export function getNotifications(token?: string) {
  return apiRequest("/notifications", token);
}

export function markNotificationsRead(ids: string[], token?: string) {
  return apiRequest("/notifications/mark-read", token, {
    method: "PATCH",
    body: { ids },
  });
}

export function getPersonAssignments(personId: string, token?: string) {
  return apiRequest(`/auth/assignments?person_id=${personId}`, token);
}
