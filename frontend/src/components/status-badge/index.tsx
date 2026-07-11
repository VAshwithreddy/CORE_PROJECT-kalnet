/**
 * StatusBadge
 *
 * Communicates a record's state using the CORE design system color semantics.
 * Always shows text — never relies on color alone.
 *
 * Usage:
 *   <StatusBadge status="in-progress" />
 *   <StatusBadge status="blocked" size="sm" />
 */

export type BadgeStatus =
  | "new"
  | "in-progress"
  | "waiting"
  | "blocked"
  | "approved"
  | "rejected"
  | "completed"
  | "archived";

export type BadgeSize = "sm" | "md";

const STATUS_LABELS: Record<BadgeStatus, string> = {
  "new": "New",
  "in-progress": "In Progress",
  "waiting": "Waiting",
  "blocked": "Blocked",
  "approved": "Approved",
  "rejected": "Rejected",
  "completed": "Completed",
  "archived": "Archived",
};

interface StatusBadgeProps {
  /** The status value to display. */
  status: BadgeStatus;
  /** Visual size of the badge. Defaults to "md". */
  size?: BadgeSize;
  /** Override the display label. Useful for custom status text. */
  label?: string;
  /** Additional CSS class. */
  className?: string;
}

export function StatusBadge({
  status,
  size = "md",
  label,
  className = "",
}: StatusBadgeProps) {
  const displayLabel = label ?? STATUS_LABELS[status];

  return (
    <span
      className={`status-badge status-badge--${status} status-badge--${size} ${className}`.trim()}
      aria-label={`Status: ${displayLabel}`}
    >
      <span className="status-badge__dot" aria-hidden="true" />
      {displayLabel}
    </span>
  );
}
