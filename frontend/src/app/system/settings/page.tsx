"use client";

import { SystemAdminShell } from "@/components/system-admin-shell";
import { PageHeader } from "@/components/page-header";

export default function SystemSettingsPage() {
  return (
    <SystemAdminShell activePath="/system/settings">
      <PageHeader
        title="System Settings"
        description="Deployment-managed security and integration settings."
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>
        <div className="core-panel">
          <h2 style={{ fontSize: "var(--core-text-lg)", marginBottom: 12 }}>Managed Configuration</h2>
          <p>Authentication, session policies, CORS, retention, and integrations are configured through the deployment environment. This prevents untracked browser-side security changes.</p>
        </div>
        <div className="core-panel">
          <h2 style={{ fontSize: "var(--core-text-lg)", marginBottom: 12 }}>User Administration</h2>
          <p>Create users, set their role, department, and manager from the Users page. These changes are stored immediately and recorded in the audit trail.</p>
        </div>
      </div>
    </SystemAdminShell>
  );
}
