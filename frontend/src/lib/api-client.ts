export type ApiClientOptions = RequestInit & {
  token?: string;
};

export async function apiClient<TResponse>(
  path: string,
  options: ApiClientOptions = {},
): Promise<TResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail = typeof payload?.detail === "string" ? payload.detail : "";
    // Backend exceptions can contain SQL implementation details. Keep those
    // useful in server logs but never display them to an employee.
    const message = /database error|sqlalchemy|psycopg|undefinedcolumn/i.test(detail)
      ? "The service is temporarily unavailable. Please try again."
      : detail || `API request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<TResponse>;
}
