"use client";

import { useEffect, useState } from "react";
import { EmployeeShell } from "@/components/employee-shell";
import { PageHeader } from "@/components/page-header";
import { TextInput, TextArea, SelectInput } from "@/components/form-controls";
import { useAuth } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";

type Profile = {
  first_name: string;
  last_name: string;
  department?: string | null;
  title?: string | null;
  preferred_name?: string | null;
  pronouns?: string | null;
  mobile_phone?: string | null;
  personal_email?: string | null;
  bio?: string | null;
  time_zone?: string | null;
};

type ProfileForm = {
  preferred_name: string;
  pronouns: string;
  mobile_phone: string;
  personal_email: string;
  bio: string;
  time_zone: string;
};

const EMPTY_FORM: ProfileForm = {
  preferred_name: "",
  pronouns: "",
  mobile_phone: "",
  personal_email: "",
  bio: "",
  time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
};

function toForm(profile: Profile): ProfileForm {
  return {
    preferred_name: profile.preferred_name || profile.first_name || "",
    pronouns: profile.pronouns || "",
    mobile_phone: profile.mobile_phone || "",
    personal_email: profile.personal_email || "",
    bio: profile.bio || "",
    time_zone: profile.time_zone || EMPTY_FORM.time_zone,
  };
}

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    apiClient<Profile>("/api/v1/me/profile", { token })
      .then((data) => {
        setProfile(data);
        setForm(toForm(data));
      })
      .catch(() => setError("We couldn't load your profile details. Please refresh and try again."));
  }, [token]);

  const saveProfile = async (updates: Partial<ProfileForm>) => {
    if (!token || Object.keys(updates).length === 0) return;
    setIsSaving(true);
    setError("");
    try {
      const saved = await apiClient<Profile>("/api/v1/me/profile", {
        method: "PATCH",
        token,
        body: JSON.stringify(updates),
      });
      setProfile(saved);
      setForm(toForm(saved));
      setNotice("Changes saved.");
      window.setTimeout(() => setNotice(""), 2500);
    } catch {
      setError("Your changes could not be saved. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = <K extends keyof ProfileForm>(field: K, value: ProfileForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    void saveProfile(form);
  };

  const manager = "Managed by HR";
  const location = "Remote";
  const displayName = profile?.preferred_name || user?.name || "";

  return (
    <EmployeeShell activePath="/employee/profile">
      <PageHeader
        title="My Profile"
        description="Your changes save as soon as you leave a field, and appear across your employee workspace immediately."
        breadcrumbs={[
          { label: "Employee", href: "/employee/home" },
          { label: "Profile" },
        ]}
      />

      {notice && <div className="alert-strip alert-strip--success" role="status" style={{ marginBottom: 24 }}>{notice}</div>}
      {error && <div className="alert-strip alert-strip--danger" role="alert" style={{ marginBottom: 24 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 1fr) 2fr", gap: "24px", alignItems: "start" }}>
        <div className="core-panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: "var(--core-text-lg)", marginBottom: "8px" }}>Official Details</h2>
          <p style={{ color: "var(--core-text-muted)", fontSize: "var(--core-text-sm)", margin: "-8px 0 16px" }}>
            These details are managed by HR. If something is incorrect, please submit an HR request.
          </p>
          <TextInput label="Legal Name" value={user?.name || ""} readOnly disabled />
          <TextInput label="Employee ID" value={user?.id || ""} readOnly disabled />
          <TextInput label="Job Title" value={profile?.title || user?.roleLabel || ""} readOnly disabled />
          <TextInput label="Department" value={profile?.department || user?.departmentName || ""} readOnly disabled />
          <TextInput label="Manager" value={manager} readOnly disabled />
          <TextInput label="Work Location" value={location} readOnly disabled />
        </div>

        <div className="core-panel">
          <h2 style={{ fontSize: "var(--core-text-lg)", marginBottom: "8px" }}>Personal Preferences</h2>
          <p style={{ color: "var(--core-text-muted)", fontSize: "var(--core-text-sm)", margin: "-8px 0 24px" }}>
            Update your contact preferences and how colleagues see you in CORE.
          </p>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <TextInput label="Preferred Name" value={form.preferred_name} onChange={(event) => updateField("preferred_name", event.target.value)} onBlur={() => void saveProfile({ preferred_name: form.preferred_name })} placeholder={displayName || undefined} />
              <SelectInput label="Pronouns" value={form.pronouns} onChange={(event) => { updateField("pronouns", event.target.value); void saveProfile({ pronouns: event.target.value }); }} options={[{ value: "", label: "Prefer not to say" }, { value: "she/her", label: "She / Her" }, { value: "he/him", label: "He / Him" }, { value: "they/them", label: "They / Them" }, { value: "other", label: "Other" }]} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <TextInput label="Mobile Phone" type="tel" value={form.mobile_phone} onChange={(event) => updateField("mobile_phone", event.target.value)} onBlur={() => void saveProfile({ mobile_phone: form.mobile_phone })} />
              <TextInput label="Personal Email" type="email" value={form.personal_email} onChange={(event) => updateField("personal_email", event.target.value)} onBlur={() => void saveProfile({ personal_email: form.personal_email })} />
            </div>
            <TextArea label="About Me" value={form.bio} onChange={(event) => updateField("bio", event.target.value)} onBlur={() => void saveProfile({ bio: form.bio })} rows={4} maxLength={2000} />
            <TextInput label="Time Zone" value={form.time_zone} onChange={(event) => updateField("time_zone", event.target.value)} onBlur={() => void saveProfile({ time_zone: form.time_zone })} helper="Use an IANA name, for example Asia/Kolkata or America/New_York." />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button type="submit" className="core-button core-button-primary" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save all changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </EmployeeShell>
  );
}
