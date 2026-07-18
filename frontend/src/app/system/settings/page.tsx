"use client";

import { useState } from "react";
import { SystemAdminShell } from "@/components/system-admin-shell";
import { PageHeader } from "@/components/page-header";
import { TextInput, SelectInput } from "@/components/form-controls";

export default function SystemSettingsPage() {
  const [notice, setNotice] = useState("");
  const [orgName, setOrgName] = useState("CORE Platform");
  const [defaultRole, setDefaultRole] = useState("employee");
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [auditRetention, setAuditRetention] = useState("365");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice("System settings saved successfully. (Demo — changes are not persisted.)");
    setTimeout(() => setNotice(""), 5000);
  };

  return (
    <SystemAdminShell activePath="/system/settings">
      <PageHeader
        title="System Settings"
        description="Configure global system behaviour, defaults, and security policies."
      />

      {notice && (
        <div className="alert-strip alert-strip--success" style={{ marginBottom: 24 }}>
          <span>{notice}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>
        <div className="core-panel">
          <h2 style={{ fontSize: "var(--core-text-lg)", marginBottom: 16 }}>Organisation</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <TextInput
              label="Organisation Name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
            <SelectInput
              label="Default Role for New Users"
              value={defaultRole}
              onChange={(e) => setDefaultRole(e.target.value)}
              options={[
                { value: "employee", label: "Employee" },
                { value: "department", label: "Department Head" },
                { value: "work-admin", label: "Work Admin" },
              ]}
            />
          </div>
        </div>

        <div className="core-panel">
          <h2 style={{ fontSize: "var(--core-text-lg)", marginBottom: 16 }}>Security Policies</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <TextInput
              label="Session Timeout (minutes)"
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
              type="number"
            />
            <TextInput
              label="Audit Log Retention (days)"
              value={auditRetention}
              onChange={(e) => setAuditRetention(e.target.value)}
              type="number"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" className="core-button core-button-primary">
            Save Settings
          </button>
          <button type="button" className="core-button core-button-ghost" onClick={() => setNotice("")}>
            Cancel
          </button>
        </div>
      </form>
    </SystemAdminShell>
  );
}
