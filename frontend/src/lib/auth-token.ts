/**
 * auth-token.ts
 *
 * Real authentication now exists: login() below calls the backend's real
 * JWT endpoint (POST /api/v1/auth/login) and stores the token here.
 *
 * Context: this frontend's OTHER session model (lib/mock-session.ts) is a
 * separate, client-side-only demo-persona switcher used by every page
 * except the ones wired to login()/notifications-api.ts. It stores a
 * fake user object (ids like "EMP-014") in localStorage and has nothing
 * to do with real backend auth. The two systems are intentionally kept
 * separate rather than merged — see docs/NOTIFICATION_INTELLIGENCE_
 * ARCHITECTURE.md for why unifying them app-wide is out of scope here.
 *
 * getAuthToken() reads the token login() wrote; before any successful
 * login it returns null, and callers (see notifications-api.ts) treat a
 * null token as "not signed in" and must show an explicit sign-in state —
 * never silently substitute demo data for it.
 */
"use client";

const TOKEN_KEY = "core_auth_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export interface DecodedTokenClaims {
  sub: string; // person_id
  email: string;
  role: string;
  exp: number;
}

/** Decodes the JWT payload for display purposes only (e.g. showing who's
 * signed in) — this is NOT signature verification. The backend is the
 * only place that verifies the signature; the frontend must never trust
 * these claims for authorization decisions, only for UI display. */
export function decodeToken(token: string): DecodedTokenClaims | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export interface LoginResult {
  ok: boolean;
  error?: string;
}

/**
 * Calls the real backend login endpoint (POST /api/v1/auth/login) and
 * stores the returned access token via setAuthToken() on success.
 *
 * IMPORTANT — matches a real, pre-existing backend limitation, not
 * something introduced here: AuthService.login (backend) issues a
 * genuine signed JWT for any person matched by username/email, but does
 * not yet verify the password field against anything (no password column
 * exists on `people` yet). This form still collects and sends a password
 * (the backend schema requires the field, and so the UI shouldn't imply
 * otherwise) but today, only the username/email needs to match a real
 * person. See docs/NOTIFICATION_INTELLIGENCE_ARCHITECTURE.md.
 */
export async function login(username: string, password: string): Promise<LoginResult> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  try {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      if (response.status === 401) return { ok: false, error: "No matching account found." };
      return { ok: false, error: `Login failed (status ${response.status}).` };
    }
    const data = await response.json();
    if (!data.access_token) return { ok: false, error: "Server did not return a token." };
    setAuthToken(data.access_token);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the server. Is the backend running?" };
  }
}
