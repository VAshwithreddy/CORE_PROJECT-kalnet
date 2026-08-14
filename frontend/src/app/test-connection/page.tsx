"use client";

import { useState } from "react";
import { loginToBackend, getAssignments, getPeople, getEmployeeDashboard } from "@/lib/api";

export default function TestConnectionPage() {
  const [email, setEmail] = useState("rohan.mehta@kalnet.demo");
  const [password, setPassword] = useState("123456");
  const [dataType, setDataType] = useState<"assignments" | "people" | "dashboard">("assignments");
  const [data, setData] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setData(null);
    setLoading(true);

    try {
      // 1. Authenticate with backend database via credentials
      const authResponse = await loginToBackend(email, password);
      const accessToken = authResponse.access_token;
      setToken(accessToken);

      // 2. Fetch selected data from Supabase PostgreSQL via real endpoints
      let result;
      if (dataType === "assignments") {
        result = await getAssignments(accessToken);
      } else if (dataType === "people") {
        result = await getPeople(accessToken);
      } else {
        result = await getEmployeeDashboard(accessToken);
      }
      setData(result);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch data from Supabase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "60px auto", padding: "30px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#ffffff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", padding: "40px", border: "1px solid #f1f5f9" }}>
        <h1 style={{ margin: "0 0 10px", fontSize: "28px", color: "#0f172a", fontWeight: 800 }}>Real Supabase Connection Test</h1>
        <p style={{ margin: "0 0 30px", color: "#64748b", fontSize: "15px" }}>
          Enter your database credentials below to retrieve a real JWT token and query live Supabase PostgreSQL data.
        </p>

        <form onSubmit={handleFetch} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>EMAIL ADDRESS</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>DATA TO QUERY</label>
            <div style={{ display: "flex", gap: "12px" }}>
              {(["assignments", "people", "dashboard"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDataType(type)}
                  style={{
                    flex: 1, padding: "12px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", border: dataType === type ? "2px solid #0f766e" : "1px solid #cbd5e1",
                    background: dataType === type ? "#f0fdfa" : "#ffffff", color: dataType === type ? "#0f766e" : "#475569", transition: "all 0.15s"
                  }}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "14px", background: "#0f766e", color: "#ffffff", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 12px rgba(15, 118, 110, 0.15)", transition: "all 0.15s", marginTop: "10px"
            }}
          >
            {loading ? "Connecting & Fetching..." : "Connect & Fetch Real Supabase Data →"}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: "24px", padding: "16px", background: "#fef2f2", borderLeft: "4px solid #ef4444", borderRadius: "8px" }}>
            <span style={{ fontSize: "14px", color: "#b91c1c", fontWeight: 600 }}>Error: {error}</span>
          </div>
        )}

        {token && (
          <div style={{ marginTop: "24px", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <span style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>ACTIVE JWT ACCESS TOKEN</span>
            <code style={{ fontSize: "11px", wordBreak: "break-all", color: "#0f766e" }}>{token}</code>
          </div>
        )}

        {data && (
          <div style={{ marginTop: "24px" }}>
            <span style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>REAL SUPABASE RECORDS (JSON)</span>
            <pre style={{ margin: 0, padding: "20px", background: "#0f172a", color: "#38bdf8", borderRadius: "12px", fontSize: "13px", overflowX: "auto", border: "1px solid #1e293b", maxHeight: "400px" }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
