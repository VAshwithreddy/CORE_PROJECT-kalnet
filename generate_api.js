const fs = require('fs');
const path = require('path');

const apiContent = `import { apiClient } from "./api-client";
import { getCurrentToken } from "./session";

export type BadgeStatus = "active" | "completed" | "on_hold" | "planned" | "blocked" | "escalated" | "attention" | "resolved" | "pending" | "approved" | "rejected";

export interface Assignment {
  id: string;
  projectId: string;
  projectName: string;
  ownerId: string;
  role: string;
  status: BadgeStatus;
  progress: number;
  lastUpdate: string;
  blocker?: string;
  supportLink?: string;
}

export interface RequestItem {
  id: string;
  type: string;
  title: string;
  submitted: string;
  updated: string;
  status: BadgeStatus;
  statusLabel: string;
  submitterId: string;
  targetDept?: string;
  assignee?: string;
  routedTo?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: "alert" | "info" | "action";
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  actionRequired?: boolean;
}

export interface ProjectItem {
  id: string;
  name: string;
  departmentId: string;
  status: BadgeStatus;
  progress: number;
  sponsor: string;
  targetDate: string;
  blockers: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  departmentId: string;
  departmentName: string;
  currentLoad: number;
  activeProjects: number;
}

export interface BlockerItem {
  id: string;
  assignmentId: string;
  projectId: string;
  projectName: string;
  ownerId: string;
  departmentId: string;
  description: string;
  status: BadgeStatus;
  loggedAt: string;
  escalatedTo?: string;
}

export interface DepartmentSummary {
  id: string;
  name: string;
  head: string;
  headcount: number;
  activeProjects: number;
  blockers: number;
  health: "Healthy" | "Attention" | "Critical";
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  targetId: string;
  targetType: string;
  details: string;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: BadgeStatus;
  lastActive: string;
}

const getToken = () => getCurrentToken() || "";

export async function getAssignments(): Promise<Assignment[]> {
  return apiClient("/assignments", { token: getToken() }).catch(() => []);
}

export async function getAssignmentsByOwner(ownerId: string): Promise<Assignment[]> {
  const all = await apiClient<Assignment[]>("/assignments", { token: getToken() }).catch(() => []);
  return all.filter(a => a.ownerId === ownerId);
}

export async function getAssignmentsByDepartment(departmentId: string): Promise<Assignment[]> {
  const all = await apiClient<Assignment[]>("/assignments", { token: getToken() }).catch(() => []);
  return all;
}

export async function saveAssignments(assignments: Assignment[]) {}
export async function updateAssignment(assignmentId: string, updates: Partial<Assignment>) {}
export async function createAssignment(assignment: any) {}

export async function getRequests(): Promise<RequestItem[]> {
  return [];
}

export async function getRequestsBySubmitter(userId: string): Promise<RequestItem[]> {
  return [];
}

export async function saveRequests(requests: RequestItem[]) {}
export async function createRequest(request: any) {}

export async function getNotifications(): Promise<NotificationItem[]> {
  return [];
}

export async function getNotificationsByUser(userId: string): Promise<NotificationItem[]> {
  return apiClient<NotificationItem[]>("/alerts", { token: getToken() }).catch(() => []);
}

export async function saveNotifications(notifications: NotificationItem[]) {}
export async function createNotification(notification: any) {}
export async function markNotificationsRead(ids: string[]) {}
export async function markAllNotificationsRead() {}

export async function getProjects(): Promise<ProjectItem[]> {
  return apiClient("/projects", { token: getToken() }).catch(() => []);
}

export async function getProjectsByDepartment(departmentId: string): Promise<ProjectItem[]> {
  return apiClient("/projects", { token: getToken() }).catch(() => []);
}

export async function saveProjects(projects: ProjectItem[]) {}
export async function createProject(project: any) {}

export async function getTeamMembers(): Promise<TeamMember[]> {
  return apiClient("/people", { token: getToken() }).catch(() => []);
}

export async function getTeamMembersByDepartment(departmentId: string): Promise<TeamMember[]> {
  return apiClient("/people", { token: getToken() }).catch(() => []);
}

export async function saveTeamMembers(members: TeamMember[]) {}
export async function updateTeamMemberLoad(memberId: string, delta: number) {}

export async function getBlockers(): Promise<BlockerItem[]> {
  return [];
}

export async function getBlockersByDepartment(departmentId: string): Promise<BlockerItem[]> {
  return [];
}

export async function getDepartmentSummaries(): Promise<DepartmentSummary[]> {
  return apiClient("/departments", { token: getToken() }).catch(() => []);
}

export async function saveBlockers(blockers: BlockerItem[]) {}
export async function addBlocker(blocker: BlockerItem) {}
export async function resolveBlocker(blockerId: string) {}

export async function updateRequestStatus(requestId: string, status: BadgeStatus, statusLabel: string) {}
export async function routeRequest(requestId: string, department: string) {}
export async function approveRequest(requestId: string) {}
export async function rejectRequest(requestId: string) {}

export async function getAuditEvents(): Promise<AuditEvent[]> {
  return [];
}

export async function saveAuditEvents(events: AuditEvent[]) {}
export async function createAuditEvent(event: any) {}

export async function getSystemUsers(): Promise<SystemUser[]> {
  return apiClient("/people", { token: getToken() }).catch(() => []);
}

export async function saveSystemUsers(users: SystemUser[]) {}
export async function updateSystemUserStatus(userId: string, status: BadgeStatus) {}

export function resetDB() {}
export function subscribe(listener: any) { return () => {}; }
`;

fs.writeFileSync(path.join(__dirname, 'frontend', 'src', 'lib', 'api.ts'), apiContent, 'utf8');
