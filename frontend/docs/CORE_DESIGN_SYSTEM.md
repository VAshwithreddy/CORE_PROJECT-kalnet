# CORE Frontend Design System

This document is the design framework for the CORE project frontend. Every page and component should follow this guide so the product feels like one professional system, even when different teammates build different parts.

## Research basis

The recommendations combine patterns from mature product systems and accessibility standards:

- Microsoft Fluent 2 principles: adaptive layouts, focus, inclusion, and recognizable product consistency. Source: https://fluent2.microsoft.design/design-principles
- Microsoft Fluent button guidance: one primary action per layout, action-oriented labels, and clear contrast requirements. Source: https://fluent2.microsoft.design/components/web/react/core/button/usage
- IBM Carbon data table guidance: toolbar, sorting, filtering, pagination, batch actions, row hover, expandable rows, and skeleton loading. Source: https://carbondesignsystem.com/components/data-table/usage/
- W3C WCAG 2.2: contrast, focus, predictable navigation, target size, labels, and error handling. Source: https://www.w3.org/TR/WCAG22/
- WAI ARIA Authoring Practices: accessible semantics for common widgets and interaction patterns. Source: https://www.w3.org/WAI/ARIA/apg/
- GOV.UK Design System: practical summary lists, error summaries, task lists, forms, and accessible service patterns. Source: https://design-system.service.gov.uk/components/
- Dashboard design research: dashboard patterns should support monitoring, analysis, comparison, and drill-down instead of only decorative metrics. Source: https://arxiv.org/abs/2205.00757

## Product personality

CORE should feel like a calm, modern operations command center:

- Professional, not flashy.
- Dense enough for real work, not empty or decorative.
- Clear hierarchy, predictable navigation, and fast scanning.
- Role-based, so each user sees what matters to their work.
- Trustworthy, with strong states for loading, error, access denied, audit history, and confirmation.

Avoid:

- Random color choices per developer.
- Large marketing-style hero sections inside the app.
- Cards inside cards.
- Oversized headings in compact dashboards.
- UI that depends only on color to communicate status.
- Tables without search, sorting, empty states, and pagination decisions.

## Design principles

1. Build for decisions
   Every dashboard, table, and detail view must help a user answer: What is happening? What needs attention? What can I do next?

2. Keep repeated patterns identical
   A filter bar, status badge, approval action, timeline event, and page header should look and work the same everywhere.

3. Show priority clearly
   Use visual hierarchy for urgency: critical blockers, overdue assignments, failed approvals, and security issues should rise to the top.

4. Use progressive disclosure
   Put summaries in the page. Put details in a drawer, modal, expanded row, or detail page.

5. Design for accessibility from the start
   Support keyboard navigation, visible focus, readable contrast, labels, target sizes, semantic HTML, and screen-reader names.

## Visual foundation

### Color tokens

Use these tokens instead of hard-coded colors in components.

```css
:root {
  --core-bg: #f6f8fb;
  --core-surface: #ffffff;
  --core-surface-muted: #f1f5f9;
  --core-border: #d9e1ea;
  --core-border-strong: #b7c4d3;

  --core-text: #172033;
  --core-text-muted: #5b6472;
  --core-text-subtle: #7a8494;
  --core-text-inverse: #ffffff;

  --core-brand: #0f766e;
  --core-brand-hover: #115e59;
  --core-brand-soft: #ccfbf1;

  --core-info: #2563eb;
  --core-info-soft: #dbeafe;
  --core-success: #15803d;
  --core-success-soft: #dcfce7;
  --core-warning: #b45309;
  --core-warning-soft: #fef3c7;
  --core-danger: #b91c1c;
  --core-danger-soft: #fee2e2;
  --core-executive: #6d28d9;
  --core-executive-soft: #ede9fe;

  --core-focus: #2563eb;
  --core-shadow-sm: 0 1px 2px rgb(15 23 42 / 8%);
  --core-shadow-md: 0 8px 20px rgb(15 23 42 / 10%);
}
```

Usage rules:

- Brand color is for primary actions, selected nav, and key emphasis.
- Success, warning, danger, and info must be used consistently by meaning.
- Executive purple is only for executive context, not general decoration.
- Body text must stay near `--core-text`; do not use pale gray for important text.

### Typography

Recommended font stack:

```css
font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
```

Scale:

| Token | Size | Use |
| --- | ---: | --- |
| `text-xs` | 12px | Captions, timestamps, metadata |
| `text-sm` | 14px | Table cells, form hints, secondary labels |
| `text-base` | 16px | Main readable content |
| `text-lg` | 18px | Section titles |
| `text-xl` | 20px | Panel titles and compact page titles |
| `text-2xl` | 24px | Standard page title |
| `text-3xl` | 32px | High-level dashboard title only |

Rules:

- Use sentence case for labels and headings.
- Table headings should be one or two words when possible.
- Button text should be short and action-based: `Approve`, `Assign`, `Save`, `Export`.
- Avoid vague labels like `Submit`, `OK`, or `Click here`.

