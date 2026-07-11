# Frontend

This folder contains the CORE frontend. It is set up as a Next.js and TypeScript app using the existing role-based architecture.

## Run locally

```bash
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

The frontend expects the backend API base URL in:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Current setup

The setup now includes:

- `package.json` with Next.js scripts.
- `tsconfig.json` with the `@/*` import alias.
- `src/app/layout.tsx` and `src/app/globals.css`.
- A setup landing page at `/`.
- Starter role pages for employee, department, work admin, executive, and system admin areas.
- Shared API helper in `src/lib/api-client.ts`.

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
- `frontend/docs/README.md`
- `frontend/src/design/README.md`

Use the shared design tokens in `frontend/src/design/tokens.css` and `frontend/src/design/tokens.ts` so every page looks like one product.

## First frontend build target

Build the MVP pages in this order:

1. Login and role redirect.
2. Work admin intake and routing.
3. Department assignments and blockers.
4. Employee home and my work.
5. Audit timeline for important changes.

Do not build every page at once. First complete one working flow from intake to assignment update.

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
