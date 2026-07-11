# Work Admin Pages

Use this doc for:

- `src/app/work-admin/home`
- `src/app/work-admin/intake`
- `src/app/work-admin/routing`
- `src/app/work-admin/department-heads`
- `src/app/work-admin/approvals`
- `src/app/work-admin/escalations`
- `src/app/work-admin/audit`

## Shared work admin pattern

Work admin pages should manage queues, routing, exceptions, approvals, and operational control.

Use `work-admin-shell` with:

- Home.
- Intake.
- Routing.
- Department heads.
- Approvals.
- Escalations.
- Audit.

Every admin decision must be auditable.

## Home

Purpose: operational command center.

Required sections:

- Queue metrics: intake, routing, approvals, escalations, SLA breaches.
- Work queue table.
- Recent audit events.
- Bottleneck summary.

Interactions:

- Clicking a metric opens the relevant queue.

## Intake

Purpose: create structured incoming work.

Required features:

- Intake form.
- Template selector.
- Recent submissions.
- Required field validation.
- Attachment or link support if needed.

Behavior:

- Prevent incomplete or ambiguous requests.
- After submission, show request ID and next step.

## Routing

Purpose: route incoming work to department or owner.

Required features:

- Unrouted queue.
- Rule suggestions.
- Manual assignment panel.
- Filters by request type, priority, department, SLA.
- Bulk routing for safe items.

Rule:

- Manual overrides require a reason.

## Department heads

Purpose: manage department ownership and delegation.

Required features:

- Department list.
- Current head.
- Delegates.
- Effective dates.
- Coverage gaps.
- Change history drawer.

Rule:

- Changes affect approvals and routing, so confirmation is required.

## Approvals

Purpose: process approval requests.

Required layout:

- Approval queue.
- Approval detail panel.
- Decision footer.

Required actions:

- Approve.
- Reject with required reason.
- Request changes.
- Delegate.

Rule:

- High-risk approvals should not allow bulk approval.
- Every decision must create an audit event.

## Escalations

Purpose: manage escalated work and SLA risk.

Required features:

- Escalation queue.
- Severity filters.
- Owner and next-action panel.
- Stakeholder notification.
- Resolve or re-escalate.

Rule:

- Every escalation needs owner, due date, and latest update.

## Audit

Purpose: administrative audit history.

Required features:

- Audit table.
- Filters by actor, action, object, date.
- Detail drawer.
- Export if permitted.

Rule:

- Audit data is read-only.
