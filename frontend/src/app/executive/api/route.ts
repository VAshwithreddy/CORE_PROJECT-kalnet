import { NextRequest, NextResponse } from "next/server";
import {
  fetchOverview,
  fetchDepartments,
  fetchPortfolio,
  fetchRisks,
  fetchDigests,
  fetchReports,
} from "./queries";

type ExecutiveAction =
  | "overview"
  | "departments"
  | "portfolio"
  | "risks"
  | "digests"
  | "reports";

export async function GET(req: NextRequest) {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
  const sessionToken = req.cookies.get("core_session_token")?.value;
  if (!apiBase || !sessionToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const sessionResponse = await fetch(`${apiBase}/api/v1/me`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
    cache: "no-store",
  }).catch(() => null);
  if (!sessionResponse?.ok) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const session = await sessionResponse.json();
  if (!["executive", "system_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (!action) {
    return NextResponse.json({ error: "No action specified" }, { status: 400 });
  }

  const allowedActions: ExecutiveAction[] = [
    "overview",
    "departments",
    "portfolio",
    "risks",
    "digests",
    "reports",
  ];
  if (!allowedActions.includes(action as ExecutiveAction)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const requestedAction = action as ExecutiveAction;

  try {
    let data: any;
    switch (requestedAction) {
      case "overview":
        data = await fetchOverview();
        break;
      case "departments":
        data = await fetchDepartments();
        break;
      case "portfolio":
        data = await fetchPortfolio();
        break;
      case "risks":
        data = await fetchRisks();
        break;
      case "digests":
        data = await fetchDigests();
        break;
      case "reports":
        data = await fetchReports();
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const response = NextResponse.json(data);
    response.headers.set("x-core-data-source", "live-database");
    return response;
  } catch (error: any) {
    console.error(`Executive live query (${requestedAction}) failed:`, error?.message || error);
    return NextResponse.json({ error: "Executive reporting is temporarily unavailable." }, { status: 503 });
  }
}
