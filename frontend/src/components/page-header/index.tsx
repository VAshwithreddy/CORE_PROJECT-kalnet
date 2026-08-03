/**
 * PageHeader
 *
 * Shared page header used on every route page inside the app shells.
 * Provides consistent title, description, optional breadcrumbs, metadata,
 * primary action, and secondary actions.
 *
 * Usage:
 *   <PageHeader
 *     title="My Work"
 *     description="Your active assignments and recent updates."
 *     breadcrumbs={[{ label: "Employee", href: "/employee/home" }]}
 *     primaryAction={{ label: "Raise blocker", onClick: () => {} }}
 *   />
 */

import type { ReactNode } from "react";
import Link from "next/link";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface HeaderAction {
  label: string;
  onClick?: () => void;
  href?: string;
  /** Defaults to "primary" for the first action. */
  variant?: "primary" | "secondary" | "danger" | "ghost";
  /** Icon element placed before the label. */
  icon?: ReactNode;
  disabled?: boolean;
  title?: string;
}

interface PageHeaderProps {
  /** Main page title — maps to the page's primary heading. */
  title: string;
  /** One-line description shown below the title. */
  description?: string;
  /** Breadcrumb trail. Last item is always the current page (no href needed). */
  breadcrumbs?: Breadcrumb[];
  /** Metadata chips (e.g. last updated, scope label). */
  meta?: ReactNode;
  /** The most important action on the page — rendered as a primary button. */
  primaryAction?: HeaderAction;
  /** Secondary actions rendered as secondary buttons. Max 3 before overflow. */
  secondaryActions?: HeaderAction[];
  /** Inject arbitrary content into the actions slot (e.g. dropdowns). */
  actionsSlot?: ReactNode;
}

function ActionButton({ action, isPrimary }: { action: HeaderAction; isPrimary?: boolean }) {
  const variantCls = action.variant
    ? `core-button-${action.variant}`
    : isPrimary
    ? "core-button-primary"
    : "";

  const cls = `core-button ${variantCls}`.trim();

  if (action.href) {
    return (
      <Link href={action.href} className={cls} title={action.title}>
        {action.icon && <span aria-hidden="true">{action.icon}</span>}
        {action.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cls}
      onClick={action.onClick}
      disabled={action.disabled}
      title={action.title}
    >
      {action.icon && <span aria-hidden="true">{action.icon}</span>}
      {action.label}
    </button>
  );
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  meta,
  primaryAction,
  secondaryActions,
  actionsSlot,
}: PageHeaderProps) {
  const hasBreadcrumbs = breadcrumbs && breadcrumbs.length > 0;
  const hasActions = primaryAction || (secondaryActions && secondaryActions.length > 0) || actionsSlot;

  return (
    <header className="page-header">
      <div className="page-header__left">
        {hasBreadcrumbs && (
          <nav className="page-header__breadcrumbs" aria-label="Breadcrumb">
            {breadcrumbs!.map((crumb, i) => (
              <span key={i} style={{ display: "contents" }}>
                {i > 0 && (
                  <span aria-hidden="true" style={{ color: "var(--core-border-strong)" }}>
                    /
                  </span>
                )}
                {crumb.href ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : (
                  <span aria-current="page">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <h1 className="page-header__title">{title}</h1>

        {description && (
          <p className="page-header__description">{description}</p>
        )}

        {meta && <div className="page-header__meta">{meta}</div>}
      </div>

      {hasActions && (
        <div className="page-header__actions" role="group" aria-label="Page actions">
          {secondaryActions?.map((action, i) => (
            <ActionButton key={i} action={action} />
          ))}
          {primaryAction && (
            <ActionButton action={primaryAction} isPrimary />
          )}
          {actionsSlot}
        </div>
      )}
    </header>
  );
}
