import { SetupWorkspacePage } from "@/components/setup-workspace-page";

export default function DepartmentHomePage() {
  return (
    <SetupWorkspacePage
      eyebrow="Department workspace"
      title="Department workload and blockers"
      description="Department heads should see team workload, active assignments, overdue work, blocked items, and quick reassignment actions."
      primaryAction="Build assignments and blockers first"
      focusItems={[
        "Create and assign work to employees.",
        "Track overdue and high-priority assignments.",
        "Resolve or escalate blockers with audit history.",
      ]}
    />
  );
}
