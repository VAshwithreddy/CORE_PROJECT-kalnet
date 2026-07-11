import { SetupWorkspacePage } from "@/components/setup-workspace-page";

export default function EmployeeHomePage() {
  return (
    <SetupWorkspacePage
      eyebrow="Employee workspace"
      title="Daily work command center"
      description="Employees should see assigned work, due dates, blockers, notifications, and quick actions to update progress."
      primaryAction="Build employee My Work first"
      focusItems={[
        "Show assignments assigned to the signed-in employee.",
        "Allow status update and progress notes.",
        "Allow the employee to raise a blocker.",
      ]}
    />
  );
}
