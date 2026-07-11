/**
 * DataTable<T>
 *
 * Generic, fully-typed data table following the CORE design system.
 * Required on every list view in the product.
 *
 * Features:
 *   - Column definitions with optional sort and custom render
 *   - Toolbar: title, search, filter slot, right-side actions
 *   - Sortable column headers
 *   - Pagination (10 / 25 / 50 rows per page)
 *   - Loading skeleton rows
 *   - Empty state
 *   - Row hover + keyboard-accessible row actions
 *   - Optional row selection + batch action bar
 *   - Optional expandable rows for secondary details
 *
 * Usage:
 *   const columns: DataTableColumn<Assignment>[] = [
 *     { key: "title", header: "Title", sortable: true },
 *     { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
 *     { key: "dueDate", header: "Due date" },
 *   ];
 *
 *   <DataTable
 *     title="Assignments"
 *     columns={columns}
 *     rows={assignments}
 *     loading={isLoading}
 *     rowKey={(row) => row.id}
 *     rowActions={(row) => [
 *       { label: "View", onClick: () => openDrawer(row) },
 *       { label: "Edit", onClick: () => editRow(row) },
 *     ]}
 *   />
 */

"use client";

import { useState, useMemo, useCallback, Fragment, type ReactNode } from "react";
import { SkeletonTableRows } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DataTableColumn<T> {
  /** Object key to read from each row (also used as React key). */
  key: keyof T & string;
  /** Column header label. */
  header: string;
  /** Enable click-to-sort on this column. */
  sortable?: boolean;
  /** Custom cell renderer. Falls back to String(row[key]). */
  render?: (row: T) => ReactNode;
  /** Minimum column width, e.g. "120px". */
  minWidth?: string;
}

export interface RowAction<T> {
  label: string;
  onClick: (row: T) => void;
  /** Makes the action red. */
  danger?: boolean;
  /** Conditionally hide the action. */
  hidden?: (row: T) => boolean;
}

export interface BatchAction {
  label: string;
  onClick: (selectedKeys: string[]) => void;
  danger?: boolean;
}

interface EmptyConfig {
  icon?: ReactNode;
  title?: string;
  body?: string;
  primaryAction?: { label: string; onClick: () => void };
}

interface DataTableProps<T> {
  /** Table title shown in the toolbar. */
  title?: string;
  /** Column definitions. */
  columns: DataTableColumn<T>[];
  /** Rows to display. Can be pre-filtered externally or filtered internally. */
  rows: T[];
  /** Function returning a unique string key for each row. */
  rowKey: (row: T) => string;
  /** Show skeleton loading state. */
  loading?: boolean;
  /** Number of skeleton rows to show while loading. Defaults to 5. */
  skeletonRows?: number;
  /** Row actions shown at the right edge on row hover. */
  rowActions?: (row: T) => RowAction<T>[];
  /** Enables checkboxes and the batch action bar. */
  selectable?: boolean;
  /** Actions available when rows are selected. */
  batchActions?: BatchAction[];
  /** Enables an expand chevron per row; returns expanded content. */
  expandRow?: (row: T) => ReactNode;
  /** Custom empty state configuration. */
  emptyState?: EmptyConfig;
  /** Render custom filters inside the toolbar. */
  filtersSlot?: ReactNode;
  /** Render custom actions on the toolbar right side. */
  toolbarActions?: ReactNode;
  /** Disable internal search (if parent handles filtering). */
  disableSearch?: boolean;
  /** Called every time search changes (for controlled external filtering). */
  onSearchChange?: (query: string) => void;
  /** Total record count when using server-side pagination. */
  totalCount?: number;
  /** Current page (1-indexed) for server-side pagination. */
  page?: number;
  /** Called when page changes. */
  onPageChange?: (page: number) => void;
  /** Called when page size changes. */
  onPageSizeChange?: (size: number) => void;
}

// ─── Overflow row actions menu ────────────────────────────────────────────────

