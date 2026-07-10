# CommandPalette Component

Use this doc for `components/command-palette`.

## Purpose

CommandPalette lets power users quickly navigate to pages, records, and safe actions.

## Search targets

Recommended groups:

- Pages.
- People.
- Assignments.
- Projects.
- Requests.
- Reports.
- Recent.

## Behavior

- Opens with keyboard shortcut.
- Closes with Escape.
- Supports keyboard navigation.
- Shows grouped results.
- Respects role permissions.
- Shows recent pages.

## Actions

Allowed:

- Navigate to page.
- Open record.
- Start safe creation flow.
- Open report builder.

Not allowed directly:

- Delete.
- Revoke.
- Approve high-risk request.
- Disable user.
- Rotate service account token.

## Result content

Each result should have:

- Clear title.
- Type label.
- Optional metadata.
- Icon where useful.

## Accessibility

- Search input needs label.
- Results need active descendant or equivalent accessible pattern.
- Keyboard focus must remain predictable.
