# Executive Pages

Use this doc for:

- `src/app/executive/overview`
- `src/app/executive/departments`
- `src/app/executive/portfolio`
- `src/app/executive/risks`
- `src/app/executive/digest`
- `src/app/executive/reports`

## Shared executive pattern

Executive pages should show signal, trends, risk, and decisions. Avoid operational noise unless the executive drills down.

Use `executive-shell` with:

- Overview.
- Departments.
- Portfolio.
- Risks.
- Digest.
- Reports.

Every metric should link to the evidence behind it.

## Overview

Purpose: organization-wide performance and risk view.

Required sections:

- Executive KPI strip.
- Department comparison.
- Risk and blocker summary.
- Portfolio trend chart.
- Decision queue.

Interactions:

- Time period selector changes all metrics.
- Clicking a KPI opens the filtered supporting data.

## Departments

Purpose: compare department performance and health.

Required features:

- Department comparison table.
- Health cards.
- Trend chart for selected metric.
- Filters by business unit or period.

Signals:

- Capacity.
- Delivery.
- Blockers.
- Risk.
- Completion.

Rule:

- Highlight outliers and departments needing support.

## Portfolio

Purpose: show strategic project portfolio.

Required sections:

- Portfolio roadmap.
- Project health table.
- Strategic theme filters.
- Risk and dependency summary.

Features:

- Track milestones.
- View cross-department projects.
- Export portfolio report.

## Risks

Purpose: manage organization-level risk visibility.

Required features:

- Risk heatmap or priority matrix.
- Risk register table.
- Mitigation detail drawer.
- Filters by severity, probability, owner, department.

Actions:

- Assign mitigation owner.
- Track mitigation progress.
- Escalate risk.
- Close risk.

Accessibility:

- Risk color must always include text labels.

## Digest

Purpose: leadership-ready briefing.

Required sections:

- Time range selector.
- Audience selector.
- Executive summary.
- Key movements.
- Risks and blockers.
- Decisions needed.

Features:

- Generate digest from source data.
- Edit before sending.
- Save digest history.

## Reports

Purpose: build and export reports.

Required features:

- Report templates.
- Saved reports table.
- Report builder panel.
- Preview before export.
- Export PDF or spreadsheet.

Rule:

- Report settings must be reviewable before export.
