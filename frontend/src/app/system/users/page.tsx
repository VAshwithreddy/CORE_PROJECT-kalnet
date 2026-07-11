import { SetupWorkspacePage } from "@/components/setup-workspace-page";

export default function SystemUsersPage() {
  return (
    <SetupWorkspacePage
      eyebrow="System admin workspace"
      title="Users, roles, and permissions"
      description="System admins manage user accounts, role assignments, permission changes, service accounts, settings, and global audit history."
      primaryAction="Build user and role management after auth"
      focusItems={[
        "Invite, activate, and deactivate users.",
        "Assign roles and departments.",
        "Audit high-risk permission changes.",
      ]}
    />
  );
}
