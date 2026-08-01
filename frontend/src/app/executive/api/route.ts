import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (!action) {
    return NextResponse.json({ error: "No action specified" }, { status: 400 });
  }

  // Allowed action queries to prevent command injection
  const allowedActions = ["overview", "departments", "portfolio", "risks", "digests", "reports"];
  if (!allowedActions.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const scriptPath = path.join(process.cwd(), "src", "app", "executive", "db_query.py");

  return new Promise<NextResponse>((resolve) => {
    exec(`python "${scriptPath}" ${action}`, (error, stdout, stderr) => {
      if (error) {
        resolve(NextResponse.json({ error: error.message, stderr }, { status: 500 }));
        return;
      }
      try {
        const data = JSON.parse(stdout);
        resolve(NextResponse.json(data));
      } catch (parseError) {
        resolve(NextResponse.json({ error: "Failed to parse JSON from query script", stdout }, { status: 500 }));
      }
    });
  });
}
