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
  if (res.status === 204) return null;
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
        id: String(a.id),
        title: a.role || "Developer",
        project: a.project_name || "Unknown Project",
        projectId: a.project_id || "",
        owner: a.person_name || "Unassigned",
        ownerId: a.person_id || "",
        departmentId: a.department_id || "",
        dueDate: a.end_date || "2026-12-31",
        status: a.status === "done" || a.status === "completed" ? "completed" : a.status === "blocked" ? "blocked" : a.status === "at_risk" ? "waiting" : "in-progress",
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

function mapProject(project: any) {
  const metadata = project.metadata || {};
  const status = project.status === "completed" || project.status === "done"
    ? "completed"
    : project.status === "blocked"
      ? "blocked"
      : project.status === "active" || project.status === "on_track"
        ? "in-progress"
        : "waiting";
  return {
    ...project,
    id: String(project.id),
    departmentId: project.department_id || "",
    ownerId: project.owner_id || "",
    owner: project.owner_name || "Unassigned",
    dueDate: project.target_date || "Not scheduled",
    status,
    statusLabel: project.status || "Planning",
    health: metadata.health || (status === "blocked" ? "Off Track" : "On Track"),
    progress: Number(metadata.progress || (status === "completed" ? 100 : 0)),
    nextMilestone: metadata.next_milestone || "No milestone recorded",
    blockers: Number(metadata.blockers || 0),
  };
}

export function updatePersonOrganization(
  personId: string,
  data: { role: string; department_id: string; manager_id?: string | null },
  token?: string,
) {
  return apiRequest(`/people/${personId}/organization`, token, { method: "PATCH", body: data });
}

export async function getProjects(token?: string) {
  const res = await apiRequest("/projects", token);
  return Array.isArray(res) ? res.map(mapProject) : [];
}

export async function createProject(data: Record<string, unknown>, token?: string) {
  return mapProject(await apiRequest("/projects", token, { method: "POST", body: data }));
}

export function updateProject(id: string, data: Record<string, unknown>, token?: string) {
  return apiRequest(`/projects/${id}`, token, { method: "PATCH", body: data }).then(mapProject);
}

export async function createAssignment(data: Record<string, unknown>, token?: string) {
  const result = await apiRequest("/assignments", token, { method: "POST", body: data });
  return (await getAssignmentsFromResult(result))[0];
}

export async function updateAssignment(id: string, data: Record<string, unknown>, token?: string) {
  const result = await apiRequest(`/assignments/${id}`, token, { method: "PATCH", body: data });
  return (await getAssignmentsFromResult(result))[0];
}

export function createPerson(data: Record<string, unknown>, token?: string) {
  return apiRequest("/people", token, { method: "POST", body: data });
}

export function deleteAssignment(id: string, token?: string) {
  return apiRequest(`/assignments/${id}`, token, { method: "DELETE" });
}

async function getAssignmentsFromResult(result: any) {
  return Array.isArray(result) ? result : [{
    ...result,
    id: String(result.id),
    title: result.role || "Developer",
    project: result.project_name || "Unknown Project",
    projectId: result.project_id || "",
    owner: result.person_name || "Unassigned",
    ownerId: result.person_id || "",
    departmentId: result.department_id || "",
    dueDate: result.end_date || "2026-12-31",
    status: result.status === "done" || result.status === "completed" ? "completed" : result.status === "blocked" ? "blocked" : result.status === "at_risk" ? "waiting" : "in-progress",
    progress: result.status === "completed" || result.status === "done" ? 100 : 50,
    priority: "Medium",
  }];
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

export function getServiceAccounts(token?: string) {
  return apiRequest("/system/service-accounts", token);
}

export function getRequests(token?: string) {
  return apiRequest("/requests", token);
}

export function createRequest(data: { type: string; title: string; description: string }, token?: string) {
  return apiRequest("/requests", token, { method: "POST", body: data });
}

export function updateRequest(id: string, data: { status?: string; department_id?: string; assignee_id?: string }, token?: string) {
  return apiRequest(`/requests/${id}`, token, { method: "PATCH", body: data });
}

export function deleteRequest(id: string, token?: string) {
  return apiRequest(`/requests/${id}`, token, { method: "DELETE" });
}

export async function getBlockers(token?: string) {
  return apiRequest("/blockers", token);
}

export function resolveBlocker(assignmentId: string, note: string, token?: string) {
  return apiRequest(`/blockers/${assignmentId}/resolve`, token, { method: "POST", body: { note } });
}

export function createStatusUpdate(assignmentId: string, data: { status: "on_track" | "at_risk" | "blocked" | "completed"; message: string; blockers?: string }, token?: string) {
  return apiRequest(`/assignments/${assignmentId}/status-updates`, token, { method: "POST", body: { ...data, author_id: "server" } });
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
