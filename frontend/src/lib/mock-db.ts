"use client";

import { type BadgeStatus } from "@/components/status-badge";

// ─── Interfaces ──────────────────────────────────────────────────────────────

export type AssignmentPriority = "Critical" | "High" | "Medium" | "Low";
export type DueBucket = "today" | "week" | "later" | "overdue";

export interface Assignment {
  id: string;
  title: string;
  project: string;
  status: BadgeStatus;
  priority: AssignmentPriority;
  dueDate: string;
  dueBucket: DueBucket;
  progress: number;
  owner: string;
  ownerId?: string;
  departmentId?: string;
  nextStep: string;
  lastUpdate: string;
  blocker: string;
  supportLink: string;
}

export type RequestType = "IT Support" | "HR" | "Time Off" | "Access";

export interface RequestItem {
  id: string;
  title: string;
  type: RequestType;
  status: BadgeStatus;
  statusLabel: string;
  submitted: string;
  updated: string;
  description: string;
  assignee: string;
  submittedBy?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  outcome: BadgeStatus;
  outcomeLabel: string;
}

export type NotificationType = "Security" | "System" | "HR" | "Assignment";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  status: BadgeStatus;
  statusLabel: string;
  date: string;
  isRead: boolean;
  actionRequired: boolean;
  recipientId?: string;
}

export type ProjectHealth = "On Track" | "At Risk" | "Off Track" | "Delivered";

export interface ProjectItem {
  id: string;
  name: string;
  status: BadgeStatus;
  statusLabel: string;
  health: ProjectHealth;
  owner: string;
  ownerId?: string;
  departmentId?: string;
  dueDate: string;
  nextMilestone: string;
  progress: number;
  blockers: number;
}

export type Availability = "Available" | "Focused" | "Limited" | "Out";
export type LoadBand = "healthy" | "full" | "overloaded";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  departmentId?: string;
  status: BadgeStatus;
  statusLabel: string;
  availability: Availability;
  loadBand: LoadBand;
  currentLoad: number;
  activeAssignments: number;
  blockers: number;
  skills: string[];
  manager: string;
  nextDelivery: string;
  location: string;
  workloadSummary: string;
}

export interface BlockerItem {
  id: string;
  title: string;
  project: string;
  owner: string;
  severity: "High" | "Medium" | "Low";
  daysBlocked: number;
  reason: string;
  departmentId?: string;
}

// ─── Default Seed Data ────────────────────────────────────────────────────────

const DEFAULT_ASSIGNMENTS: Assignment[] = [
  {
    id: "A-1023",
    title: "Update employee onboarding docs",
    project: "People Ops Refresh",
    status: "in-progress",
    priority: "High",
    dueDate: "Today, 4:00 PM",
    dueBucket: "today",
    progress: 70,
    owner: "Jane Doe",
    ownerId: "EMP-014",
    departmentId: "dept-engineering",
    nextStep: "Share draft with HR reviewer.",
    lastUpdate: "Progress note added 2 hours ago.",
    blocker: "None",
    supportLink: "Onboarding checklist",
  },
  {
    id: "A-1025",
    title: "Review Q3 marketing budget",
    project: "Q3 Planning",
    status: "waiting",
    priority: "Medium",
    dueDate: "Tomorrow, 12:00 PM",
    dueBucket: "week",
    progress: 45,
    owner: "Jane Doe",
    ownerId: "EMP-014",
    departmentId: "dept-engineering",
    nextStep: "Waiting for finance export before final review.",
    lastUpdate: "Finance owner requested one extra validation pass.",
    blocker: "Budget source file pending",
    supportLink: "Budget workbook",
  },
  {
    id: "A-1029",
    title: "Fix login button styling",
    project: "Design System 2.0",
    status: "blocked",
    priority: "Critical",
    dueDate: "Overdue by 1 day",
    dueBucket: "overdue",
    progress: 35,
    owner: "Jane Doe",
    ownerId: "EMP-014",
    departmentId: "dept-engineering",
    nextStep: "Confirm final token mapping with design system owner.",
    lastUpdate: "Blocker raised yesterday.",
    blocker: "Missing token decision for hover state",
    supportLink: "Design review notes",
  },
  {
    id: "A-1031",
    title: "Draft weekly update",
    project: "Engineering Digest",
    status: "new",
    priority: "Low",
    dueDate: "Friday, 5:00 PM",
    dueBucket: "week",
    progress: 0,
    owner: "Jane Doe",
    ownerId: "EMP-014",
    departmentId: "dept-engineering",
    nextStep: "Collect completed items from assignment history.",
    lastUpdate: "Assigned this morning.",
    blocker: "None",
    supportLink: "Weekly summary template",
  },
  {
    id: "A-1036",
    title: "Validate mobile table behavior",
    project: "CORE Frontend",
    status: "completed",
    priority: "Medium",
    dueDate: "Yesterday",
    dueBucket: "later",
    progress: 100,
    owner: "Jane Doe",
    ownerId: "EMP-014",
    departmentId: "dept-engineering",
    nextStep: "No action needed.",
    lastUpdate: "Completed after responsive QA.",
    blocker: "None",
    supportLink: "QA checklist",
  },
];