### Spacing

Use an 8px spacing system.

```text
4, 8, 12, 16, 24, 32, 40, 48, 64
```

Rules:

- Page padding: 24px desktop, 16px tablet, 12px mobile.
- Card padding: 16px or 24px.
- Form field vertical gap: 16px.
- Table toolbar height: 48px minimum.
- Icon buttons: 36px minimum, 40px preferred.

### Radius, borders, and shadows

Use restrained enterprise styling:

- Radius: 8px for cards, panels, inputs, drawers, and tables.
- Radius: 6px for buttons and small controls.
- Border: 1px solid `--core-border`.
- Shadow: use only for overlays, drawers, dropdowns, and active floating surfaces.

## App layout

All signed-in pages should use this structure:

```text
AppShell
  Sidebar navigation
  Top bar
  Main content
    Breadcrumbs where useful
    PageHeader
    PageToolbar or Filters
    Content sections
```

Desktop:

- Sidebar width: 248px to 280px.
- Top bar height: 56px to 64px.
- Main content max width: 1440px.
- Use a 12-column grid for dashboards.

Tablet:

- Sidebar can collapse to icons.
- Filters can wrap into two rows.

Mobile:

- Sidebar becomes a drawer.
- Tables become stacked rows or use horizontal scroll only when data comparison is essential.
- Primary action remains visible near the page header.

## Shared page template

Every page should follow this pattern:

```text
PageHeader
  Title
  Short description
  Primary action
  Secondary actions

PageStatus
  Last updated
  Scope selector
  Important alerts

PageBody
  Summary cards or key metrics
  Main table, board, form, or detail content
  Supporting timeline, notes, or related records
```

Required states for every page:

- Loading: skeleton layout, not only a spinner.
- Empty: explain what is missing and show the next action.
- Error: show what failed and how to retry.
- Permission denied: explain the role or access needed.
- Success: confirm the change and update the UI immediately.

## Core components

### Button

Purpose: trigger one action.

Types:

- Primary: one per page section, for the main next action.
- Secondary: normal supporting action.
- Destructive: delete, revoke, reject, deactivate.
- Icon button: compact toolbar actions with tooltip and accessible label.
- Split button: one primary action plus related alternatives.

Rules:

- Use one primary button in a layout.
- Use active labels: `Create assignment`, `Approve`, `Reject`, `Export`.
- Disabled buttons must explain why through tooltip or helper text.
- Destructive actions require confirmation when they modify or delete important data.

### PageHeader

Purpose: identify the page and show main actions.

Anatomy:

- Breadcrumbs, optional.
- Title.
- One-line description.
- Metadata, optional.
- Primary action.
- Secondary actions or overflow menu.

Behavior:

- The title must match the route purpose.
- Long action lists go into an overflow menu.
- Do not put filters inside the header; use a toolbar below it.

### AppShell and role shells

Purpose: create a consistent layout for each role.

Shared features:

- Role-aware sidebar.
- Top search or command palette trigger.
- Notification entry.
- User menu.
- Breadcrumb support.
- Current scope display, such as department or reporting period.

Role shell differences:

- Employee shell: simple navigation, personal work focus.
- Department shell: team, assignments, projects, blockers.
- Executive shell: overview, departments, portfolio, risks, reports.
- Work admin shell: intake, routing, approvals, escalations, audit.
- System admin shell: users, roles, permissions, service accounts, settings.

### DataTable

Purpose: display operational records that users need to scan, filter, compare, and act on.

Required features:

- Title and optional short description.
- Search.
- Filter bar.
- Sortable column headers where useful.
- Row hover state.
- Pagination for large data.
- Empty state.
- Loading skeleton rows.
- Row actions.
- Optional row selection and batch actions.
- Optional expandable rows for secondary details.

Rules:

- Give tables enough width. Do not place a complex table inside a small card.
- Use short column names.
- Status column should use badge plus text, not color alone.
- Put row actions at the right edge.
- If more than two row actions exist, use an overflow menu.
- Use detail drawers for quick inspection without losing table context.

### DetailDrawer

Purpose: inspect or edit a record without leaving the current page.

Use for:

- Assignment details.
- Project details.
- Employee details.
- Approval details.
- Audit event details.

Anatomy:

- Header with title, status, close button.
- Summary section.
- Tabs or sections for details, activity, files, comments.
- Footer actions when editing or approving.

Behavior:

- Drawer opens from the right.
- Escape closes it if no unsaved changes exist.
- Unsaved changes require confirmation.
- The page behind the drawer should not scroll unexpectedly.

### PlannerBoard

Purpose: plan and rebalance work across people, statuses, or time.

Views:

- Board by status.
- Board by owner.
- Calendar or timeline view when dates matter.

Features:

- Drag and drop for fast planning.
- Keyboard alternative for moving items.
- Capacity indicator per owner or column.
- Overdue and blocked indicators.
- Filter by owner, project, priority, and department.

