# Department Pages

Use this doc for:

- `src/app/department/home`
- `src/app/department/team`
- `src/app/department/projects`
- `src/app/department/assignments`
- `src/app/department/planner`
- `src/app/department/blockers`
- `src/app/department/digest`

## Shared department pattern

Department pages should help department heads understand team health, workload, and risk.

Use `department-shell` with:

- Home.
- Team.
- Projects.
- Assignments.
- Planner.
- Blockers.
- Digest.

Every department page should include department scope and permission awareness.

## Department home

Purpose: department health dashboard.

Required sections:

- Department scope selector.
- Metrics: active projects, open assignments, blocked work, overdue items, team capacity.
- Blockers preview.
- Team workload view.
- Recent activity.

Interactions:

- Clicking a metric opens the related filtered table.
- At-risk work should be visually prioritized.

## Team

Purpose: view people, load, skills, and availability.

Required features:

- Search.
- Filters: role, skill, availability, load, status.
- Team member data table.
- Employee detail drawer.

Table columns:

- Name.
- Role.
- Current load.
- Availability.
- Active assignments.
- Blockers.

## Projects

Purpose: manage department project visibility.

Required features:

- Project metrics.
- Search.
- Filters: status, owner, risk, due date.
- Project table.
- Project detail drawer or page.

Project row should show:

- Status.
- Health.
- Owner.
- Due date.
- Next milestone.

## Assignments

Purpose: assign, monitor, and rebalance work.

Required features:

- Create assignment.
- Search and filters.
- Sortable assignment table.
- Batch selection for safe updates.
- Assignment detail drawer.

Actions:

- Assign owner.
- Change priority.
- Update due date.
- Escalate blocked work.

Rule:

- Batch mode appears only after selection.

## Planner

Purpose: plan work across people and time.

Required views:

- Board.
- Calendar.
- Timeline.

Required features:

- Capacity indicators.
- Drag and drop.
- Keyboard movement alternative.
- Filters by project, owner, priority.
- Assignment detail drawer.

Rule:

- Moving work should validate permissions and capacity.

## Blockers

Purpose: triage blocked work.

Required features:

- Priority blocker queue.
- Filters: severity, age, owner, project.
- Blocker detail drawer.
- Assign owner.
- Resolve blocker.
- Escalate blocker.

Rule:

- Old and severe blockers should be prominent.
- Resolved blockers remain visible in history.

## Digest

Purpose: create department progress summaries.

Required sections:

- Date range selector.
- Summary cards.
- Highlights.
- Risks.
- Blockers.
- Decisions needed.

Features:

- Generate digest.
- Edit before sharing.
- Export or send.
- Link statements back to source records.