const DEFAULT_REQUESTS: RequestItem[] = [
  {
    id: "REQ-012",
    title: "Request access to CORE Staging",
    type: "Access",
    status: "waiting",
    statusLabel: "Pending Approval",
    submitted: "Yesterday",
    updated: "2 hours ago",
    description: "Need access to the staging environment for testing the new table components.",
    assignee: "IT Ops",
    submittedBy: "EMP-014",
  },
  {
    id: "REQ-015",
    title: "PTO Request: Next Friday",
    type: "Time Off",
    status: "approved",
    statusLabel: "Approved",
    submitted: "Last Week",
    updated: "Yesterday",
    description: "Taking a long weekend for a family trip.",
    assignee: "Sarah Wong",
    submittedBy: "EMP-014",
  },
  {
    id: "REQ-018",
    title: "Broken laptop keyboard",
    type: "IT Support",
    status: "in-progress",
    statusLabel: "In Review",
    submitted: "Today",
    updated: "Just now",
    description: "The spacebar has stopped working reliably.",
    assignee: "Helpdesk",
    submittedBy: "EMP-014",
  },
  {
    id: "REQ-019",
    title: "Benefits question regarding dependent care",
    type: "HR",
    status: "completed",
    statusLabel: "Resolved",
    submitted: "2 Weeks Ago",
    updated: "Last Week",
    description: "Can I change my dependent care contributions mid-year?",
    assignee: "People Ops",
    submittedBy: "EMP-014",
  },
];

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "NOT-104",
    title: "New device login detected",
    message: "A login was detected from a new device in San Francisco.",
    type: "Security",
    status: "blocked",
    statusLabel: "Critical",
    date: "10 mins ago",
    isRead: false,
    actionRequired: true,
    recipientId: "EMP-014",
  },
  {
    id: "NOT-103",
    title: "Open Enrollment starts tomorrow",
    message: "Don't forget to review your benefits for the upcoming year.",
    type: "HR",
    status: "in-progress",
    statusLabel: "Reminder",
    date: "2 hours ago",
    isRead: false,
    actionRequired: false,
    recipientId: "EMP-014",
  },
  {
    id: "NOT-102",
    title: "Assignment A-1023 updated",
    message: "Sarah Wong left a comment on your assignment.",
    type: "Assignment",
    status: "new",
    statusLabel: "Update",
    date: "Yesterday",
    isRead: true,
    actionRequired: false,
    recipientId: "EMP-014",
  },
  {
    id: "NOT-101",
    title: "Scheduled Maintenance",
    message: "CORE will be down for maintenance this Sunday from 2AM to 4AM.",
    type: "System",
    status: "waiting",
    statusLabel: "Notice",
    date: "2 days ago",
    isRead: true,
    actionRequired: false,
    recipientId: "EMP-014",
  },
];

