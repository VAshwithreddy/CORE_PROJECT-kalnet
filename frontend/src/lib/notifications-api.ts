/**
 * notifications-api.ts
 *
 * Real calls to the backend's AI-powered Notification & Alert
 * Intelligence System (see backend docs/NOTIFICATION_INTELLIGENCE_
 * ARCHITECTURE.md). Field names mirror src/schemas/notifications.py
 * exactly — this is not a redesigned shape, it's the real API contract.
 *
 * `adaptToNotificationItem` maps a real API notification onto the
 * existing `NotificationItem` shape (lib/mock-db.ts) so the current
 * DataTable/StatusBadge UI can render real data without a redesign.
 */
import { apiClient } from "./api-client";
export type NotificationType =
  | "Security"
  | "System"
  | "HR"
  | "Assignment"
  | "Completion"
  | "Deadline"
  | "Overdue"
  | "Blocker"
  | "Priority"
  | "Escalation"
  | "Stale"
  | "General"
  | (string & {});

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
  actionUrl?: string;
}

import type { BadgeStatus } from "@/components/status-badge";

export type NotificationSeverity = "info" | "warning" | "critical";

export interface NotificationEnrichment {
  importance_score: number | null;
  risk_level: string | null;
  ai_summary: string | null;
  ai_reason: string | null;
  recommended_action: string | null;
  escalation_recommended: boolean | null;
  confidence: number | null;
  model_identifier: string | null;
  analysis_timestamp: string | null;
}

export interface ApiNotification {
  id: string;
  type: string;
  severity: NotificationSeverity;
  message: string;
  action_url: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  requires_acknowledgement: boolean;
  acknowledged_at: string | null;
  acknowledged_by_id: string | null;
  created_at: string;
  enrichment: NotificationEnrichment | null;
}

export interface NotificationListResponse {
  items: ApiNotification[];
  unread_count: number;
  action_required_count: number;
  total_count: number;
  limit: number;
  offset: number;
}

/** True once the caller has a real backend session token. `token` is
 * whatever useAuth() currently returns — this function does not read
 * any token store itself. */
export function hasRealSession(token: string | null | undefined): boolean {
  return Boolean(token);
}

export async function fetchNotifications(
  token: string | null | undefined,
  unreadOnly = false,
  pagination?: { limit?: number; offset?: number }
): Promise<NotificationListResponse> {
  if (!token) throw new Error("Not signed in.");
  const params = new URLSearchParams();
  if (unreadOnly) params.set("unread_only", "true");
  if (pagination?.limit !== undefined) params.set("limit", String(pagination.limit));
  if (pagination?.offset !== undefined) params.set("offset", String(pagination.offset));
  const qs = params.toString();
  return apiClient<NotificationListResponse>(`/api/v1/notifications${qs ? `?${qs}` : ""}`, { token });
}

export async function markNotificationRead(token: string | null | undefined, id: string): Promise<ApiNotification> {
  if (!token) throw new Error("Not signed in.");
  return apiClient<ApiNotification>(`/api/v1/notifications/${id}/read`, {
    method: "POST",
    token,
  });
}

export async function markAllNotificationsReadReal(token: string | null | undefined): Promise<{ updated_count: number }> {
  if (!token) throw new Error("Not signed in.");
  return apiClient<{ updated_count: number }>(`/api/v1/notifications/read-all`, {
    method: "POST",
    token,
  });
}

export async function acknowledgeNotification(token: string | null | undefined, id: string): Promise<ApiNotification> {
  if (!token) throw new Error("Not signed in.");
  return apiClient<ApiNotification>(`/api/v1/notifications/${id}/acknowledge`, {
    method: "POST",
    token,
  });
}

/** Best-effort AI enrichment for one of the caller's own notifications.
 * Per the backend contract this always returns 200 with the notification —
 * AI disabled/unavailable/low-value output just means `enrichment` stays
 * null, it is never an error response. Callers should treat a null
 * `enrichment` on the response as "no AI insight available" rather than
 * a failure. */
export async function enrichNotification(token: string | null | undefined, id: string): Promise<ApiNotification> {
  if (!token) throw new Error("Not signed in.");
  return apiClient<ApiNotification>(`/api/v1/notifications/${id}/enrich`, {
    method: "POST",
    token,
  });
}

const SEVERITY_TO_BADGE: Record<NotificationSeverity, { status: BadgeStatus; label: string }> = {
  critical: { status: "blocked", label: "Critical" },
  warning: { status: "waiting", label: "Warning" },
  info: { status: "new", label: "Info" },
};

const TYPE_LABELS: Record<string, NotificationType> = {
  WORK_ASSIGNED: "Assignment",
  WORK_REASSIGNED: "Assignment",
  WORK_COMPLETED: "Completion",
  DEADLINE_APPROACHING: "Deadline",
  WORK_OVERDUE: "Overdue",
  BLOCKER_CREATED: "Blocker",
  CRITICAL_BLOCKER: "Blocker",
  BLOCKER_RESOLVED: "Blocker",
  PRIORITY_CHANGED: "Priority",
  ESCALATION_REQUIRED: "Escalation",
  STALE_ASSIGNMENT: "Stale",
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/** First sentence (or first ~60 chars) of the message, for the bolded
 * title slot the existing table column renders — the real table has no
 * separate title column (see backend architecture doc), so this is a
 * display-only derivation, never stored or sent back to the API. */
function deriveDisplayTitle(message: string): string {
  const firstSentence = message.split(/(?<=[.!?])\s/)[0];
  if (firstSentence.length <= 70) return firstSentence;
  return `${message.slice(0, 67)}...`;
}

export function adaptToNotificationItem(n: ApiNotification): NotificationItem {
  const badge = SEVERITY_TO_BADGE[n.severity] ?? SEVERITY_TO_BADGE.info;
  // The deterministic message is always authoritative CORE fact; AI
  // insight (when present) is appended as clearly-labeled, separable
  // advisory context — never substituted in place of it. See backend
  // architecture doc §24 "Human Control": AI assessments must never be
  // presented as objective fact.
  let message = n.message;
  if (n.enrichment?.ai_reason) {
    message += `\n\nAI: ${n.enrichment.ai_reason}`;
  }
  if (n.enrichment?.recommended_action) {
    message += `\nRecommended: ${n.enrichment.recommended_action}`;
  }

  return {
    id: n.id,
    title: deriveDisplayTitle(n.message),
    message,
    type: TYPE_LABELS[n.type] ?? "System",
    status: badge.status,
    statusLabel: badge.label,
    date: relativeTime(n.created_at),
    isRead: n.is_read,
    actionRequired: n.requires_acknowledgement && !n.acknowledged_at,
    actionUrl: n.action_url ?? undefined,
  };
}
