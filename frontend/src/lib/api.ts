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

export function getAssignments(token?: string) {
  return apiRequest("/assignments", token);
}

export function getPeople(token?: string) {
  return apiRequest("/people", token);
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

export function getBlockers(token?: string) {
  return apiRequest("/blockers", token);
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