const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: "PRJ-442",
    name: "Cloud Infrastructure Migration",
    status: "in-progress",
    statusLabel: "Active",
    health: "On Track",
    owner: "Alex Johnson",
    ownerId: "EMP-021",
    departmentId: "dept-engineering",
    dueDate: "Q3 End",
    nextMilestone: "DB Cutover (Oct 1)",
    progress: 65,
    blockers: 0,
  },
  {
    id: "PRJ-443",
    name: "Q4 Planning & Budgeting",
    status: "waiting",
    statusLabel: "Planning",
    health: "At Risk",
    owner: "Sarah Wong",
    ownerId: "EMP-055",
    departmentId: "dept-engineering",
    dueDate: "Next Friday",
    nextMilestone: "Finance Approval",
    progress: 30,
    blockers: 1,
  },
  {
    id: "PRJ-445",
    name: "Design System 2.0 Rollout",
    status: "in-progress",
    statusLabel: "Active",
    health: "Off Track",
    owner: "Jane Doe",
    ownerId: "EMP-014",
    departmentId: "dept-engineering",
    dueDate: "This Month",
    nextMilestone: "Token Mapping Sign-off",
    progress: 45,
    blockers: 3,
  },
  {
    id: "PRJ-448",
    name: "Legacy API Deprecation",
    status: "completed",
    statusLabel: "Completed",
    health: "Delivered",
    owner: "Alex Johnson",
    ownerId: "EMP-021",
    departmentId: "dept-engineering",
    dueDate: "Last Week",
    nextMilestone: "Post-Mortem Review",
    progress: 100,
    blockers: 0,
  },
  {
    id: "PRJ-450",
    name: "Mobile App Re-architecture",
    status: "new",
    statusLabel: "Scoping",
    health: "On Track",
    owner: "Maya Patel",
    ownerId: "EMP-042",
    departmentId: "dept-engineering",
    dueDate: "Q1 2025",
    nextMilestone: "Technical Spec Approval",
    progress: 10,
    blockers: 0,
  },
];

const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "EMP-014",
    name: "Jane Doe",
    role: "Frontend Engineer",
    status: "in-progress",
    statusLabel: "Active",
    availability: "Focused",
    loadBand: "full",
    currentLoad: 92,
    activeAssignments: 5,
    blockers: 1,
    skills: ["React", "Accessibility", "Design Systems"],
    manager: "Sarah Wong",
    nextDelivery: "Design system table QA",
    location: "Remote",
    workloadSummary: "Near capacity with one blocker tied to final token approval.",
  },
  {
    id: "EMP-021",
    name: "Alex Johnson",
    role: "Backend Engineer",
    status: "approved",
    statusLabel: "Available",
    availability: "Available",
    loadBand: "healthy",
    currentLoad: 64,
    activeAssignments: 3,
    blockers: 0,
    skills: ["Node.js", "Prisma", "API Design"],
    manager: "Sarah Wong",
    nextDelivery: "Report export route",
    location: "Bengaluru",
    workloadSummary: "Healthy load and ready for one additional assignment this week.",
  },
  {
    id: "EMP-033",
    name: "Maya Patel",
    role: "QA Analyst",
    status: "blocked",
    statusLabel: "Blocked",
    availability: "Limited",
    loadBand: "overloaded",
    currentLoad: 108,
    activeAssignments: 7,
    blockers: 2,
    skills: ["Playwright", "Regression", "Release QA"],
    manager: "Sarah Wong",
    nextDelivery: "Mobile regression pass",
    location: "Hyderabad",
    workloadSummary: "Overloaded because two release-blocking defects need owner decisions.",
  },
  {
    id: "EMP-045",
    name: "Omar Khan",
    role: "Product Designer",
    status: "waiting",
    statusLabel: "Waiting",
    availability: "Focused",
    loadBand: "full",
    currentLoad: 88,
    activeAssignments: 4,
    blockers: 0,
    skills: ["Research", "Prototyping", "Design Tokens"],
    manager: "Sarah Wong",
    nextDelivery: "Executive dashboard review",
    location: "Pune",
    workloadSummary: "Fully allocated until the executive dashboard review is signed off.",
  },
  {
    id: "EMP-052",
    name: "Li Chen",
    role: "Data Analyst",
    status: "archived",
    statusLabel: "Out Today",
    availability: "Out",
    loadBand: "healthy",
    currentLoad: 48,
    activeAssignments: 2,
    blockers: 0,
    skills: ["SQL", "Forecasting", "Dashboards"],
    manager: "Sarah Wong",
    nextDelivery: "Capacity model update",
    location: "Singapore",
    workloadSummary: "Out today, but current assignments are not at risk.",
  },
];

