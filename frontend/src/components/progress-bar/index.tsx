/**
 * ProgressBar
 *
 * Renders a labeled, accessible progress bar using CORE design tokens.
 *
 * Props:
 *   value       — 0–100 numeric progress percentage
 *   height      — bar height in px (default: 6)
 *   color       — fill color; defaults to var(--core-brand)
 *   showLabel   — if true, renders the percentage above the bar (default: true)
 *   aria-label  — overrides the default accessible description
 *
 * Usage:
 *   <ProgressBar value={75} />
 *   <ProgressBar value={row.progress} color={row.status === "blocked" ? "var(--core-danger)" : "var(--core-brand)"} />
 */

interface ProgressBarProps {
  /** 0–100 completion percentage */
  value: number;
  /** Bar height in pixels. Default: 6 */
  height?: number;
  /** CSS color string for the fill. Default: var(--core-brand) */
  color?: string;
  /** Show the numeric percentage above the bar. Default: true */
  showLabel?: boolean;
  /** Accessible label override */
  "aria-label"?: string;
}

export function ProgressBar({
  value,
  height = 6,
  color = "var(--core-brand)",
  showLabel = true,
  "aria-label": ariaLabel,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel ?? `${clamped}% complete`}
    >
      {showLabel && (
        <span style={{ fontWeight: 600, fontSize: "var(--core-text-sm)" }}>
          {clamped}%
        </span>
      )}
      <div
        style={{
          height,
          marginTop: showLabel ? 6 : 0,
          borderRadius: 999,
          background: "var(--core-surface-muted)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: "100%",
            background: color,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}
