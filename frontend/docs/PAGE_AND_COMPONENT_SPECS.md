# CORE Page and Component Specifications

This document tells developers what each page and shared component should do. Use it while assigning tasks so every teammate builds toward the same product experience.

## Shared implementation pattern

Every page should be built from the same basic structure:

```text
RoleShell
  PageHeader
  PageToolbar or FilterBar
  MainContent
  DetailDrawer or Modal when needed
```

Every page must include:

- Loading state.
- Empty state.
- Error state.
- Permission denied state.
- Mobile behavior.
- Keyboard behavior for primary actions.

## Route pages

### `src/app/landing`

Purpose: introduce CORE and route users to the correct workspace.

Main users: everyone before sign-in or immediately after sign-in.

Layout:

- Clean top navigation with product name and sign-in action.
- Split content between short product promise and role-aware entry cards.
- Show next action clearly: `Sign in`, `Continue to workspace`, or `Request access`.

Features:

- Explain what CORE manages: work, assignments, approvals, projects, blockers, and reporting.
- If user is already signed in, send them to their role home page.
- If user has no role, send them to access request or forbidden page.

Professional notes:

- This can be more polished than the internal app, but should still be restrained.
- Avoid a marketing-only page that blocks users from getting to work.

### `src/app/login`

Purpose: authenticate users securely.

Layout:

- Centered login panel, not a decorative oversized hero.
- Organization identity at top.
- Authentication methods below.

Features:

- SSO button if available.
- Email and password fallback if required.
- Remembered email support.
- Password visibility toggle.
- Error summary for failed login.
- MFA step if enabled.

Behavior:

- On success, redirect by role.
- On failed login, preserve email and explain the error.
- Never reveal whether a specific email exists.

### `src/app/forbidden`

Purpose: explain access denial and provide a path forward.

Layout:

- Clear title: `You do not have access`.
- Role or permission needed.
- Action buttons: `Request access`, `Go home`, `Sign out`.

Features:

- Show current signed-in email.
- Show support contact or request workflow.
- Log access-denied event for admins.

## Employee pages

### `src/app/employee/home`

Purpose: give employees a daily command center.

Layout:

- Top alert strip for blockers or overdue work.
- Metric cards: assigned today, due this week, blocked, completed.
- `My work` preview table.
- Recent notifications and upcoming deadlines.

Features:

- Quick action to update status.
- Quick action to raise blocker.
- Links to profile, requests, and notifications.
- Personal scope only.

How it should work:

- Employees open this page and immediately know what needs attention today.
- Clicking a metric filters `My work`.
- Clicking a row opens the assignment detail drawer.

### `src/app/employee/my-work`

Purpose: list and manage the employee's assignments.

Layout:

- Filter bar: status, priority, due date, project.
- Main view: table by default, optional board view.
- Detail drawer for selected assignment.

Features:

- Search assignments.
- Sort by due date, priority, project.
- Update status.
- Add progress note.
- Mark blocker.
- Upload or link supporting files if required.

How it should work:

- Table is for scanning.
- Drawer is for focused updates.
- Status changes should show success feedback and update the row immediately.

### `src/app/employee/profile`

Purpose: show and edit employee profile data.

Layout:

- Summary header with avatar, name, role, department, manager.
- Sections: personal info, skills, availability, preferences.
- Audit or last-updated note for admin-controlled fields.

Features:

- Editable fields for allowed personal info.
- Read-only fields for role, department, and manager unless admin has permission.
- Skills and work preferences.
- Notification preferences link.

How it should work:

- Employees can update their own safe profile fields.
- Restricted changes should show who can edit them.

### `src/app/employee/requests`

Purpose: create and track employee requests.

Layout:

- Request creation button.
- Table of requests with status, type, submitted date, owner, decision.
- Detail drawer with timeline.

Features:

- Create request.
- Attach context.
- Track approval status.
- Comment or respond to requested changes.
- Cancel request when still pending.

How it should work:

- New requests enter work-admin or department queue depending on type.
- Every status change appears in the timeline.

### `src/app/employee/notifications`

Purpose: manage notifications and alerts.

Layout:

- Tabs: unread, all, settings.
- Notification list grouped by date.
- Preferences panel.

Features:

- Mark read or unread.
- Filter by type.
- Open related assignment, project, request, or approval.
- Set notification preferences.

How it should work:

- Notifications should be actionable.
- Important alerts should not disappear until acknowledged or resolved.

## Department pages

### `src/app/department/home`

Purpose: show department health and daily workload.

Layout:

