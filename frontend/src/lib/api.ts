const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function apiRequest(path: string, token?: string, options?: { method?: string }) {
  const opts = options || {};
  const res = await fetch(API_URL + path, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? "Bearer " + token : "",
    },
  });
  if (!res.ok) {
    throw new Error("API error: " + res.status);
  }
  return res.json();
}

export function getAssignments(token: string) {
  return apiRequest("/assignments", token);
}

export function getPeople(token: string) {
  return apiRequest("/people", token);
}

export function getEmployeeDashboard(token: string) {
  return apiRequest("/dashboard/employee", token);
}
