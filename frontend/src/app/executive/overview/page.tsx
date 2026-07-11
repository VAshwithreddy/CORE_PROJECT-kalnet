import { SetupWorkspacePage } from "@/components/setup-workspace-page";

export default function ExecutiveOverviewPage() {
  return (
    <SetupWorkspacePage
      eyebrow="Executive workspace"
      title="Organization-wide visibility"
      description="Executives should see department health, project portfolio status, top risks, blockers, and decision queues."
      primaryAction="Build after the MVP workflow is stable"
      focusItems={[
        "Summarize department performance.",
        "Surface risks and overdue escalations.",
        "Link every metric back to evidence.",
      ]}
    />
  );
}
