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

export function loginToBackend(username: string, password?: string) {
  return apiRequest("/auth/login", undefined, {
    method: "POST",
    body: { username, password: password || "firebase_auth_passed" },
  });
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

export async function getProjects(token?: string) {
  const res = await apiRequest("/projects", token);
  return Array.isArray(res)
    ? res.map((p: any) => {
        let feStatus = "new";
        if (p.status === "active") {
          feStatus = "in-progress";
        } else if (p.status === "planned") {
          feStatus = "waiting";
        } else if (p.status === "completed") {
          feStatus = "completed";
        } else if (p.status === "on_hold") {
          feStatus = "blocked";
        } else if (p.status === "cancelled") {
          feStatus = "archived";
        } else {
          feStatus = p.status || "new";
        }

        return {
          ...p,
          departmentId: p.department_id || p.departmentId || "",
          ownerId: p.owner_id || p.ownerId || "",
          owner: p.owner_name || p.owner || "Unassigned",
          status: feStatus,
          statusLabel: (p.status || "new").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
          health: p.priority === "high" ? "At Risk" : p.priority === "critical" ? "Off Track" : p.status === "completed" ? "Delivered" : "On Track",
          dueDate: p.target_date || p.due_date || p.dueDate || "",
          progress: p.status === "completed" || p.status === "done" ? 100 : p.status === "in_progress" || p.status === "active" ? 50 : 10,
          nextMilestone: p.metadata?.next_milestone || "",
          blockers: p.metadata?.blockers || 0,
        };
      })
    : [];
}

export function createProject(
  body: { name: string; department_id?: string; owner_id?: string; due_date?: string; priority?: string; status?: string },
  token?: string
) {
  let dbStatus = "planned";
  if (body.status === "in-progress" || body.status === "active") {
    dbStatus = "active";
  } else if (body.status === "completed") {
    dbStatus = "completed";
  } else if (body.status === "blocked" || body.status === "on_hold") {
    dbStatus = "on_hold";
  } else if (body.status === "archived" || body.status === "cancelled") {
    dbStatus = "cancelled";
  } else {
    dbStatus = "planned";
  }
  const mappedBody = { ...body, status: dbStatus };
  return apiRequest("/projects", token, {
    method: "POST",
    body: mappedBody,
  });
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

export function getStatusUpdates(assignmentId: string, token?: string) {
  return apiRequest(`/assignments/${assignmentId}/status-updates`, token);
}

export function createStatusUpdate(
  assignmentId: string,
  body: { author_id: string; status: string; message: string; blockers?: string },
  token?: string
) {
  return apiRequest(`/assignments/${assignmentId}/status-updates`, token, {
    method: "POST",
    body,
  });
}

export function updateAssignment(
  assignmentId: string,
  body: { status?: string; role?: string; allocation_percent?: number; person_id?: string },
  token?: string
) {
  return apiRequest(`/assignments/${assignmentId}`, token, {
    method: "PATCH",
    body,
  });
}

export function createAssignment(
  body: { person_id: string; project_id: string; role?: string; status?: string; start_date?: string; end_date?: string },
  token?: string
) {
  return apiRequest("/assignments", token, {
    method: "POST",
    body,
  });
}
