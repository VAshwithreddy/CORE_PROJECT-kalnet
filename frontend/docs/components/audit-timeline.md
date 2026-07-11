# AuditTimeline Component

Use this doc for `components/audit-timeline`.

## Purpose

AuditTimeline shows what changed, who changed it, and when.

Use it for:

- Assignment history.
- Approval decisions.
- Routing overrides.
- Role and permission changes.
- Service account activity.
- Admin audit pages.

## Event content

Each event should include:

- Actor.
- Action.
- Timestamp.
- Object.
- Previous value if relevant.
- New value if relevant.
- Reason or comment if provided.

## Display rules

- Use exact timestamps.
- Sort newest first in detail drawers unless the page context needs chronological flow.
- Use neutral language.
- Highlight security-sensitive events.
- Keep audit logs read-only.

## Filters

Common filters:

- Actor.
- Action type.
- Object type.
- Date range.
- Severity.

## Accessibility

- Do not rely only on timeline icons.
- Event text must describe the action clearly.
- Long event lists should support keyboard navigation and pagination or lazy loading.
