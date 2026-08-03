# Status and Feedback Components

Use this doc for:

- Status badges.
- Metric cards.
- Empty states.
- Error states.
- Loading states.
- Toasts and banners.

## StatusBadge

Purpose: communicate state consistently.

Recommended statuses:

| Status | Meaning |
| --- | --- |
| New | Item was created and not started |
| In progress | Work has started |
| Waiting | Work is paused for dependency or response |
| Blocked | Work cannot continue |
| Approved | Request was approved |
| Rejected | Request was rejected |
| Completed | Work is done |
| Archived | Item is no longer active |

Rules:

- Use text plus color.
- Use the same label everywhere.
- Do not use only a dot.

## MetricCard

Purpose: show one important metric.

Required content:

- Label.
- Value.
- Time range or scope.
- Change from comparison period when useful.
- Link to supporting data.

Rules:

- One metric per card.
- Metrics should lead to action or insight.
- Do not use decorative charts without meaning.

## EmptyState

Purpose: explain missing data and next step.

Required content:

- Short title.
- One sentence explanation.
- Primary action if the user can fix it.

Examples:

- `No assignments yet`.
- `No blockers reported`.
- `No approvals waiting`.

## ErrorState

Purpose: help users recover.

Required content:

- What failed.
- Why if known.
- Retry action.
- Support path if retry fails.

Form errors:

- Show top-level error summary.
- Show field-level error messages.
- Preserve user input.

## LoadingState

Purpose: show that content is coming.

Rules:

- Use skeletons for tables, cards, and detail sections.
- Use spinner only for very small actions.
- Avoid layout shift after loading completes.

## Toasts and banners

Toast:

- Use for short success or low-risk confirmation.

Banner:

- Use for important page-level alerts.

Rules:

- Errors should not disappear too quickly.
- Success messages should confirm what changed.
