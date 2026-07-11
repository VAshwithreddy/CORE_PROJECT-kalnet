/**
 * DetailDrawer
 *
 * Right-side overlay drawer used to inspect or edit a record without leaving
 * the current context (e.g., viewing an assignment from a data table).
 *
 * Features:
 *   - Slide-in animation, backdrop, and FocusTrap
 *   - Header with title, subtitle, status badge slot, close button
 *   - Optional tabs for switching content sections
 *   - Unsaved changes guard
 *   - Sticky footer for primary/secondary actions
 *
 * Usage:
 *   <DetailDrawer
 *     isOpen={isDrawerOpen}
 *     onClose={() => setDrawerOpen(false)}
 *     title="Assignment 123"
 *     subtitle="Created 2 days ago"
 *     status={<StatusBadge status="blocked" />}
 *     tabs={["Details", "Activity", "Files"]}
 *     activeTab={tab}
 *     onTabChange={setTab}
 *     hasUnsavedChanges={isDirty}
 *     footerRight={
 *       <>
 *         <button className="core-button" onClick={close}>Cancel</button>
 *         <button className="core-button core-button-primary" onClick={save}>Save</button>
 *       </>
 *     }
 *   >
 *     <DrawerSection title="Overview">...</DrawerSection>
 *   </DetailDrawer>
 */

"use client";

import { useEffect, useRef, type ReactNode } from "react";

export interface DetailDrawerProps {
  /** Whether the drawer is open and visible. */
  isOpen: boolean;
  /** Function to call when close button, backdrop, or Escape is pressed. */
  onClose: () => void;
  /** Drawer width variant. "wide" is 640px, default is 480px. */
  size?: "default" | "wide";

  // Header
  title: string;
  subtitle?: string;
  /** Pass a StatusBadge or similar component here. */
  status?: ReactNode;

  // Tabs
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;

  // Content
  children: ReactNode;

  // Footer
  /** Indicates if form data is dirty. Prompts user if they try to close. */
  hasUnsavedChanges?: boolean;
  /** Left-aligned footer actions. */
  footerLeft?: ReactNode;
  /** Right-aligned footer actions. */
  footerRight?: ReactNode;
}

export function DetailDrawer({
  isOpen,
  onClose,
  size = "default",
  title,
  subtitle,
  status,
  tabs,
  activeTab,
  onTabChange,
  children,
  hasUnsavedChanges,
  footerLeft,
  footerRight,
}: DetailDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus trap & Escape handling
  useEffect(() => {
    if (!isOpen) return;

    // Store element that had focus before opening
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Move focus into the drawer
    const focusable = overlayRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable && focusable.length > 0) {
      focusable[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }

      // Basic focus trap
      if (e.key === "Tab" && overlayRef.current) {
        const focusables = overlayRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden"; // Prevent page scroll

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      // Restore focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        return;
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  const hasTabs = tabs && tabs.length > 0;
  const hasFooter = footerLeft || footerRight;
  const cls = `drawer${size === "wide" ? " drawer--wide" : ""}`;

  return (
    <>
      <div className="drawer-backdrop" onClick={handleClose} aria-hidden="true" />
      <div
        className={cls}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        ref={overlayRef}
      >
        {/* Header */}
        <div className="drawer__header">
          <div className="drawer__header-left">
            <h2 id="drawer-title" className="drawer__title">{title}</h2>
            {subtitle && <p className="drawer__subtitle">{subtitle}</p>}
            {status && <div className="drawer__header-status">{status}</div>}
          </div>
          <button
            type="button"
            className="drawer__close"
            onClick={handleClose}
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        {/* Unsaved Guard */}
        {hasUnsavedChanges && (
          <div className="drawer__unsaved-guard" role="alert">
            <span>⚠️ You have unsaved changes</span>
          </div>
        )}

        {/* Tabs */}
        {hasTabs && (
          <div className="drawer__tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                className={`drawer__tab${activeTab === tab ? " active" : ""}`}
                onClick={() => onTabChange?.(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="drawer__body">
          {children}
        </div>

        {/* Footer */}
        {hasFooter && (
          <div className="drawer__footer">
            {footerLeft && <div>{footerLeft}</div>}
            {footerRight && <div className="drawer__footer-right">{footerRight}</div>}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * DrawerSection
 * Use this to group fields inside the drawer body.
 */
export function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="drawer__section">
      <h3 className="drawer__section-title">{title}</h3>
      <div className="drawer__field-grid">{children}</div>
    </div>
  );
}

/**
 * DrawerField
 * A read-only label/value pair for the drawer overview section.
 */
export function DrawerField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="drawer__field">
      <span className="drawer__field-label">{label}</span>
      <span className="drawer__field-value">{value ?? "—"}</span>
    </div>
  );
}
