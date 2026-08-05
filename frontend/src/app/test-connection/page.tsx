"use client";

import { useEffect, useState } from "react";
import { getAssignments } from "@/lib/api";

export default function TestConnectionPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

 const TEST_TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjliMjM0NGFmLWNiZWItNGIyNi05ZWRkLWE0ZTYzYzRhZDk5YiIsInR5cCI6IkpXVCJ9.eyJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc4NTMwNjAyOX1dLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwiYXBwX3JvbGUiOiJlbXBsb3llZSIsImF1ZCI6WyJhdXRoZW50aWNhdGVkIl0sImRlcGFydG1lbnRfaWQiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMDEiLCJlbWFpbCI6InJvaGFuLm1laHRhQGthbG5ldC5kZW1vIiwiZXhwIjoxNzg1MzA5NjI5LCJpYXQiOjE3ODUzMDYwMjksImlzX2Fub255bW91cyI6ZmFsc2UsImlzcyI6Imh0dHBzOi8vamdwa2x3bHp4dmxpc2lrdGdrenUuc3VwYWJhc2UuY28vYXV0aC92MSIsInBob25lIjoiIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJzZXNzaW9uX2lkIjoiZDEyNDg0YTUtZjhiNS00MjhhLWI5MGYtZDUwNGNmMGI2MTY2Iiwic3ViIjoiMDM4NzE3OTktOGM3Ny00ODIxLTg5MjItNTM5ODBlM2E4NjkxIiwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX19.C4-yTROfbfrZXsNFtzpgy4LwGM3iU__Q_-PgwdZRENREbwZvidUF9k0ReTyW-2YPV4k0Y3MFb3rV1UWHJFr0yQ";

  useEffect(() => {
    getAssignments(TEST_TOKEN)
      .then((res) => setData(res))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Real Backend Connection Test</h1>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      {!data && !error && <p>Loading...</p>}
    </div>
  );
}
