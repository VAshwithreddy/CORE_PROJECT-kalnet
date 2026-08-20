import { NextRequest, NextResponse } from "next/server";
import { exec, execSync } from "child_process";
import path from "path";
import { getExecutiveDemoData } from "./demo-data";

type ExecutiveAction = "overview" | "departments" | "portfolio" | "risks" | "digests" | "reports";
const LIVE_QUERY_TIMEOUT_MS = 4500;

import fs from "fs";

let cachedPythonCommand: string | null = null;

function getPythonCommand() {
  if (cachedPythonCommand) {
    return cachedPythonCommand;
  }

  if (process.env.PYTHON_BIN) {
    cachedPythonCommand = process.env.PYTHON_BIN;
    return cachedPythonCommand;
  }

  // Auto-detect backend virtual environment python (has psycopg2)
  const venvCandidates = [
    path.join(process.cwd(), "..", "backend", ".venv", "Scripts", "python.exe"),
    path.join(process.cwd(), "..", "backend", ".venv", "bin", "python"),
  ];
  for (const venvPython of venvCandidates) {
    if (fs.existsSync(venvPython)) {
      cachedPythonCommand = `"${venvPython}"`;
      console.log("[Executive API] Using venv python:", venvPython);
      return cachedPythonCommand;
    }
  }

  if (process.platform === "win32") {
    try {
      execSync("py -3 --version", { stdio: "ignore" });
      cachedPythonCommand = "py -3";
    } catch {
      try {
        execSync("python --version", { stdio: "ignore" });
        cachedPythonCommand = "python";
      } catch {
        cachedPythonCommand = "python";
      }
    }
  } else {
    try {
      execSync("python3 --version", { stdio: "ignore" });
      cachedPythonCommand = "python3";
    } catch {
      try {
        execSync("python --version", { stdio: "ignore" });
        cachedPythonCommand = "python";
      } catch {
        cachedPythonCommand = "python3";
      }
    }
  }

  return cachedPythonCommand;
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
