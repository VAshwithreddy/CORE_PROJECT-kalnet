"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DetailDrawer, DrawerField, DrawerSection } from "@/components/detail-drawer";
import { EmployeeShell } from "@/components/employee-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";
import { TextInput, TextArea, SelectInput } from "@/components/form-controls";
import { useAuth } from "@/lib/auth";
import { createRequest, deleteRequest, getRequests } from "@/lib/api";

type RequestType = "IT Support" | "HR" | "Access" | "Time Off";
type RequestItem = {
  id: string;
  title: string;
  type: RequestType;
  description: string;
  submittedBy: string;
  status: BadgeStatus;
  statusLabel: string;
  submitted: string;
  updated: string;
  assignee: string;
  isClosed: boolean;
};

const columns: DataTableColumn<RequestItem>[] = [
  {
    key: "id",
    header: "ID",
    sortable: true,
    minWidth: "100px",
    render: (row) => <strong>{row.id}</strong>,
  },
  {
    key: "isClosed",
    header: "Lifecycle",
    sortable: true,
    render: (row) => <span>{row.isClosed ? "Closed" : "Open"}</span>,
  },
  {
    key: "title",
    header: "Title",
    sortable: true,
    minWidth: "240px",
    render: (row) => (
      <div>
        <span>{row.title}</span>
        <div style={{ color: "var(--core-text-subtle)", fontSize: "var(--core-text-xs)", marginTop: 3 }}>
          {row.type}
        </div>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <StatusBadge status={row.status} size="sm" label={row.statusLabel} />,
  },
  { key: "submitted", header: "Submitted", sortable: true },
  { key: "assignee", header: "Assignee", sortable: true },
];

const filterSelectStyle = { height: 36, minWidth: 132 } as const;

function toRequestItem(request: any): RequestItem {
  const isClosed = request.status === "resolved" || request.status === "rejected";
  const status = request.status === "approved" ? "approved" : request.status === "resolved" ? "completed" : request.status === "rejected" ? "blocked" : "waiting";
  const statusLabel = request.status === "pending" ? "Pending Approval" : request.status === "in_review" ? "In Review" : request.status === "resolved" ? "Resolved / Closed" : request.status === "rejected" ? "Rejected / Closed" : request.status?.replace("_", " ") || "Pending Approval";
  return {
    id: String(request.id), title: request.title, type: request.type as RequestType, description: request.description,
    submittedBy: request.requester_name, status, statusLabel, submitted: new Date(request.created_at).toLocaleDateString(),
    updated: new Date(request.updated_at).toLocaleDateString(), assignee: request.assignee_name || request.department_name || "Unassigned", isClosed,
  };
}

export default function RequestsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("Details");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [mounted, setMounted] = useState(false);

  // New Request Form State
  const [formType, setFormType] = useState<RequestType>("IT Support");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");

  useEffect(() => {
    setMounted(true);

    // Check for ?new=true query param (SSR safe)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "true") {
        setIsCreating(true);
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, []);

  const loadRequests = useCallback(async () => {
    if (!token) return;
    const data = await getRequests(token);
    setRequests((Array.isArray(data) ? data : []).map(toRequestItem));
  }, [token]);

  useEffect(() => {
    void loadRequests().catch(() => setNotice("Requests could not be loaded. Please refresh and try again."));
    const interval = window.setInterval(() => void loadRequests(), 20_000);
    const refreshOnFocus = () => { if (!document.hidden) void loadRequests(); };
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [loadRequests]);

  const requestTypes = useMemo(
    () => Array.from(new Set(requests.map((r) => r.type))),
    [requests]
  );

  const filteredRequests = useMemo(
    () =>
      requests.filter((r) => {
        const matchesStatus = statusFilter === "all" || r.statusLabel === statusFilter;
        const matchesType = typeFilter === "all" || r.type === typeFilter;
        return matchesStatus && matchesType;
      }),
    [requests, statusFilter, typeFilter]
  );

  const metrics = useMemo(
    () => [
      {
        label: "Total Open",
        value: requests.filter((r) => !r.isClosed).length,
      },
      {
        label: "Pending Approval",
        value: requests.filter((r) => r.status === "waiting").length,
      },
      {
        label: "Recently Closed",
        value: requests.filter((r) => r.isClosed).length,
      },
    ],
    [requests]
  );

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedRequest(null);
  };

  const closeDrawer = () => {
    setSelectedRequest(null);
    setIsCreating(false);
    // Reset form fields
    setFormTitle("");
    setFormDesc("");
    setFormType("IT Support");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDesc.trim()) {
      alert("Please fill out all required fields.");
      return;
    }
    try {
      const created = await createRequest({ type: formType, title: formTitle, description: formDesc }, token || undefined);
      const request = toRequestItem(created);
      setRequests((items) => [request, ...items.filter((item) => item.id !== request.id)]);
      void loadRequests().catch(() => undefined);
      setNotice("Your request was submitted and is now pending approval.");
      closeDrawer();
      setTimeout(() => setNotice(""), 5000);
    } catch {
      setNotice("Your request could not be submitted. Please try again.");
    }
  };

  const handleWithdraw = async (request: RequestItem) => {
    if (!window.confirm(`Withdraw "${request.title}"? This cannot be undone.`)) return;
    try {
      await deleteRequest(request.id, token || undefined);
      setRequests((items) => items.filter((item) => item.id !== request.id));
      setSelectedRequest(null);
      setNotice("Your request was withdrawn.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to withdraw this request.");
    }
  };

  if (!mounted) {
    return (
      <EmployeeShell activePath="/employee/requests">
        <PageHeader
          title="My Requests"
          description="Track and manage your IT, HR, and facility requests."
          breadcrumbs={[
            { label: "Employee", href: "/employee/home" },
            { label: "Requests" },
          ]}
        />
        <div style={{ padding: 40, textAlign: "center", color: "var(--core-text-subtle)" }}>
          Loading requests...
        </div>
      </EmployeeShell>
    );
  }

  return (
    <EmployeeShell activePath="/employee/requests">
      <PageHeader
        title="My Requests"
        description="Track and manage your IT, HR, and facility requests."
        breadcrumbs={[
          { label: "Employee", href: "/employee/home" },
          { label: "Requests" },
        ]}
        primaryAction={{
          label: "New Request",
          onClick: handleCreateNew,
        }}
      />

      {notice && (
        <div className="alert-strip alert-strip--success" role="status" style={{ marginBottom: 24 }}>
          <span>{notice}</span>
        </div>
      )}

      <div className="core-grid" style={{ marginBottom: 24 }}>
        {metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>

      <DataTable
        title="Request History"
        columns={columns}
        rows={filteredRequests}
        rowKey={(row) => row.id}
        filtersSlot={
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <label className="form-label">
              Type
              <select
                className="form-select"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                style={filterSelectStyle}
              >
                <option value="all">All</option>
                {requestTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-label">
              Status
              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                style={filterSelectStyle}
              >
                <option value="all">All</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="In Review">In Review</option>
                <option value="Approved">Approved</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected / Closed">Rejected / Closed</option>
              </select>
            </label>
          </div>
        }
        rowActions={(row) => [
          {
            label: "View Details",
            onClick: () => {
              setSelectedRequest(row);
              setActiveTab("Details");
            },
          },
          ...(row.status === "waiting" && !row.isClosed ? [{ label: "Withdraw Request", onClick: () => void handleWithdraw(row) }] : []),
        ]}
        emptyState={{
          title: "No requests found",
          body: "You don't have any requests matching these filters.",
        }}
      />

      <DetailDrawer
        isOpen={Boolean(selectedRequest) || isCreating}
        onClose={closeDrawer}
        title={isCreating ? "New Request" : selectedRequest?.title ?? "Request"}
        subtitle={isCreating ? "Fill out the details below" : selectedRequest?.id}
        status={
          !isCreating && selectedRequest ? (
            <StatusBadge status={selectedRequest.status} label={selectedRequest.statusLabel} />
          ) : undefined
        }
        tabs={isCreating ? [] : ["Details", "Activity"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        footerRight={
          isCreating ? (
            <>
              <button type="button" className="core-button" onClick={closeDrawer}>
                Cancel
              </button>
              <button
                type="button"
                className="core-button core-button-primary"
                onClick={handleSubmit}
              >
                Submit Request
              </button>
            </>
          ) : (
            <>
              {selectedRequest?.status === "waiting" && !selectedRequest.isClosed && (
                <button type="button" className="core-button" onClick={() => void handleWithdraw(selectedRequest)}>
                  Withdraw Request
                </button>
              )}
              <button type="button" className="core-button" onClick={closeDrawer}>
                Close
              </button>
            </>
          )
        }
      >
        {isCreating && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
            <SelectInput
              label="Request Type"
              value={formType}
              onChange={(e) => setFormType(e.target.value as RequestType)}
              options={[
                { value: "IT Support", label: "IT Support" },
                { value: "HR", label: "HR / People Ops" },
                { value: "Access", label: "System Access" },
                { value: "Time Off", label: "Time Off" },
              ]}
              required
            />
            <TextInput
              label="Summary"
              placeholder="Brief title for your request"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
            />
            <TextArea
              label="Description"
              placeholder="Provide as much detail as possible..."
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={6}
              required
            />
          </form>
        )}

        {!isCreating && selectedRequest && activeTab === "Details" && (
          <>
            <DrawerSection title="Request Information">
              <DrawerField label="Type" value={selectedRequest.type} />
              <DrawerField label="Submitted" value={selectedRequest.submitted} />
              <DrawerField label="Last Updated" value={selectedRequest.updated} />
              <DrawerField label="Assignee" value={selectedRequest.assignee} />
            </DrawerSection>
            <DrawerSection title="Description">
              <p style={{ margin: 0, color: "var(--core-text)", lineHeight: 1.5 }}>
                {selectedRequest.description}
              </p>
            </DrawerSection>
          </>
        )}

        {!isCreating && selectedRequest && activeTab === "Activity" && (
          <DrawerSection title="Recent Activity">
            <DrawerField label="Status Changed" value={`Updated to ${selectedRequest.statusLabel} ${selectedRequest.updated.toLowerCase()}`} />
            <DrawerField label="System Note" value="No further action is required from you at this time." />
          </DrawerSection>
        )}
      </DetailDrawer>
    </EmployeeShell>
  );
}
