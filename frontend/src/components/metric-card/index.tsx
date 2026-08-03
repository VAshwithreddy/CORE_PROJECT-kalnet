/**
 * MetricCard
 *
 * Displays a single KPI metric with optional trend, sparkline, and link.
 * Used in role dashboards (employee home, dept home, executive overview, etc.)
 *
 * Usage:
 *   <MetricCard label="Assigned Today" value={12} />
 *   <MetricCard label="Blocked" value={3} change={+1} changePeriod="vs last week" trend="down" href="/employee/my-work?status=blocked" />
 *   <MetricCard label="Loading..." loading />
 */

import type { ReactNode } from "react";

export type MetricTrend = "up" | "down" | "neutral";

interface SparkPoint {
  /** Normalized 0-1 value for bar height. */
  value: number;
  /** Mark this bar as "active" (current period). */
  active?: boolean;
}

interface MetricCardProps {
  /** Short label above the value. */
  label: string;
  /** Main numeric or text value. */
  value?: string | number;
  /** Change amount, e.g. +5 or -2. */
  change?: number;
  /** Change direction arrow. Defaults to "neutral". */
  trend?: MetricTrend;
  /** Period descriptor, e.g. "vs last week". */
  changePeriod?: string;
  /** Optional sparkline data (7-14 points, normalized 0-1). */
  sparkline?: SparkPoint[];
  /** If provided, wraps the card in an anchor tag. */
  href?: string;
  /** Skeleton loading state. */
  loading?: boolean;
  /** Custom content inside the card (replaces value+change). */
  children?: ReactNode;
  /** Additional CSS class. */
  className?: string;
}

function ChangeIcon({ trend }: { trend: MetricTrend }) {
  if (trend === "up") return <span aria-hidden="true">↑</span>;
  if (trend === "down") return <span aria-hidden="true">↓</span>;
  return <span aria-hidden="true">→</span>;
}

function MetricCardInner({
  label,
  value,
  change,
  trend = "neutral",
  changePeriod,
  sparkline,
  loading,
  children,
}: Omit<MetricCardProps, "href" | "className">) {
  if (loading) {
    return (
      <>
        <span className="metric-card__label skeleton-line skeleton-line--sm" style={{ width: "60%" }}>
          &nbsp;
        </span>
        <span className="metric-card__value skeleton-line skeleton-line--xl" style={{ width: "40%", marginTop: 8 }}>
          &nbsp;
        </span>
        <span className="metric-card__change skeleton-line skeleton-line--sm" style={{ width: "50%", marginTop: 8 }}>
          &nbsp;
        </span>
      </>
    );
  }

  return (
    <>
      <span className="metric-card__label">{label}</span>

      {children ? (
        children
      ) : (
        <span className="metric-card__value">{value ?? "—"}</span>
      )}

      {change !== undefined && (
        <span className={`metric-card__change metric-card__change--${trend}`}>
          <ChangeIcon trend={trend} />
          {Math.abs(change)}
          {changePeriod && (
            <span className="metric-card__change-period">{changePeriod}</span>
          )}
        </span>
      )}

      {sparkline && sparkline.length > 0 && (
        <div className="metric-card__sparkline" aria-hidden="true">
          {sparkline.map((pt, i) => (
            <div
              key={i}
              className={`metric-card__sparkline-bar${pt.active ? " metric-card__sparkline-bar--active" : ""}`}
              style={{ height: `${Math.max(pt.value * 100, 8)}%` }}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function MetricCard({
  href,
  className = "",
  loading,
  ...rest
}: MetricCardProps) {
  const cls = `metric-card${loading ? " metric-card--loading" : ""} ${className}`.trim();

  if (href && !loading) {
    return (
      <a href={href} className={cls} aria-label={`${rest.label}: view details`}>
        <MetricCardInner loading={loading} {...rest} />
      </a>
    );
  }

  return (
    <div className={cls}>
      <MetricCardInner loading={loading} {...rest} />
    </div>
  );
}
