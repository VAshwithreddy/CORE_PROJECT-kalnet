// NOTE: Supabase direct auth is no longer used.
// Authentication is handled exclusively via Firebase Auth + FastAPI JWT (see @/lib/auth.ts).
// This file is preserved for reference and build compatibility only.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export type SupabaseSessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  departmentId: string;
  departmentName: string;
  initials: string;
};

export async function signInWithEmail(
  email: string,
  pass: string
): Promise<{ success: boolean; user?: SupabaseSessionUser; error?: string }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { success: false, error: "Supabase configuration is missing." };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password: pass }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error_description || data.msg || data.message || "Supabase authentication failed.",
      };
    }

    const user: SupabaseSessionUser = {
      id: data.user?.id || "supa-user",
      name: data.user?.user_metadata?.full_name || email.split("@")[0],
      email: data.user?.email || email,
      role: data.user?.user_metadata?.role || "employee",
      roleLabel: "Member",
      departmentId: data.user?.user_metadata?.department_id || "",
      departmentName: data.user?.user_metadata?.department_name || "",
      initials: (email[0] || "U").toUpperCase(),
    };

    return { success: true, user };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to communicate with Supabase Auth.",
    };
  }
}

export async function signInWithGoogle(): Promise<{ error?: string }> {
  if (!SUPABASE_URL) {
    return { error: "Supabase URL is not configured." };
  }

  const redirectUri = typeof window !== "undefined" ? window.location.origin + "/login/oauth/callback" : "";
  const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(
    redirectUri
  )}`;
  if (typeof window !== "undefined") {
    window.location.href = authUrl;
  }
  return {};
}

export async function resolveSessionUser(session?: any): Promise<SupabaseSessionUser | null> {
  if (!session) return null;
  const email = session?.user?.email;
  if (!email) return null;

  return {
    id: session.user.id || "supa-user",
    name: session.user.user_metadata?.full_name || email.split("@")[0],
    email,
    role: session.user.user_metadata?.role || "employee",
    roleLabel: "Member",
    departmentId: session.user.user_metadata?.department_id || "",
    departmentName: session.user.user_metadata?.department_name || "",
    initials: (email[0] || "U").toUpperCase(),
  };
}

export async function signOut(): Promise<{ error?: string }> {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
    } catch {
      // Ignore network errors on signout
    }
  }
  return {};
}
