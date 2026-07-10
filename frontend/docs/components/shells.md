# Role Shell Components

Use this doc for:

- `components/employee-shell`
- `components/department-shell`
- `components/executive-shell`
- `components/work-admin-shell`
- `components/system-admin-shell`

## Purpose

Shell components provide consistent page layout, navigation, top bar behavior, and role-specific context.

## Shared shell anatomy

Every shell should include:

- Sidebar navigation.
- Top bar.
- Main content region.
- User menu.
- Notification entry.
- Command palette trigger.
- Breadcrumb support.
- Current role or scope indicator.

## Desktop behavior

- Sidebar width: 248px to 280px.
- Top bar height: 56px to 64px.
- Main content uses full available width with readable max width.

## Mobile behavior

- Sidebar becomes a drawer.
- Top bar keeps current page title and menu button.
- Main action remains easy to reach.

## Employee shell

Navigation:

- Home.
- My work.
- Requests.
- Notifications.
- Profile.

Special behavior:

- Show personal overdue and blocked counts.
- Keep navigation simple and personal.

## Department shell

Navigation:

- Home.
- Team.
- Projects.
- Assignments.
- Planner.
- Blockers.
- Digest.

Special behavior:

- Department scope selector.
- Team capacity indicator.
- Blocker shortcut.

## Executive shell

Navigation:

- Overview.
- Departments.
- Portfolio.
- Risks.
- Digest.
- Reports.

Special behavior:

- Time period selector.
- Organization scope selector.
- Decision queue shortcut.

## Work admin shell

Navigation:

- Home.
- Intake.
- Routing.
- Department heads.
- Approvals.
- Escalations.
- Audit.

Special behavior:

- Queue counters.
- SLA breach indicator.
- Admin search.

## System admin shell

Navigation:

- Users.
- Roles.
- Permissions.
- Service accounts.
- Audit.
- Settings.

Special behavior:

- Security warning patterns.
- Confirmation entry points for risky changes.
- Audit-first navigation.
