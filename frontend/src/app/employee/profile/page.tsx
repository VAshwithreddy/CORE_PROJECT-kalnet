"use client";

import { useState, useEffect } from "react";
import { EmployeeShell } from "@/components/employee-shell";
import { PageHeader } from "@/components/page-header";
import { TextInput, TextArea, SelectInput } from "@/components/form-controls";
import { getCurrentUser, subscribeSession, type CoreUser } from "@/lib/mock-session";
import { getTeamMembers } from "@/lib/mock-db";

export default function ProfilePage() {
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [currentUser, setCurrentUser] = useState<CoreUser>(getCurrentUser());

  useEffect(() => {
    return subscribeSession((user) => setCurrentUser(user));
  }, []);

  // Find manager from team data
  const teamMembers = getTeamMembers();
  const selfMember = teamMembers.find((m) => m.id === currentUser.id);
  const manager = selfMember?.manager ?? "—";
  const location = selfMember?.location ?? "Remote";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setNotice("Your profile changes have been saved successfully.");
      // clear notice after 5 seconds
      setTimeout(() => setNotice(""), 5000);
    }, 800);
  };

  return (
    <EmployeeShell activePath="/employee/profile">
      <PageHeader
        title="My Profile"
        description="Manage your personal information and preferences."
        breadcrumbs={[
          { label: "Employee", href: "/employee/home" },
          { label: "Profile" },
        ]}
      />

      {notice && (
        <div className="alert-strip alert-strip--success" role="status" style={{ marginBottom: 24 }}>
          <span>{notice}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 1fr) 2fr", gap: "24px", alignItems: "start" }}>
        {/* Read-Only Admin Section */}
        <div className="core-panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: "var(--core-text-lg)", marginBottom: "8px" }}>Official Details</h2>
          <p style={{ color: "var(--core-text-muted)", fontSize: "var(--core-text-sm)", margin: "-8px 0 16px" }}>
            These details are managed by HR. If something is incorrect, please submit an HR Request.
          </p>

          <TextInput label="Legal Name" value={currentUser.name} readOnly disabled />
          <TextInput label="Employee ID" value={currentUser.id} readOnly disabled />
          <TextInput label="Job Title" value={currentUser.roleLabel} readOnly disabled />
          <TextInput label="Department" value={currentUser.departmentName} readOnly disabled />
          <TextInput label="Manager" value={manager} readOnly disabled />
          <TextInput label="Work Location" value={location} readOnly disabled />
        </div>

        {/* Editable Profile Form */}
        <div className="core-panel">
          <h2 style={{ fontSize: "var(--core-text-lg)", marginBottom: "8px" }}>Personal Preferences</h2>
          <p style={{ color: "var(--core-text-muted)", fontSize: "var(--core-text-sm)", margin: "-8px 0 24px" }}>
            Update how you appear to others across CORE and customize your contact methods.
          </p>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <TextInput label="Preferred Name" defaultValue="Jane" />
              <SelectInput
                label="Pronouns"
                options={[
                  { value: "she/her", label: "She / Her" },
                  { value: "he/him", label: "He / Him" },
                  { value: "they/them", label: "They / Them" },
                  { value: "other", label: "Other / Prefer not to say" },
                ]}
                defaultValue="she/her"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <TextInput label="Mobile Phone" type="tel" defaultValue="+1 (555) 123-4567" />
              <TextInput label="Personal Email" type="email" defaultValue="jane.doe.personal@example.com" />
            </div>

            <TextArea
              label="About Me"
              defaultValue="Frontend specialist with a passion for accessibility and design systems. Feel free to reach out for a code review or to chat about React!"
              rows={4}
            />

            <SelectInput
              label="Time Zone"
              options={[
                { value: "pt", label: "Pacific Time (PT)" },
                { value: "mt", label: "Mountain Time (MT)" },
                { value: "ct", label: "Central Time (CT)" },
                { value: "et", label: "Eastern Time (ET)" },
              ]}
              defaultValue="pt"
            />

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button
                type="submit"
                className="core-button core-button-primary"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </EmployeeShell>
  );
}
