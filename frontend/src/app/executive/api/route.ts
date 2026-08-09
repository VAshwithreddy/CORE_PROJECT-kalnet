import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import { getExecutiveDemoData } from "./demo-data";

type ExecutiveAction = "overview" | "departments" | "portfolio" | "risks" | "digests" | "reports";
const LIVE_QUERY_TIMEOUT_MS = 4500;

function getPythonCommand() {
  if (process.env.PYTHON_BIN) {
    return process.env.PYTHON_BIN;
  }
  if (process.platform === "win32") {
    return "py -3";
  }
  return "python3";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (!action) {
    return NextResponse.json({ error: "No action specified" }, { status: 400 });
  }

  // Allowed action queries to prevent command injection
  const allowedActions: ExecutiveAction[] = ["overview", "departments", "portfolio", "risks", "digests", "reports"];
  if (!allowedActions.includes(action as ExecutiveAction)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  const requestedAction = action as ExecutiveAction;

  const scriptPath = path.join(process.cwd(), "src", "app", "executive", "db_query.py");
  const fallback = () => {
    const response = NextResponse.json(getExecutiveDemoData(requestedAction));
    response.headers.set("x-core-data-source", "demo-fallback");
    return response;
  };

  return new Promise<NextResponse>((resolve) => {
    const command = `${getPythonCommand()} "${scriptPath}" ${requestedAction}`;
    exec(command, { timeout: LIVE_QUERY_TIMEOUT_MS }, (error, stdout, stderr) => {
      if (error) {
        console.warn("Executive live query failed; using demo fallback.", error.message, stderr);
        resolve(fallback());
        return;
      }
      try {
        const data = JSON.parse(stdout);
        if (data?.error) {
          console.warn("Executive live query returned an error; using demo fallback.", data.error);
          resolve(fallback());
          return;
        }
        resolve(NextResponse.json(data));
      } catch (parseError) {
        console.warn("Executive live query returned invalid JSON; using demo fallback.", parseError, stdout);
        resolve(fallback());
      }
    });
  });
}
