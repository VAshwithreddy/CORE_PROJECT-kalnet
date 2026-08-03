# Employee Pages

Use this doc for:

- `src/app/employee/home`
- `src/app/employee/my-work`
- `src/app/employee/profile`
- `src/app/employee/requests`
- `src/app/employee/notifications`

## Shared employee pattern

Employee pages should be personal, direct, and task-focused.

Use `employee-shell` with:

- Home.
- My work.
- Requests.
- Notifications.
- Profile.

The employee should always understand:

- What work is assigned to me?
- What is due soon?
- What is blocked?
- What action should I take next?

## Employee home

Purpose: daily command center.

Required sections:

- Alert strip for blocked or overdue work.
- Metric cards: assigned today, due this week, blocked, completed.
- `My work` preview table.
- Recent notifications.
- Upcoming deadlines.

Interactions:

- Clicking a metric filters the work list.
- Clicking an assignment opens `detail-drawer`.
- Quick actions allow status update and blocker creation.

## My work

Purpose: manage personal assignments.

Required features:

- Search.
- Filters: status, priority, due date, project.
- Sort by due date, priority, and project.
- Table view.
- Optional board view.
- Assignment detail drawer.

Assignment actions:

- Update status.
- Add progress note.
- Raise blocker.
- Add file or link if supported.

States:

- Empty: `No assignments yet`.
- Loading: skeleton table rows.
- Error: retry loading assignments.

## Profile

Purpose: view and edit safe personal profile information.

Required sections:

- Avatar, name, role, department, manager.
- Personal info.
- Skills.
- Availability.
- Preferences.

Rules:

- Employee-editable fields should be obvious.
- Role, department, and manager are read-only unless the user has admin permission.
- Restricted fields should explain who can change them.

## Requests

Purpose: create and track employee requests.

Required features:

- Create request.
- Request table.
- Status tracking.
- Request timeline.
- Cancel request if still pending.
- Respond to requested changes.

Table columns:

- Request type.
- Status.
- Submitted date.
- Current owner.
- Last update.

## Notifications

Purpose: show actionable alerts and notification settings.

Required sections:

- Tabs: unread, all, settings.
- Notification list grouped by date.
- Preferences panel.

Interactions:

- Mark read or unread.
- Filter by notification type.
- Open related assignment, project, request, or approval.

Rule:

- Important alerts should remain visible until acknowledged or resolved.