const DEFAULT_BLOCKERS: BlockerItem[] = [
  {
    id: "A-1029",
    title: "Fix login button styling",
    project: "Design System 2.0",
    owner: "Jane Doe",
    severity: "Medium",
    daysBlocked: 2,
    reason: "Missing token decision for hover state from the design team.",
    departmentId: "dept-engineering",
  },
  {
    id: "A-1042",
    title: "Database migration for auth service",
    project: "Cloud Infrastructure",
    owner: "Alex Johnson",
    severity: "High",
    daysBlocked: 5,
    reason: "Pending security review from Infosec before we can run the migration.",
    departmentId: "dept-engineering",
  },
  {
    id: "A-1055",
    title: "Finalize Q4 budget",
    project: "Q4 Planning",
    owner: "Sarah Wong",
    severity: "High",
    daysBlocked: 1,
    reason: "Awaiting final headcount numbers from HR.",
    departmentId: "dept-engineering",
  },
];

// ─── LocalStorage Management ──────────────────────────────────────────────────

const IS_CLIENT = typeof window !== "undefined";

function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (!IS_CLIENT) return defaultValue;
  try {
    const item = localStorage.getItem(`core_db_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T) {
  if (!IS_CLIENT) return;
  try {
    localStorage.setItem(`core_db_${key}`, JSON.stringify(value));
    notify();
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

// ─── Subscription Pattern ─────────────────────────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  listeners.forEach((l) => l());
}

// ─── Exported APIs ────────────────────────────────────────────────────────────

export function getAssignments(): Assignment[] {
  return loadFromStorage("assignments", DEFAULT_ASSIGNMENTS);
}

export function getAssignmentsByOwner(ownerId: string): Assignment[] {
  return getAssignments().filter(a => a.ownerId === ownerId);
}

export function getAssignmentsByDepartment(departmentId: string): Assignment[] {
  return getAssignments().filter(a => a.departmentId === departmentId);
}

export function saveAssignments(assignments: Assignment[]) {
  saveToStorage("assignments", assignments);
}

export function updateAssignment(assignmentId: string, updates: Partial<Assignment>) {
  const current = getAssignments();
  const updated = current.map((a) => (a.id === assignmentId ? { ...a, ...updates } : a));
  saveAssignments(updated);
}

export function createAssignment(assignment: Omit<Assignment, "id" | "status" | "progress" | "lastUpdate" | "blocker" | "supportLink">) {
  const current = getAssignments();
  const nextId = `A-${String(current.length + 1040)}`;
  const newAssignment: Assignment = {
    ...assignment,
    id: nextId,
    status: "new",
    progress: 0,
    lastUpdate: "Assigned just now.",
    blocker: "None",
    supportLink: "",
  };
  saveAssignments([newAssignment, ...current]);
  
  createNotification({
    title: `New Assignment: ${newAssignment.title}`,
    message: `You have been assigned a new task for ${newAssignment.project}.`,
    type: "Assignment",
    status: "new",
    statusLabel: "New Task",
    recipientId: newAssignment.ownerId
  });
}

export function getRequests(): RequestItem[] {
  return loadFromStorage("requests", DEFAULT_REQUESTS);
}

export function getRequestsBySubmitter(userId: string): RequestItem[] {
  return getRequests().filter((r) => r.submittedBy === userId);
}

export function saveRequests(requests: RequestItem[]) {
  saveToStorage("requests", requests);
}

export function createRequest(request: Omit<RequestItem, "id" | "status" | "statusLabel" | "submitted" | "updated" | "assignee">) {
  const current = getRequests();
  const nextId = `REQ-${String(current.length + 10).padStart(3, "0")}`;
  const newRequest: RequestItem = {
    ...request,
    id: nextId,
    status: "waiting",
    statusLabel: "Pending Approval",
    submitted: "Just now",
    updated: "Just now",
    assignee: request.type === "IT Support" || request.type === "Access" ? "IT Ops" : "People Ops",
  };
  saveRequests([newRequest, ...current]);
  
  // Create a corresponding system notification
  createNotification({
    title: `New Request Created: ${newRequest.id}`,
    message: `Your request "${newRequest.title}" has been successfully logged.`,
    type: "HR",
    status: "new",
    statusLabel: "Info",
    recipientId: request.submittedBy
  });
}

export function getNotifications(): NotificationItem[] {
  return loadFromStorage("notifications", DEFAULT_NOTIFICATIONS);
}

export function getNotificationsByUser(userId: string): NotificationItem[] {
  return getNotifications().filter((n) => !n.recipientId || n.recipientId === userId);
}

export function saveNotifications(notifications: NotificationItem[]) {
  saveToStorage("notifications", notifications);
}

export function createNotification(notification: Omit<NotificationItem, "id" | "date" | "isRead" | "actionRequired">) {
  const current = getNotifications();
  const nextId = `NOT-${String(current.length + 105)}`;
  const newNotif: NotificationItem = {
    ...notification,
    id: nextId,
    date: "Just now",
    isRead: false,
    actionRequired: notification.status === "blocked",
  };
  saveNotifications([newNotif, ...current]);
}

export function markNotificationsRead(ids: string[]) {
  const current = getNotifications();
  const updated = current.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n));
  saveNotifications(updated);
}

export function markAllNotificationsRead() {
  const current = getNotifications();
  const updated = current.map((n) => ({ ...n, isRead: true }));
  saveNotifications(updated);
}

export function getProjects(): ProjectItem[] {
  return loadFromStorage("projects", DEFAULT_PROJECTS);
}

export function getProjectsByDepartment(departmentId: string): ProjectItem[] {
  return getProjects().filter((p) => p.departmentId === departmentId);
}

export function saveProjects(projects: ProjectItem[]) {
  saveToStorage("projects", projects);
}

export function createProject(project: Omit<ProjectItem, "id" | "progress" | "blockers">) {
  const current = getProjects();
  const nextId = `PRJ-${String(current.length + 441)}`;
  const newProj: ProjectItem = {
    ...project,
    id: nextId,
    progress: 0,
    blockers: 0,
  };
  saveProjects([...current, newProj]);

  createNotification({
    title: `New Project Formed: ${newProj.id}`,
    message: `Project "${newProj.name}" is now tracking in scoping phase.`,
    type: "System",
    status: "new",
    statusLabel: "Project"
  });
}

export function getTeamMembers(): TeamMember[] {
  return loadFromStorage("teamMembers", DEFAULT_TEAM_MEMBERS);
}

export function saveTeamMembers(members: TeamMember[]) {
  saveToStorage("teamMembers", members);
}

export function updateTeamMemberLoad(memberId: string, delta: number) {
  const current = getTeamMembers();
  const updated = current.map((m) => {
    if (m.id !== memberId) return m;
    const newLoad = Math.max(0, m.currentLoad + delta);
    const band: LoadBand = newLoad > 100 ? "overloaded" : newLoad > 80 ? "full" : "healthy";
    const status: BadgeStatus = band === "overloaded" ? "blocked" : band === "full" ? "waiting" : "approved";
    return {
      ...m,
      currentLoad: newLoad,
      loadBand: band,
      status,
      statusLabel: band === "overloaded" ? "Over Capacity" : band === "full" ? "Near Capacity" : "Active"
    };
  });
  saveTeamMembers(updated);
}

export function getBlockers(): BlockerItem[] {
  return loadFromStorage("blockers", DEFAULT_BLOCKERS);
}

export function getBlockersByDepartment(departmentId: string): BlockerItem[] {
  return getBlockers().filter((b) => !b.departmentId || b.departmentId === departmentId);
}

export function getTeamMembersByDepartment(departmentId: string): TeamMember[] {
  return getTeamMembers().filter((m) => !m.departmentId || m.departmentId === departmentId);
}

export interface DepartmentSummary {
  id: string;
  name: string;
  head: string;
  headcount: number;
  activeProjects: number;
  completedProjects: number;
  blockerCount: number;
  atRiskCount: number;
  overloadedMembers: number;
  health: "Healthy" | "Attention" | "Critical";
  projects: string[];
}

export function getDepartmentSummaries(): DepartmentSummary[] {
  // Enumerate all distinct department IDs present in the data
  const projects = getProjects();
  const allMembers = getTeamMembers();
  const allBlockers = getBlockers();

  // Gather known departments from data + session personas
  const deptMap: Record<string, { name: string; head: string }> = {
    "dept-engineering": { name: "Engineering", head: "Sarah Wong" },
    "dept-product": { name: "Product", head: "David Chen" },
  };

  // Also scan projects for any new department IDs added dynamically
  projects.forEach((p) => {
    if (p.departmentId && !deptMap[p.departmentId]) {
      deptMap[p.departmentId] = { name: p.departmentId.replace("dept-", ""), head: "—" };
    }
  });

  return Object.entries(deptMap).map(([deptId, meta]) => {
    const deptProjects = projects.filter((p) => p.departmentId === deptId);
    const activeProjects = deptProjects.filter((p) => p.status !== "completed");
    const completedProjects = deptProjects.filter((p) => p.status === "completed");
    const deptBlockers = allBlockers.filter((b) => b.departmentId === deptId);
    const deptMembers = allMembers.filter((m) => !m.departmentId || m.departmentId === deptId);
    const atRisk = deptProjects.filter((p) => p.health === "At Risk" || p.health === "Off Track");
    const overloaded = deptMembers.filter((m) => m.loadBand === "overloaded");

    const health: DepartmentSummary["health"] =
      deptBlockers.filter((b) => b.severity === "High").length > 1 || overloaded.length > 1
        ? "Critical"
        : atRisk.length > 0 || deptBlockers.length > 0
          ? "Attention"
          : "Healthy";

    return {
      id: deptId,
      name: meta.name,
      head: meta.head,
      headcount: deptMembers.length,
      activeProjects: activeProjects.length,
      completedProjects: completedProjects.length,
      blockerCount: deptBlockers.length,
      atRiskCount: atRisk.length,
      overloadedMembers: overloaded.length,
      health,
      projects: deptProjects.map((p) => p.name),
    };
  });
}

export function saveBlockers(blockers: BlockerItem[]) {
  saveToStorage("blockers", blockers);
}

export function addBlocker(blocker: BlockerItem) {
  const current = getBlockers();
  saveBlockers([...current, blocker]);
}

export function resolveBlocker(blockerId: string) {
  const current = getBlockers();
  const updated = current.filter((b) => b.id !== blockerId);
  saveBlockers(updated);

  // Sync back to assignments
  updateAssignment(blockerId, { status: "in-progress", blocker: "None" });
}

export function updateRequestStatus(requestId: string, status: BadgeStatus, statusLabel: string) {
  const current = getRequests();
  const updated = current.map(r => r.id === requestId ? { ...r, status, statusLabel, updated: "Just now" } : r);
  saveRequests(updated);
}

export function routeRequest(requestId: string, department: string) {
  const current = getRequests();
  const updated = current.map(r => r.id === requestId ? { ...r, assignee: department, updated: "Just now" } : r);
  saveRequests(updated);
}

export function approveRequest(requestId: string) {
  updateRequestStatus(requestId, "approved", "Approved");
}

export function rejectRequest(requestId: string) {
  updateRequestStatus(requestId, "rejected", "Rejected");
}

export function getAuditEvents(): AuditEvent[] {
  const defaultEvents: AuditEvent[] = [
    { id: "AUD-001", timestamp: "Today 09:02", actor: "Priya Kapoor", role: "work-admin", action: "Approved Request", target: "REQ-015 (PTO)", outcome: "approved", outcomeLabel: "Approved" },
    { id: "AUD-002", timestamp: "Today 08:45", actor: "Jane Doe", role: "employee", action: "Submitted Request", target: "REQ-018 (Laptop)", outcome: "new", outcomeLabel: "Logged" },
    { id: "AUD-003", timestamp: "Yesterday 17:10", actor: "Sarah Wong", role: "department", action: "Created Assignment", target: "A-1040 (Cloud Infra)", outcome: "in-progress", outcomeLabel: "Created" },
  ];
  return loadFromStorage("audit_events", defaultEvents);
}

export function saveAuditEvents(events: AuditEvent[]) {
  saveToStorage("audit_events", events);
}

export function createAuditEvent(event: Omit<AuditEvent, "id" | "timestamp">) {
  const current = getAuditEvents();
  const nextId = `AUD-${String(current.length + 1).padStart(3, "0")}`;
  const newEvent: AuditEvent = {
    ...event,
    id: nextId,
    timestamp: "Just now",
  };
  saveAuditEvents([newEvent, ...current]);
}

// ─── System Users ─────────────────────────────────────────────────────────────

export interface SystemUser {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  departmentName: string;
  initials: string;
  email: string;
  status: BadgeStatus;
  lastLogin: string;
}

import { DEMO_USERS } from "./mock-session";

export function getSystemUsers(): SystemUser[] {
  const defaultUsers: SystemUser[] = [
    ...DEMO_USERS.map((u) => ({
      ...u,
      status: "approved" as const,
      lastLogin: "Recently",
      email: `${u.name.toLowerCase().replace(" ", ".")}@core.io`,
    })),
    {
      id: "EMP-999",
      name: "Inactive User",
      role: "employee",
      roleLabel: "Former Employee",
      departmentName: "Alumni",
      initials: "IU",
      status: "blocked" as const,
      lastLogin: "3 months ago",
      email: "inactive@core.io",
    }
  ];
  return loadFromStorage("system_users", defaultUsers);
}

export function saveSystemUsers(users: SystemUser[]) {
  saveToStorage("system_users", users);
}

export function updateSystemUserStatus(userId: string, status: BadgeStatus) {
  const current = getSystemUsers();
  const updated = current.map(u => u.id === userId ? { ...u, status } : u);
  saveSystemUsers(updated);
}

export function resetDB() {
  if (!IS_CLIENT) return;
  try {
    localStorage.removeItem("core_db_assignments");
    localStorage.removeItem("core_db_requests");
    localStorage.removeItem("core_db_notifications");
    localStorage.removeItem("core_db_projects");
    localStorage.removeItem("core_db_teamMembers");
    localStorage.removeItem("core_db_blockers");
    localStorage.removeItem("core_db_audit_events");
    localStorage.removeItem("core_db_system_users");
    notify();
  } catch (e) {
    console.error("Error resetting database:", e);
  }
}
