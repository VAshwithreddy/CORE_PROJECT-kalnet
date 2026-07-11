/**
 * LoadingSkeleton
 *
 * Reusable skeleton shimmer components for loading states.
 * Use these inside pages instead of bare spinners.
 *
 * Usage:
 *   <SkeletonLine width="60%" />
 *   <SkeletonLine size="lg" />
 *   <SkeletonCard rows={4} />
 *   <SkeletonMetricRow count={4} />
 *   <SkeletonTableRows rows={5} cols={5} />
 */

import type { CSSProperties } from "react";

// ─── Line skeleton ──────────────────────────────────────────────────────────

interface SkeletonLineProps {
  /** CSS width of the line. Defaults to "100%". */
  width?: string;
  /** Height variant. */
  size?: "sm" | "md" | "lg" | "xl";
  /** Inline style overrides. */
  style?: CSSProperties;
  className?: string;
}

export function SkeletonLine({
  width = "100%",
  size = "md",
  style,
  className = "",
}: SkeletonLineProps) {
  const sizeClass = size === "md" ? "" : ` skeleton-line--${size}`;
  return (
    <div
      className={`skeleton-line${sizeClass} ${className}`.trim()}
      style={{ width, ...style }}
      aria-hidden="true"
    />
  );
}

// ─── Circle skeleton ─────────────────────────────────────────────────────────

interface SkeletonCircleProps {
  size?: number;
  className?: string;
}

export function SkeletonCircle({ size = 40, className = "" }: SkeletonCircleProps) {
  return (
    <div
      className={`skeleton-circle ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

// ─── Card skeleton ───────────────────────────────────────────────────────────

interface SkeletonCardProps {
  /** Number of text rows inside the card. Defaults to 3. */
  rows?: number;
  className?: string;
}

export function SkeletonCard({ rows = 3, className = "" }: SkeletonCardProps) {
  return (
    <div className={`skeleton-card ${className}`.trim()} aria-hidden="true">
      <SkeletonLine size="lg" width="55%" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} width={i % 2 === 0 ? "90%" : "70%"} />
      ))}
    </div>
  );
}

// ─── Metric row skeleton ─────────────────────────────────────────────────────

interface SkeletonMetricRowProps {
  /** Number of metric cards. Defaults to 4. */
  count?: number;
  className?: string;
}

export function SkeletonMetricRow({ count = 4, className = "" }: SkeletonMetricRowProps) {
  return (
    <div className={`core-grid-4 ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} rows={2} />
      ))}
    </div>
  );
}

// ─── Table rows skeleton ─────────────────────────────────────────────────────

interface SkeletonTableRowsProps {
  /** Number of skeleton rows. Defaults to 5. */
  rows?: number;
  /** Number of columns. Defaults to 5. */
  cols?: number;
}

export function SkeletonTableRows({ rows = 5, cols = 5 }: SkeletonTableRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="data-table__skeleton-row" aria-hidden="true">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <td key={colIdx}>
              <SkeletonLine width={colIdx === 0 ? "70%" : colIdx === cols - 1 ? "40%" : "85%"} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
