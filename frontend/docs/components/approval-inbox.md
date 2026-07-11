# ApprovalInbox Component

Use this doc for `components/approval-inbox`.

## Purpose

ApprovalInbox helps users review, decide, and audit approval requests.

Use it for:

- Work admin approvals.
- Department approvals.
- High-risk workflow approvals.

## Layout

Desktop:

- Queue on the left.
- Detail review on the right.
- Decision footer.

Mobile:

- Queue first.
- Detail opens as full-screen drawer.

## Queue item content

Each item should show:

- Request title.
- Requester.
- Request type.
- Priority.
- Due date or SLA.
- Current status.

## Detail panel

Detail panel should include:

- Summary.
- Request details.
- Policy or rule context.
- Impact.
- History.
- Comments.

## Actions

Required:

- Approve.
- Reject.
- Request changes.
- Delegate.

Rules:

- Reject requires a reason.
- Request changes requires a note.
- High-risk approvals cannot be bulk approved.
- Every decision creates an audit event.

## States

- Empty: `No approvals waiting`.
- Loading: skeleton queue and detail.
- Error: retry loading queue.
- Permission denied: explain approval permission needed.
