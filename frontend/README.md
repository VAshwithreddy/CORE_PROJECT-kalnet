# Frontend

This folder contains the frontend architecture from the reference image.

## Folder map

```text
src/
  app/
    landing/
    login/
    forbidden/
    employee/
      home/
      my-work/
      profile/
      requests/
      notifications/
    department/
      home/
      team/
      projects/
      assignments/
      planner/
      blockers/
      digest/
    executive/
      overview/
      departments/
      portfolio/
      risks/
      digest/
      reports/
    work-admin/
      home/
      intake/
      routing/
      department-heads/
      approvals/
      escalations/
      audit/
    system/
      users/
      roles/
      permissions/
      service-accounts/
      audit/
      settings/
  components/
    employee-shell/
    department-shell/
    executive-shell/
    work-admin-shell/
    system-admin-shell/
    command-palette/
    data-table/
    detail-drawer/
    planner-board/
    approval-inbox/
    audit-timeline/
  features/
    employee/
    department/
    executive/
    work-admin/
    system-admin/
    assignments/
    projects/
    people/
    digest/
    alerts/
  lib/
    api-client.ts
    auth.ts
    route-policy.ts
    permissions.ts
    scope.ts
    query-keys.ts
```

## Design guidance

Before building frontend pages or components, read:

- `frontend/docs/CORE_DESIGN_SYSTEM.md`
- `frontend/docs/PAGE_AND_COMPONENT_SPECS.md`
- `frontend/src/design/README.md`

Use the shared design tokens in `frontend/src/design/tokens.css` and `frontend/src/design/tokens.ts` so every page looks like one product.

## What each folder is for

`src/app/` is for application pages and routes.

`src/components/` is for reusable UI pieces such as tables, drawers, shells, timelines, and shared layout components.

`src/features/` is for feature-level logic grouped by business area, such as assignments, projects, people, digest, and alerts.

`src/lib/` is for shared helpers like API calls, authentication, permissions, route rules, user scope, and query keys.

## How to add a future frontend route

Example: adding an employee calendar page.

```bash
mkdir frontend/src/app/employee/calendar
```

Then add the page file when implementation starts:

```text
frontend/src/app/employee/calendar/page.tsx
```

## How to add a future component

Example: adding a status badge component.

```text
frontend/src/components/status-badge/index.tsx
```

## How to add a future feature

Example: adding attendance logic.

```text
frontend/src/features/attendance/
```

If a new folder is empty, add a `.gitkeep` file inside it so Git saves the folder.
