"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from "firebase/auth";
import { auth as firebaseAuth } from "./firebase";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "") + "/api/v1";

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
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  token: null,
  loading: true,
  error: null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser && fbUser.email) {

        try {
          // Step 1: Look up existing employee record in Supabase via FastAPI backend
          let lookupRes: Response;
          try {
            lookupRes = await fetch(
              `${API_URL}/auth/lookup?email=${encodeURIComponent(fbUser.email)}`
            );
          } catch (fetchErr: any) {
            throw new Error(`Unable to connect to backend server at ${API_URL}. Please ensure the FastAPI backend is running.`);
          }

          if (!lookupRes.ok) {
            const errData = await lookupRes.json().catch(() => ({}));
            throw new Error(errData.detail || `User not found (${lookupRes.status}). Your Firebase account is not linked to an employee record.`);
          }

          const profile = await lookupRes.json();

          // Step 2: Get a signed backend JWT via /auth/login
          let loginRes: Response | null = null;
          try {
            loginRes = await fetch(`${API_URL}/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: fbUser.email, password: "firebase_auth_passed" }),
            });
          } catch (err) {
            console.warn("Login token fetch failed:", err);
          }

          let access_token: string | null = null;
          if (loginRes && loginRes.ok) {
            const tokenData = await loginRes.json();
            access_token = tokenData.access_token;
            if (typeof window !== "undefined" && access_token) {
              localStorage.setItem("core_access_token", access_token);
            }
          }

          // Step 3: Populate user state from the backend profile
          setUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            roleLabel: profile.roleLabel || "Member",
            departmentId: profile.departmentId || "dept-general",
            departmentName: profile.departmentName || "General",
            initials: profile.initials || profile.name?.[0]?.toUpperCase() || "U",
          });

          setToken(access_token);

          // Step 4: Set role cookie for Next.js middleware RBAC
          if (typeof window !== "undefined") {
            document.cookie = `core_session_role=${profile.role}; path=/; max-age=604800; SameSite=Lax`;
            sessionStorage.removeItem("active_login_attempt");
          }

          setError(null);
        } catch (err: any) {
          console.warn("Auth check failed:", err.message || err);
          const isActiveAttempt = typeof window !== "undefined" && sessionStorage.getItem("active_login_attempt") === "true";
          if (isActiveAttempt) {
            setError(err.message || "Your account is not linked to an employee profile.");
          }
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("active_login_attempt");
          }
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("core_access_token");
          document.cookie = "core_session_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await firebaseSignOut(firebaseAuth);
    if (typeof window !== "undefined") {
      localStorage.removeItem("core_access_token");
      localStorage.removeItem("core_user_profile");
      localStorage.removeItem("auth_provider");
      document.cookie = "core_session_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    setUser(null);
    setToken(null);
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, firebaseUser, token, loading, error, logout } },
    children
  );
}

export function useAuth() {
  return useContext(AuthContext);
}


