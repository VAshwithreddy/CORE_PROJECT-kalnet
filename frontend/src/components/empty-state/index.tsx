/**
 * EmptyState
 *
 * Shown when a page or table has no data. Explains what is missing and
 * guides the user to the next action. Required on every list/table page.
 *
 * Usage:
 *   <EmptyState
 *     icon="📋"
 *     title="No assignments yet"
 *     body="You have no active assignments. Check back after intake is complete."
 *   />
 *   <EmptyState
 *     icon="🚧"
 *     title="No blockers"
 *     body="No blockers have been reported for this project."
 *     primaryAction={{ label: "Report a blocker", onClick: () => {} }}
 *   />
 */

import type { ReactNode } from "react";

interface EmptyAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary";
}

interface EmptyStateProps {
  /** Emoji or icon element to display. */
  icon?: ReactNode;
  /** Short descriptive title. */
  title: string;
  /** One-sentence explanation of the empty state. */
  body?: string;
  /** Primary call-to-action button. */
  primaryAction?: EmptyAction;
  /** Secondary link or action. */
  secondaryAction?: EmptyAction;
  /** Additional CSS class on the container. */
  className?: string;
}

function EmptyActionButton({ action }: { action: EmptyAction }) {
  const isPrimary = action.variant !== "secondary";
  const cls = isPrimary ? "core-button core-button-primary" : "core-button";

  if (action.href) {
    return (
      <a href={action.href} className={cls}>
        {action.label}
      </a>
    );
  }

  return (
    <button type="button" className={cls} onClick={action.onClick}>
      {action.label}
    </button>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  primaryAction,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`.trim()} role="status">
      {icon && (
        <div className="empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      )}

      <h3 className="empty-state__title">{title}</h3>

      {body && <p className="empty-state__body">{body}</p>}

      {(primaryAction || secondaryAction) && (
        <div className="empty-state__actions">
          {primaryAction && <EmptyActionButton action={primaryAction} />}
          {secondaryAction && (
            <EmptyActionButton action={{ ...secondaryAction, variant: "secondary" }} />
          )}
        </div>
      )}
    </div>
  );
}
