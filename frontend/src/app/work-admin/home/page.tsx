import { SetupWorkspacePage } from "@/components/setup-workspace-page";

export default function WorkAdminHomePage() {
  return (
    <SetupWorkspacePage
      eyebrow="Work admin workspace"
      title="Intake, routing, and approvals"
      description="Work admins control incoming requests, routing decisions, approval queues, escalations, and operational audit trails."
      primaryAction="Build intake and routing first"
      focusItems={[
        "Capture structured work requests.",
        "Route requests to department heads or owners.",
        "Process approvals with required decision reasons.",
      ]}
    />
  );
}
