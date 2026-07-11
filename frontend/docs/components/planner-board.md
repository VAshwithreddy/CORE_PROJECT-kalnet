# PlannerBoard Component

Use this doc for `components/planner-board`.

## Purpose

PlannerBoard helps teams plan and rebalance work across owners, statuses, or time.

Use it for:

- Department planner.
- Assignment planning.
- Capacity balancing.
- Sprint or weekly planning.

## Views

Recommended views:

- Board by status.
- Board by owner.
- Calendar view.
- Timeline view.

## Anatomy

- Toolbar.
- View switcher.
- Filters.
- Columns or lanes.
- Cards.
- Capacity indicators.
- Empty column states.

## Card content

Each card should show:

- Title.
- Status.
- Priority.
- Owner.
- Due date.
- Blocker indicator if blocked.

## Interactions

Allowed:

- Drag and drop.
- Keyboard move action.
- Open card in detail drawer.
- Filter by owner, project, priority, department.

Rules:

- Do not rely only on drag and drop.
- Validate permissions before moving work.
- Show capacity warnings before overload happens.
- Every reassignment should create an audit event.

## Capacity indicators

Capacity should show:

- Current load.
- Recommended load.
- Overload warning.
- Available capacity.

Use text plus color.
