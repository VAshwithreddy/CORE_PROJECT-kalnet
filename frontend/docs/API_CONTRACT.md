# CORE Management Platform - API Contract (Draft)

This document outlines the expected REST API endpoints the frontend will require once a real backend is implemented. The frontend is currently built against a mock client-side database (`mock-db.ts`). These endpoints represent the necessary data models and mutations to replace the mock data layer.

## Authentication & Session
- `GET /api/v1/auth/session` - Returns the currently authenticated user (`CoreUser`) and their active role.
- `POST /api/v1/auth/role` - Switch the active user role (used by Role Switcher).

## Users & Roles
- `GET /api/v1/users` - List all users in the system (System Admin view).
- `GET /api/v1/users/:id` - Get details for a specific user.
- `PATCH /api/v1/users/:id/status` - Suspend or reactivate a user.
- `GET /api/v1/roles/permissions` - List all available permissions and their mappings to roles.

## Requests (Intake & Approvals)
- `GET /api/v1/requests` - List all requests. Supports filtering by `status`, `assignee`, and `submitter`.
- `POST /api/v1/requests` - Create a new request (Employee view).
- `PATCH /api/v1/requests/:id` - General update for a request.
- `POST /api/v1/requests/:id/route` - Route a request to a specific department.
- `POST /api/v1/requests/:id/approve` - Approve a request.
- `POST /api/v1/requests/:id/reject` - Reject a request.

## Work Assignments
- `GET /api/v1/assignments` - List all active assignments. Supports filtering by `departmentId`, `ownerId`, and `status`.
- `POST /api/v1/assignments` - Create a new work assignment (Department Planner view).
- `PATCH /api/v1/assignments/:id` - Update assignment progress, status, or details (Employee Work view).
- `POST /api/v1/assignments/:id/blocker` - Raise a blocker for a specific assignment.
- `DELETE /api/v1/assignments/:id/blocker` - Resolve a blocker.

## Dashboards & Summaries
- `GET /api/v1/metrics/executive` - Retrieve aggregated metrics for the Executive Dashboard (e.g., active projects, total headcount, blocked items).
- `GET /api/v1/departments/:id/summary` - Retrieve health and capacity metrics for a specific department.
- `GET /api/v1/departments/:id/team` - List team members in a department and their current capacity.

## Notifications
- `GET /api/v1/notifications` - Retrieve unread and read notifications for the current user.
- `POST /api/v1/notifications/:id/read` - Mark a notification as read.

## Audit Log
- `GET /api/v1/audit` - Retrieve audit events (System/Work Admin view). Supports filtering by `actor`, `action`, or `target`.
- `POST /api/v1/audit` - Append an event to the audit log (Internal API).