- Department scope selector.
- Metrics: active projects, open assignments, blocked work, overdue items, team capacity.
- Blockers preview.
- Team workload chart.
- Recent activity.

Features:

- Drill from metrics into filtered tables.
- See at-risk work.
- See team capacity and unassigned work.
- Quick action to assign or reassign work.

How it should work:

- Department heads should know where to act in less than one minute.

### `src/app/department/team`

Purpose: manage department team visibility.

Layout:

- Search and filters: role, skill, availability, load, status.
- Data table of team members.
- Detail drawer for employee profile and current workload.

Features:

- View capacity.
- View current assignments.
- View skills.
- See blockers by person.
- Export team list if permitted.

How it should work:

- Clicking a person opens the detail drawer.
- Capacity warnings should use text plus color.

### `src/app/department/projects`

Purpose: manage department projects.

Layout:

- Project metric strip.
- Filterable project table.
- Detail drawer or project detail route.

Features:

- Search projects.
- Filter by status, owner, risk, due date.
- View progress, milestones, blockers, assigned people.
- Create project if role permits.

How it should work:

- Project rows should show status, health, owner, due date, and next milestone.

### `src/app/department/assignments`

Purpose: assign, monitor, and rebalance work.

Layout:

- Filter bar.
- Assignment table with batch selection.
- Detail drawer for assignment details.

Features:

- Create assignment.
- Assign owner.
- Change priority.
- Update due date.
- Bulk update low-risk fields.
- Escalate blocked work.

How it should work:

- High-priority and overdue work should sort toward attention.
- Batch mode should appear only after selection.

### `src/app/department/planner`

Purpose: plan work across people and time.

Layout:

- Toolbar with view switch: board, calendar, timeline.
- Planner board with owner or status columns.
- Capacity indicators.

Features:

- Drag assignments where allowed.
- Keyboard action to move assignment.
- Filter by project, owner, priority.
- Show overload warnings.
- Open assignment drawer.

How it should work:

- Moving work should validate capacity and permissions.
- Every reassignment should create an audit event.

### `src/app/department/blockers`

Purpose: triage and resolve blocked work.

Layout:

- Blocker priority queue.
- Filters: severity, age, owner, project.
- Detail drawer with escalation path.

Features:

- Mark blocker resolved.
- Assign blocker owner.
- Escalate to work admin or executive.
- Add resolution notes.

How it should work:

- Old and severe blockers should be visually prominent.
- Resolved blockers stay in history.

### `src/app/department/digest`

Purpose: summarize department progress.

Layout:

- Date range selector.
- Summary cards.
- Narrative digest section.
- Highlights, risks, blockers, decisions needed.

Features:

- Generate weekly or daily digest.
- Edit summary before sharing.
- Export or send digest.
- Link every statement back to source data.

How it should work:

- The digest should help a department head report without manually collecting updates.

## Executive pages

### `src/app/executive/overview`

Purpose: show organization-wide performance and risks.

Layout:

- Executive KPI strip.
- Department comparison.
- Risk and blocker summary.
- Portfolio trend chart.
- Decision queue.

Features:

- Drill into departments.
- Time period selector.
- Compare metrics across departments.
- Show top risks and overdue escalations.

How it should work:

- Executives should see signal, not operational noise.
- Every metric should link to evidence.

### `src/app/executive/departments`

Purpose: compare departments.

Layout:

- Comparison table.
- Department health cards.
- Trend chart per selected metric.

Features:

- Compare capacity, delivery, blockers, risk, and completion.
- Filter by business unit or period.
- Open department detail drawer.

How it should work:

- The page should highlight outliers and departments needing support.

### `src/app/executive/portfolio`

Purpose: show strategic project portfolio.

Layout:

- Portfolio roadmap.
- Project health table.
- Strategic theme filters.

Features:

- View project status across departments.
- Track milestones.
- See risks and dependencies.
- Export portfolio report.

How it should work:

- This page should answer what is on track, what is at risk, and what needs leadership decision.

### `src/app/executive/risks`

Purpose: manage organization-level risk visibility.

Layout:

- Risk heatmap or priority matrix.
- Risk register table.
- Detail drawer with mitigation plan.

Features:

- Filter by severity, probability, owner, department.
- Assign mitigation owner.
- Track mitigation progress.
- Escalate or close risk.

How it should work:

- Risk color must always include labels and severity text.

### `src/app/executive/digest`

Purpose: produce leadership-ready briefings.

Layout:

