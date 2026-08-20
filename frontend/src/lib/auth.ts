"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from "firebase/auth";
import { auth as firebaseAuth } from "./firebase";

function getApiCandidates(): string[] {
  const list: string[] = [];
  const envUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").trim().replace(/\/$/, "");
  if (envUrl) {
    list.push(`${envUrl}/api/v1`);
  }
  if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
    const host = window.location.hostname || "localhost";
    const dyn = `http://${host}:8000/api/v1`;
    if (!list.includes(dyn)) list.push(dyn);
    if (!list.includes("http://localhost:8000/api/v1")) list.push("http://localhost:8000/api/v1");
    if (!list.includes("http://127.0.0.1:8000/api/v1")) list.push("http://127.0.0.1:8000/api/v1");
  } else if (process.env.NODE_ENV !== "production") {
    list.push("http://127.0.0.1:8000/api/v1");
    list.push("http://localhost:8000/api/v1");
  }
  return list;
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  departmentId: string;
  departmentName: string;
  initials: string;
};

export type AuthContextType = {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  loginWithBackend: (email: string, password?: string) => Promise<AuthUser>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  token: null,
  loading: true,
  error: null,
  logout: async () => {},
  loginWithBackend: async () => {
    throw new Error("AuthProvider not mounted");
  },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("core_user_profile");
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("core_access_token") || null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loginWithBackend = async (userEmail: string, pass: string = "core_demo_pass"): Promise<AuthUser> => {
    const cleanEmail = userEmail.trim().toLowerCase();
    const candidates = getApiCandidates();

    let lookupRes: Response | null = null;
    let successfulBaseUrl = candidates[0];
    let lastNetworkErr: any = null;

    for (const base of candidates) {
      try {
        const res = await fetch(`${base}/auth/lookup?email=${encodeURIComponent(cleanEmail)}`);
        lookupRes = res;
        successfulBaseUrl = base;
        break;
      } catch (fetchErr: any) {
        lastNetworkErr = fetchErr;
      }
    }

    if (!lookupRes) {
      throw new Error(`Unable to connect to backend server at ${candidates.join(" or ")}. Ensure FastAPI is running on port 8000.`);
    }

    if (!lookupRes.ok) {
      const errData = await lookupRes.json().catch(() => ({}));
      throw new Error(errData.detail || `User "${cleanEmail}" was not found in the employee directory.`);
    }

    const profile = await lookupRes.json();

    // Step 2: Acquire backend JWT
    let access_token: string | null = null;
    try {
      const loginRes = await fetch(`${successfulBaseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanEmail, password: pass }),
      });
      if (loginRes.ok) {
        const tokenData = await loginRes.json();
        access_token = tokenData.access_token;
      }
    } catch (tokenErr) {
      console.warn("Backend JWT creation failed:", tokenErr);
    }

    const authUser: AuthUser = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      roleLabel: profile.roleLabel || "Member",
      departmentId: profile.departmentId || "dept-general",
      departmentName: profile.departmentName || "General",
      initials: profile.initials || profile.name?.[0]?.toUpperCase() || "U",
    };

    if (typeof window !== "undefined") {
      if (access_token) {
        localStorage.setItem("core_access_token", access_token);
        document.cookie = `core_session_token=${access_token}; path=/; max-age=604800; SameSite=Lax`;
      }
      localStorage.setItem("core_user_profile", JSON.stringify(authUser));
      localStorage.setItem("auth_provider", "backend");
      document.cookie = `core_session_role=${profile.role}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `core_session_user=${encodeURIComponent(JSON.stringify({ id: authUser.id, email: authUser.email, role: authUser.role, name: authUser.name }))}; path=/; max-age=604800; SameSite=Lax`;
      sessionStorage.removeItem("active_login_attempt");
    }

    setUser(authUser);
    setToken(access_token);
    setError(null);
    setLoading(false);

    return authUser;
  };

  const loginWithFirebase = async (fbUser: FirebaseUser): Promise<void> => {
    const base = getApiCandidates()[0];
    if (!base) throw new Error("CORE API URL is not configured.");
    const response = await fetch(`${base}/auth/firebase-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: await fbUser.getIdToken() }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Unable to create a secure CORE session.");
    }
    const session = await response.json();
    const profile = session.profile as AuthUser;
    if (typeof window !== "undefined") {
      localStorage.setItem("core_access_token", session.access_token);
      localStorage.setItem("core_user_profile", JSON.stringify(profile));
      localStorage.setItem("auth_provider", "firebase");
      document.cookie = `core_session_token=${session.access_token}; path=/; max-age=3600; SameSite=Lax`;
      document.cookie = `core_session_role=${profile.role}; path=/; max-age=3600; SameSite=Lax`;
    }
    setUser(profile);
    setToken(session.access_token);
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    // Restore backend session from localStorage on page load / refresh.
    // Also re-sets all session cookies so server-side API routes (e.g. /executive/api)
    // can authenticate requests after a page refresh.
    if (typeof window !== "undefined") {
      const savedProfile = localStorage.getItem("core_user_profile");
      const savedToken = localStorage.getItem("core_access_token");
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setUser(parsed);
          setToken(savedToken);
          document.cookie = `core_session_role=${parsed.role}; path=/; max-age=604800; SameSite=Lax`;
          if (savedToken) {
            document.cookie = `core_session_token=${savedToken}; path=/; max-age=604800; SameSite=Lax`;
            document.cookie = `core_session_user=${encodeURIComponent(JSON.stringify({ id: parsed.id, email: parsed.email, role: parsed.role, name: parsed.name }))}; path=/; max-age=604800; SameSite=Lax`;
          }
          setLoading(false);
        } catch {
          // ignore corrupted JSON
        }
      }
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser && fbUser.email) {
        try {
          await loginWithFirebase(fbUser);
        } catch (err: any) {
          console.warn("Firebase email lookup failed:", err.message || err);
          const isActiveAttempt = typeof window !== "undefined" && sessionStorage.getItem("active_login_attempt") === "true";
          if (isActiveAttempt) {
            setError(err.message || "Your Firebase account is not linked to any employee record.");
          }
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("active_login_attempt");
          }
          setUser(null);
          setToken(null);
        }
      } else {
        // If not logged into Firebase, check if we have a standalone backend session
        const authProvider = typeof window !== "undefined" ? localStorage.getItem("auth_provider") : null;
        if (authProvider === "firebase") {
          setUser(null);
          setToken(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("core_access_token");
            localStorage.removeItem("core_user_profile");
            localStorage.removeItem("auth_provider");
            document.cookie = "core_session_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(firebaseAuth);
    } catch {
      // ignore
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("core_access_token");
      localStorage.removeItem("core_user_profile");
      localStorage.removeItem("core_session_token");
      localStorage.removeItem("core_session_user");
      localStorage.removeItem("auth_provider");
      document.cookie = "core_session_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "core_session_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "core_session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    setUser(null);
    setFirebaseUser(null);
    setToken(null);
    setError(null);
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, firebaseUser, token, loading, error, logout, loginWithBackend } },
    children
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