function RowActionMenu<T>({ row, actions }: { row: T; actions: RowAction<T>[] }) {
  const [open, setOpen] = useState(false);
  const visible = actions.filter((a) => !a.hidden?.(row));
  if (visible.length === 0) return null;

  // ≤ 2 actions: show as icon buttons; >2: overflow menu
  if (visible.length <= 2) {
    return (
      <div className="data-table__row-actions">
        {visible.map((action) => (
          <button
            key={action.label}
            type="button"
            className={`core-button core-button-ghost core-button-sm${action.danger ? " core-button-danger" : ""}`}
            onClick={(e) => { e.stopPropagation(); action.onClick(row); }}
            aria-label={action.label}
          >
            {action.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="data-table__row-actions overflow-menu">
      <button
        type="button"
        className="core-button core-button-ghost core-button-icon"
        aria-label="Row actions"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
      >
        ⋯
      </button>
      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 149 }}
            onClick={() => setOpen(false)}
          />
          <div className="overflow-menu__dropdown" role="menu">
            {visible.map((action) => (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                className={`overflow-menu__item${action.danger ? " overflow-menu__item--danger" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  action.onClick(row);
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main DataTable ───────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 25, 50] as const;

export function DataTable<T>({
  title,
  columns,
  rows,
  rowKey,
  loading = false,
  skeletonRows = 5,
  rowActions,
  selectable = false,
  batchActions,
  expandRow,
  emptyState,
  filtersSlot,
  toolbarActions,
  disableSearch = false,
  onSearchChange,
  totalCount,
  page: controlledPage,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<T>) {
  // ── Search ────────────────────────────────────────────────────
  const [search, setSearch] = useState("");

  const handleSearch = useCallback(
    (q: string) => {
      setSearch(q);
      onSearchChange?.(q);
      setCurrentPage(1);
    },
    [onSearchChange],
  );

  // ── Sort ──────────────────────────────────────────────────────
  type SortDir = "asc" | "desc";
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = useCallback((key: string) => {
    setSortKey((prev) => {
      if (prev === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else { setSortDir("asc"); }
      return key;
    });
    setCurrentPage(1);
  }, []);

  // ── Pagination ────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const page = controlledPage ?? currentPage;

  // ── Filter + sort ─────────────────────────────────────────────
  const processed = useMemo(() => {
    let result = rows;

    // Internal search: case-insensitive, checks all string values
    if (!disableSearch && search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const val = row[col.key as keyof T];
          return String(val ?? "").toLowerCase().includes(q);
        }),
      );
    }

    // Sort
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const av = String((a as Record<string, unknown>)[sortKey] ?? "");
        const bv = String((b as Record<string, unknown>)[sortKey] ?? "");
        const cmp = av.localeCompare(bv, undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [rows, search, disableSearch, columns, sortKey, sortDir]);

  // Server-side pagination uses totalCount from props; local pagination
  // uses processed.length.
  const total = totalCount ?? processed.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pageRows = useMemo(() => {
    if (totalCount !== undefined) return processed; // server handles paging
    const start = (page - 1) * pageSize;
    return processed.slice(start, start + pageSize);
  }, [processed, page, pageSize, totalCount]);

  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, total);

  // ── Selection ─────────────────────────────────────────────────
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const allPageKeys = useMemo(() => pageRows.map(rowKey), [pageRows, rowKey]);
  const allPageSelected = allPageKeys.length > 0 && allPageKeys.every((k) => selectedKeys.has(k));
  const somePageSelected = allPageKeys.some((k) => selectedKeys.has(k)) && !allPageSelected;

  const toggleAll = () => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (allPageSelected) allPageKeys.forEach((k) => next.delete(k));
      else allPageKeys.forEach((k) => next.add(k));
      return next;
    });
  };

  const toggleRow = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ── Expand ────────────────────────────────────────────────────
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ── Column count for colSpan ──────────────────────────────────
  const colCount =
    columns.length +
    (selectable ? 1 : 0) +
    (expandRow ? 1 : 0) +
    (rowActions ? 1 : 0);

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="data-table-wrapper">
      {/* ── Toolbar ── */}
      <div className="data-table-toolbar">
        {title && (
          <p className="data-table-toolbar__title">
            {title}{" "}
            {!loading && (
              <span className="data-table-toolbar__count">({total})</span>
            )}
          </p>
        )}

        {!disableSearch && (
          <div className="data-table-toolbar__search">
            <span aria-hidden="true">🔍</span>
            <input
              type="search"
              placeholder="Search…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              aria-label={`Search ${title ?? "records"}`}
            />
          </div>
        )}

        {filtersSlot}

        <div className="data-table-toolbar__right">
          {toolbarActions}
        </div>
      </div>

      {/* ── Batch action bar ── */}
      {selectable && selectedKeys.size > 0 && (
        <div className="data-table-batch-bar" role="status" aria-live="polite">
          <span>{selectedKeys.size} selected</span>
          <div className="data-table-batch-bar__actions">
            {batchActions?.map((action) => (
              <button
                key={action.label}
                type="button"
                className={`core-button core-button-sm${action.danger ? " core-button-danger" : ""}`}
                onClick={() => action.onClick(Array.from(selectedKeys))}
              >
                {action.label}
              </button>
            ))}
            <button
              type="button"
              className="core-button core-button-ghost core-button-sm"
              onClick={() => setSelectedKeys(new Set())}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="data-table-scroll">
        <table className="data-table" aria-label={title}>
          <thead>
            <tr>
              {selectable && (
                <th className="data-table__checkbox-col">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={(el) => { if (el) el.indeterminate = somePageSelected; }}
                    onChange={toggleAll}
                    aria-label="Select all rows on this page"
                  />
                </th>
              )}

              {expandRow && <th className="data-table__expand-col" />}

              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.sortable ? `sortable${sortKey === col.key ? " sorted" : ""}` : ""}
                  style={{ minWidth: col.minWidth }}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  {col.header}
                  {col.sortable && (
                    <span className="data-table__sort-icon" aria-hidden="true">
                      {sortKey === col.key ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
                    </span>
                  )}
                </th>
              ))}

              {rowActions && <th className="data-table__actions-col" />}
            </tr>
          </thead>

          <tbody>
            {/* Loading state */}
            {loading && (
              <SkeletonTableRows rows={skeletonRows} cols={colCount} />
            )}

            {/* Empty state */}
            {!loading && pageRows.length === 0 && (
              <tr>
                <td colSpan={colCount}>
                  <EmptyState
                    icon={emptyState?.icon ?? "📋"}
                    title={emptyState?.title ?? "No records found"}
                    body={
                      emptyState?.body ??
                      (search ? `No results for "${search}". Try adjusting your search.` : "Nothing to display.")
                    }
                    primaryAction={emptyState?.primaryAction}
                  />
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!loading &&
              pageRows.map((row) => {
                const key = rowKey(row);
                const isSelected = selectedKeys.has(key);
                const isExpanded = expandedKeys.has(key);

                return (
                  <Fragment key={key}>
                    <tr
                      key={key}
                      className={isSelected ? "selected" : ""}
                      aria-selected={selectable ? isSelected : undefined}
                    >
                      {selectable && (
                        <td className="data-table__checkbox-col">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(key)}
                            aria-label={`Select row ${key}`}
                          />
                        </td>
                      )}

                      {expandRow && (
                        <td className="data-table__expand-col">
                          <button
                            type="button"
                            className="core-button core-button-ghost core-button-icon"
                            onClick={() => toggleExpand(key)}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? "Collapse row" : "Expand row"}
                            style={{ fontSize: 12 }}
                          >
                            {isExpanded ? "▼" : "▶"}
                          </button>
                        </td>
                      )}

                      {columns.map((col) => (
                        <td key={col.key}>
                          {col.render
                            ? col.render(row)
                            : String((row as Record<string, unknown>)[col.key] ?? "—")}
                        </td>
                      ))}

                      {rowActions && (
                        <td className="data-table__actions-col">
                          <RowActionMenu row={row} actions={rowActions(row)} />
                        </td>
                      )}
                    </tr>

                    {expandRow && isExpanded && (
                      <tr key={`${key}-expand`} className="data-table__expand-row">
                        <td colSpan={colCount}>
                          <div className="data-table__expand-content">
                            {expandRow(row)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {!loading && total > 0 && (
        <div className="data-table-pagination">
          <span className="data-table-pagination__info">
            {total === 0
              ? "No records"
              : `${startRecord}–${endRecord} of ${total}`}
          </span>

          <div className="data-table-pagination__controls" role="navigation" aria-label="Pagination">
            <button
              type="button"
              className="data-table-pagination__page-btn"
              onClick={() => {
                const p = Math.max(1, page - 1);
                onPageChange ? onPageChange(p) : setCurrentPage(p);
              }}
              disabled={page === 1}
              aria-label="Previous page"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                // Show first, last, current ±1, and ellipsis holders
                return (
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - page) <= 1
                );
              })
              .reduce<Array<number | "…">>((acc, p, idx, arr) => {
                if (idx > 0) {
                  const prev = arr[idx - 1];
                  if (typeof prev === "number" && p - prev > 1) acc.push("…");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} style={{ padding: "0 4px", color: "var(--core-text-subtle)" }}>
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    className={`data-table-pagination__page-btn${p === page ? " current" : ""}`}
                    onClick={() => {
                      onPageChange ? onPageChange(p as number) : setCurrentPage(p as number);
                    }}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? "page" : undefined}
                  >
                    {p}
                  </button>
                ),
              )}

            <button
              type="button"
              className="data-table-pagination__page-btn"
              onClick={() => {
                const p = Math.min(totalPages, page + 1);
                onPageChange ? onPageChange(p) : setCurrentPage(p);
              }}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              ›
            </button>
          </div>

          <div className="data-table-pagination__size">
            <label htmlFor="dt-page-size">Rows:</label>
            <select
              id="dt-page-size"
              value={pageSize}
              onChange={(e) => {
                const s = Number(e.target.value);
                setPageSize(s);
                setCurrentPage(1);
                onPageSizeChange?.(s);
              }}
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