- Time range and audience selector.
- Executive summary.
- Key movements.
- Risks, blockers, decisions needed.
- Export/share controls.

Features:

- Generate digest from project, department, and blocker data.
- Edit before sending.
- Save digest history.

How it should work:

- It should read like a briefing, not a raw dashboard.

### `src/app/executive/reports`

Purpose: create and export reports.

Layout:

- Report templates.
- Saved reports table.
- Builder panel.

Features:

- Choose report type.
- Select date range and departments.
- Preview report.
- Export PDF or spreadsheet.
- Schedule recurring reports if supported.

How it should work:

- Report settings should be reviewable before export.

## Work admin pages

### `src/app/work-admin/home`

Purpose: command center for operational administrators.

Layout:

- Queue metrics: intake, routing, approvals, escalations, SLA breaches.
- Work queue table.
- Recent audit events.

Features:

- See bottlenecks.
- Jump into pending queues.
- Resolve exceptions.

How it should work:

- Admins should start here to see what needs intervention.

### `src/app/work-admin/intake`

Purpose: capture new work in a structured way.

Layout:

- Intake form.
- Template selector.
- Recent submissions.

Features:

- Create work request.
- Validate required fields.
- Attach documents or links.
- Estimate priority and routing.

How it should work:

- Form should prevent incomplete or ambiguous requests.
- After submission, show request ID and next step.

### `src/app/work-admin/routing`

Purpose: route incoming work to the correct department or owner.

Layout:

- Unrouted queue.
- Rule suggestions.
- Assignment panel.

Features:

- Filter by request type, priority, department, SLA.
- Suggested route from rules.
- Manual override with reason.
- Bulk route safe items.

How it should work:

- Overrides must require a reason and write to audit.

### `src/app/work-admin/department-heads`

Purpose: manage department head ownership and delegation.

Layout:

- Department list.
- Current head and delegates.
- Change history drawer.

Features:

- Assign department head.
- Add delegate.
- Set effective dates.
- View coverage gaps.

How it should work:

- Changes affect routing and approval paths, so confirmation is required.

### `src/app/work-admin/approvals`

Purpose: process approval requests.

Layout:

- Approval queue on left.
- Approval detail on right or drawer on smaller screens.
- Decision footer.

Features:

- Approve.
- Reject with required reason.
- Request changes.
- Delegate.
- View policy and history.

How it should work:

- High-risk approvals should not allow bulk approval.
- Every decision must be auditable.

### `src/app/work-admin/escalations`

Purpose: manage escalated work and SLA risk.

Layout:

- Escalation queue.
- Severity filters.
- Owner and next-action panel.

Features:

- Assign escalation owner.
- Add action plan.
- Notify stakeholders.
- Resolve or re-escalate.

How it should work:

- Escalations need clear owner, due date, and latest update.

### `src/app/work-admin/audit`

Purpose: show administrative audit history.

Layout:

- Audit table.
- Filters by actor, action, object, date.
- Detail drawer with before and after values.

Features:

- Search audit events.
- Export audit data if permitted.
- View related object.

How it should work:

- Audit data is read-only.
- Security-sensitive changes should be easy to find.

## System pages

### `src/app/system/users`

Purpose: manage user accounts.

Layout:

- Users table.
- Invite user action.
- User detail drawer.

Features:

- Invite user.
- Activate or deactivate user.
- Reset MFA or session if supported.
- Assign role and department.
- Filter by role, status, department.

How it should work:

- Deactivation requires confirmation.
- Role changes should show permission impact.

### `src/app/system/roles`

Purpose: manage role definitions.

Layout:

- Role list.
- Role detail panel.
- Permission summary.

Features:

- View role capabilities.
- Create role if custom roles are allowed.
- Edit role description.
- See assigned users.

How it should work:

- Role changes are high-risk and must be confirmed and audited.

### `src/app/system/permissions`

Purpose: manage permission matrix.

Layout:

- Matrix by role and permission.
- Search permissions.
- Change summary panel.

Features:

- View permission groups.
- Compare roles.
- Request or apply permission changes.
- Show risk warning for sensitive permissions.

How it should work:

- Users must review changes before saving.
- High-risk permissions should require extra confirmation.

### `src/app/system/service-accounts`

Purpose: manage machine/API accounts.

Layout:

- Service account table.
- Detail drawer.
- Token and scope panel.

Features:

- Create service account.
- Rotate token.
- Disable account.
- Set scopes.
- View last used timestamp.

How it should work:

- Secret values should show once only.
- Token rotation and disable actions require confirmation.

### `src/app/system/audit`