Rules:

- Do not rely only on drag and drop.
- Show capacity warnings before overload happens.
- Always allow opening a card in a detail drawer.

### ApprovalInbox

Purpose: make approval decisions fast and auditable.

Features:

- Queue of pending approvals.
- Filters by priority, department, request type, requester, and due date.
- Side-by-side comparison of request details and policy.
- Actions: approve, reject, request changes, delegate.
- Required comment for rejection and request changes.
- Decision timeline.

Rules:

- The selected approval should stay visible while the user reviews details.
- Bulk approve is allowed only for low-risk, policy-matching items.
- Every decision writes an audit event.

### AuditTimeline

Purpose: show what changed, who changed it, and when.

Features:

- Chronological event list.
- Actor, action, timestamp, object, previous value, new value.
- Filters by actor, action type, date, and object.
- Export option for admins.

Rules:

- Use exact timestamps.
- Use neutral language.
- Highlight security-sensitive events.
- Audit logs should be read-only.

### CommandPalette

Purpose: let power users jump quickly to pages, records, and actions.

Features:

- Open with keyboard shortcut.
- Search pages, people, assignments, projects.
- Role-aware results.
- Recent pages.
- Safe actions only; destructive actions should not run directly from the palette.

Rules:

- Result labels must be clear.
- Include section labels such as `Pages`, `People`, `Projects`.
- Keyboard navigation must work fully.

### StatusBadge

Purpose: communicate a state consistently.

Recommended statuses:

| Status | Color meaning |
| --- | --- |
| New | Info |
| In progress | Brand |
| Waiting | Warning |
| Blocked | Danger |
| Approved | Success |
| Rejected | Danger |
| Completed | Success |
| Archived | Muted |

Rules:

- Badge text must be visible.
- Do not use only a colored dot.
- Use the same label everywhere.

### MetricCard

Purpose: show one important metric and its direction.

Anatomy:

- Label.
- Value.
- Change from comparison period.
- Optional sparkline or status.
- Link to the deeper view.

Rules:

- One metric per card.
- Include time range or scope.
- Avoid vanity metrics without action.

### EmptyState

Purpose: explain missing data and guide the next step.

Anatomy:

- Short title.
- One-sentence explanation.
- Primary action if the user can fix it.
- Secondary link to docs or support if useful.

Examples:

- `No assignments yet`
- `No blockers reported`
- `No approvals waiting`

### ErrorState

Purpose: help users recover.

Rules:

- Say what failed.
- Give a retry action.
- Preserve user input when possible.
- For forms, show field-level errors and an error summary at the top.

## Form patterns

Forms are used in login, intake, profile, settings, permissions, routing rules, and approvals.

Rules:

- Every input needs a visible label.
- Helper text goes below the label.
- Error text goes below the field and is connected to the input.
- Required fields should be clear.
- Long forms should be grouped into sections.
- Destructive setting changes need confirmation.
- Autosave is fine for low-risk preferences; explicit `Save` is better for admin settings.

## Dashboard patterns

Dashboard pages include employee home, department home, executive overview, work-admin home, and system admin settings or audit summaries.

Use this order:

1. Highest-priority alerts or blockers.
2. Key metrics with comparison period.
3. Main work queue or table.
4. Trends or supporting charts.
5. Recent activity.

Rules:

- Use charts only when they help compare, trend, or detect outliers.
- Keep chart color consistent with status meaning.
- Always include a text label for chart values.
- Let users drill down from a metric to the filtered table behind it.

## Accessibility requirements

Minimum standard: WCAG 2.2 AA.

Implementation rules:

- Normal text contrast: at least 4.5:1.
- Icons and non-text UI controls: at least 3:1 against adjacent colors.
- Pointer target minimum: 24px by 24px; preferred interactive size: 40px to 44px.
- Visible focus indicator on every interactive element.
- Keyboard access for menus, tabs, drawers, tables, boards, and dialogs.
- Do not create keyboard traps.
- Do not make content change unexpectedly on focus.
- Error messages must be text, not color only.
- Repeated navigation should stay in the same order.

## Developer rules

Before building a new component or page:

1. Check whether an existing shared component already fits.
2. Use tokens from `frontend/src/design/tokens.css` or `frontend/src/design/tokens.ts`.
3. Follow the page spec in `frontend/docs/PAGE_AND_COMPONENT_SPECS.md`.
4. Build loading, empty, error, and permission states.
5. Test with keyboard navigation.
6. Check mobile and desktop layouts.
7. Do not introduce new colors, shadows, or spacing values without updating this document.

## Pull request checklist

Every frontend PR should answer:

- Does the page use the correct role shell?
- Does it use shared tokens?
- Are table, drawer, form, and button behaviors consistent?
- Is there one clear primary action?
- Are loading, empty, error, and permission states present?
- Are focus states visible?
- Can the main workflow be completed with keyboard only?
- Are status labels consistent with the design system?
- Does the work avoid committing secrets or real `.env` files?
