"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DetailDrawer, DrawerField, DrawerSection } from "@/components/detail-drawer";
import { EmployeeShell } from "@/components/employee-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { TextInput, TextArea, SelectInput } from "@/components/form-controls";
import { getRequestsBySubmitter, createRequest, subscribe, type RequestItem, type RequestType } from "@/lib/mock-db";
import { getCurrentUser, subscribeSession, type CoreUser } from "@/lib/mock-session";

const columns: DataTableColumn<RequestItem>[] = [
  {
    key: "id",
    header: "ID",
    sortable: true,
    minWidth: "100px",
    render: (row) => <strong>{row.id}</strong>,
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

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [currentUser, setCurrentUser] = useState<CoreUser>(getCurrentUser());
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
    setRequests(getRequestsBySubmitter(getCurrentUser().id));

    // Check for ?new=true query param (SSR safe)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "true") {
        setIsCreating(true);
        // Clear the query parameter so refreshing doesn't keep opening it
        window.history.replaceState(null, "", window.location.pathname);
      }
    }

    const unsubSession = subscribeSession((user) => {
      setCurrentUser(user);
      setRequests(getRequestsBySubmitter(user.id));
      setSelectedRequest(null);
      setIsCreating(false);
    });

    const unsubDb = subscribe(() => {
      setRequests(getRequestsBySubmitter(getCurrentUser().id));
    });

    return () => {
      unsubSession();
      unsubDb();
    };
  }, []);

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
        value: requests.filter((r) => r.status !== "completed" && r.status !== "approved").length,
      },
      {
        label: "Pending Approval",
        value: requests.filter((r) => r.status === "waiting").length,
      },
      {
        label: "Recently Closed",
        value: requests.filter((r) => r.status === "completed" || r.status === "approved").length,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDesc.trim()) {
      alert("Please fill out all required fields.");
      return;
    }
    createRequest({
      title: formTitle,
      type: formType,
      description: formDesc,
      submittedBy: currentUser.id,
    });
    setNotice("Your request has been submitted successfully.");
    closeDrawer();
    setTimeout(() => setNotice(""), 5000);
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
            <button type="button" className="core-button" onClick={closeDrawer}>
              Close
            </button>
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
