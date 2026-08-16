"use client";

/**
 * useUnreadNotifications
 *
 * Single source of truth for "how many unread notifications does the
 * current user have" — shared by the topbar NotificationBell and any
 * shell sidebar badge, so there's one poll loop per mounted shell
 * instead of one per consumer.
 *
 * Polls GET /api/v1/notifications?unread_only=true (via notifications-api.ts)
 * on an interval, pauses while the tab is hidden, and refreshes immediately
 * when the tab becomes visible again — see task requirement "avoid excessive
 * API polling".
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchNotifications, hasRealSession, type ApiNotification } from "@/lib/notifications-api";

export type UnreadNotificationsStatus = "idle" | "loading" | "ready" | "error" | "signed-out";

export interface UnreadNotificationsState {
  status: UnreadNotificationsStatus;
  unreadCount: number;
  actionRequiredCount: number;
  preview: ApiNotification[];
  error: string | null;
  refresh: () => void;
}

const POLL_INTERVAL_MS = 60_000;

export function useUnreadNotifications(previewLimit = 5): UnreadNotificationsState {
  const { loading: authLoading, user, token } = useAuth();
  const [status, setStatus] = useState<UnreadNotificationsStatus>("idle");
  const [unreadCount, setUnreadCount] = useState(0);
  const [actionRequiredCount, setActionRequiredCount] = useState(0);
  const [preview, setPreview] = useState<ApiNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    if (!hasRealSession(token)) {
      setStatus("signed-out");
      setUnreadCount(0);
      setActionRequiredCount(0);
      setPreview([]);
      return;
    }
    inFlight.current = true;
    setStatus((prev) => (prev === "ready" ? prev : "loading"));
    try {
      const data = await fetchNotifications(token, true, { limit: previewLimit });
      setUnreadCount(data.unread_count);
      setActionRequiredCount(data.action_required_count);
      setPreview(data.items);
      setError(null);
      setStatus("ready");
    } catch (err: any) {
      setError(err?.message || "Couldn't load notifications.");
      setStatus("error");
    } finally {
      inFlight.current = false;
    }
  }, [previewLimit, token]);

  useEffect(() => {
    if (authLoading) return;
    load();

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      load();
    }, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (typeof document !== "undefined" && !document.hidden) load();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id, token, load]);

  return { status, unreadCount, actionRequiredCount, preview, error, refresh: load };
}
