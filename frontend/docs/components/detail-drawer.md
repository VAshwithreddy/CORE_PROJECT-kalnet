# DetailDrawer Component

Use this doc for `components/detail-drawer`.

## Purpose

DetailDrawer lets users inspect or edit a record without losing the list, board, or dashboard context behind it.

Use it for:

- Assignment details.
- Project details.
- Employee details.
- Request details.
- Approval details.
- Audit event details.

## Anatomy

- Header.
- Title.
- Status badge.
- Close button.
- Summary section.
- Content sections or tabs.
- Activity or timeline.
- Footer actions when needed.

## Behavior

- Opens from the right.
- Main page remains visible behind it.
- Focus moves into the drawer when opened.
- Escape closes the drawer if there are no unsaved changes.
- Focus returns to the trigger after close.
- Unsaved changes require confirmation before closing.

## Recommended tabs

Use tabs only when there is enough information to justify them.

Common tabs:

- Details.
- Activity.
- Files.
- Comments.
- Audit.

## Footer actions

Footer actions should match the record state.

Examples:

- Save.
- Approve.
- Reject.
- Request changes.
- Assign.
- Close.

Rules:

- Use one primary action.
- Destructive actions need confirmation.
- Disabled actions need an explanation.

## Mobile behavior

- Drawer becomes full-screen.
- Header remains sticky.
- Footer remains sticky when actions are present.