Purpose: global audit center.

Layout:

- Audit search and filter toolbar.
- Audit table.
- Detail drawer.

Features:

- Search by actor, object, action.
- Filter by date range, severity, role, department.
- Export.
- Open related record.

How it should work:

- This page must be fast, searchable, and read-only.

### `src/app/system/settings`

Purpose: configure organization-level settings.

Layout:

- Settings sections.
- Save bar for unsaved changes.
- Audit note for last change.

Features:

- Organization profile.
- Integrations.
- Notification policies.
- Security settings.
- Workflow defaults.

How it should work:

- Low-risk settings can autosave.
- Security and workflow settings should require explicit save and confirmation.

## Shared component specs

### `components/employee-shell`

Use for employee pages.

Navigation:

- Home.
- My work.
- Requests.
- Notifications.
- Profile.

Required behavior:

- Show personal work count.
- Highlight overdue and blocked work.
- Keep navigation simple.

### `components/department-shell`

Use for department pages.

Navigation:

- Home.
- Team.
- Projects.
- Assignments.
- Planner.
- Blockers.
- Digest.

Required behavior:

- Department scope selector.
- Team capacity indicator.
- Fast access to blockers.

### `components/executive-shell`

Use for executive pages.

Navigation:

- Overview.
- Departments.
- Portfolio.
- Risks.
- Digest.
- Reports.

Required behavior:

- Time period selector.
- Organization scope selector.
- Decision queue shortcut.

### `components/work-admin-shell`

Use for work admin pages.

Navigation:

- Home.
- Intake.
- Routing.
- Department heads.
- Approvals.
- Escalations.
- Audit.

Required behavior:

- Queue counters.
- SLA breach indicator.
- Admin search.

### `components/system-admin-shell`

Use for system pages.

Navigation:

- Users.
- Roles.
- Permissions.
- Service accounts.
- Audit.
- Settings.

Required behavior:

- Security warning patterns.
- Read-only audit access.
- Confirmation for risky changes.

### `components/command-palette`

Features:

- Search routes and records.
- Keyboard navigation.
- Role-aware actions.
- Recent pages.

Acceptance:

- Opens and closes by keyboard.
- Results have clear labels and sections.
- Destructive actions are not executed directly.

### `components/data-table`

Features:

- Search.
- Sort.
- Filters.
- Pagination.
- Row actions.
- Optional selection.
- Optional expandable rows.

Acceptance:

- Loading skeleton exists.
- Empty state exists.
- Column headers are readable.
- Actions are keyboard reachable.

### `components/detail-drawer`

Features:

- Right-side drawer.
- Header, content, optional tabs, footer actions.
- Close button and Escape behavior.
- Unsaved changes guard.

Acceptance:

- Focus moves into the drawer when opened.
- Focus returns to the trigger when closed.
- Content is scrollable without breaking page scroll.

### `components/planner-board`

Features:

- Board columns.
- Cards.
- Capacity indicators.
- Drag and drop plus keyboard movement.
- Filters.

Acceptance:

- Moving a card validates permissions.
- Keyboard users can move items.
- Capacity warnings are visible and textual.

### `components/approval-inbox`

Features:

- Approval queue.
- Detail review.
- Approve, reject, request changes, delegate.
- Comment field for negative decisions.

Acceptance:

- Decision is confirmed visually.
- Audit event is created.
- User cannot reject without a reason.

### `components/audit-timeline`

Features:

- Chronological events.
- Actor, action, timestamp, object.
- Before and after values.
- Filters.

Acceptance:

- Events are read-only.
- Timestamps are exact.
- Sensitive events have clear severity labels.

## Feature folder guidance

Use `src/features/` for business logic and feature-specific components.

Recommended shape:

```text
src/features/assignments/
  components/
  hooks/
  services/
  types.ts
  utils.ts
```

Rules:

- Shared visual components go in `src/components/`.
- Feature-specific components stay in the feature folder.
- API calls should go through `src/lib/api-client.ts`.
- Query keys should come from `src/lib/query-keys.ts`.
- Permission checks should use `src/lib/permissions.ts` and `src/lib/route-policy.ts`.

## Task assignment advice

To avoid confusion, assign work like this:

```text
Developer A: Build DataTable shared component
Developer B: Build DetailDrawer shared component
Developer C: Build Employee Home page using shared components
Developer D: Build Department Assignments page using DataTable and DetailDrawer
Developer E: Build ApprovalInbox component and Work Admin Approvals page
```

Build shared components first. Then pages become easier and more consistent.
