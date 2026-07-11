# DataTable Component

Use this doc for `components/data-table`.

## Purpose

DataTable displays operational records that users need to scan, filter, compare, and act on.

Use it for:

- Assignments.
- Projects.
- People.
- Requests.
- Approvals.
- Audit events.
- Users.
- Service accounts.

## Required anatomy

- Table title.
- Optional description.
- Toolbar.
- Search.
- Filters.
- Sortable column headers where useful.
- Rows.
- Row hover state.
- Row actions.
- Pagination when data is large.
- Empty state.
- Loading skeleton.
- Error state.

## Toolbar

Toolbar can include:

- Search.
- Filters.
- Display settings.
- Export.
- Primary action.
- Overflow menu.

Rules:

- Keep toolbar actions to five or fewer visible actions.
- Put extra actions in overflow.
- Do not place unrelated page actions inside table toolbar.

## Row actions

Use inline icon buttons when there are one or two common row actions.

Use overflow menu when there are more than two row actions.

Examples:

- View.
- Edit.
- Assign.
- Escalate.
- Archive.

## Batch actions

Batch actions appear only after rows are selected.

Allowed examples:

- Assign selected.
- Export selected.
- Change status for safe records.

Avoid:

- Bulk approve high-risk approvals.
- Bulk delete without review.

## Columns

Column rules:

- Use short labels.
- Use sentence case.
- Keep status as text plus badge.
- Put row actions on the right.
- Show full long values in tooltip or drawer.

## States

Loading:

- Use skeleton rows.

Empty:

- Explain what is missing.
- Provide next action if the user can create data.

Error:

- Explain what failed.
- Provide retry action.

## Accessibility

- Header cells must use proper table semantics.
- Sort buttons must announce sort state.
- Selection checkboxes need labels.
- Keyboard users must reach row actions.
- Do not use color alone for status.
