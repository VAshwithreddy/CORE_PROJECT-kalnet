# Frontend Documentation

Use this folder as the working guide for frontend development.

## Start here

1. Read `CORE_DESIGN_SYSTEM.md` for the product-wide design rules.
2. Read the page doc for the area you are assigned.
3. Read the component doc for the shared component you are using or building.
4. Use `frontend/src/design/tokens.css` and `frontend/src/design/tokens.ts` for colors, spacing, typography, radii, and shadows.

## Main docs

- `CORE_DESIGN_SYSTEM.md`: complete design system and visual rules.
- `PAGE_AND_COMPONENT_SPECS.md`: full combined page and component specification.

## Separate page docs

- `pages/public-auth.md`
- `pages/employee.md`
- `pages/department.md`
- `pages/executive.md`
- `pages/work-admin.md`
- `pages/system-admin.md`

## Separate component docs

- `components/shells.md`
- `components/data-table.md`
- `components/detail-drawer.md`
- `components/planner-board.md`
- `components/approval-inbox.md`
- `components/audit-timeline.md`
- `components/command-palette.md`
- `components/status-and-feedback.md`

## Rule for developers

Do not invent a new pattern if a documented pattern already exists. If a new pattern is truly needed, update the relevant doc in this folder during the same pull request.
