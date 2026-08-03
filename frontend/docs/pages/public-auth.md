# Public and Auth Pages

Use this doc for:

- `src/app/landing`
- `src/app/login`
- `src/app/forbidden`

## Shared design direction

These pages should be clear, trustworthy, and simple. They are the first screens users see before entering the role-based product.

Use restrained branding, strong readable typography, and one clear next action.

## Landing

Purpose: introduce CORE and route the user to the correct workspace.

Primary users:

- New users.
- Signed-out users.
- Signed-in users who need role-based redirection.

Required sections:

- Product identity.
- Short explanation of CORE: work, assignments, approvals, blockers, projects, reporting.
- Primary action: `Sign in` or `Continue to workspace`.
- Optional role cards for employee, department, executive, work admin, and system admin.

Behavior:

- If user is signed out, show sign-in action.
- If user is signed in, redirect to their role home page.
- If user has no valid role, redirect to forbidden page.

States:

- Loading while checking session.
- Error if authentication status cannot be checked.

## Login

Purpose: authenticate users securely.

Required features:

- Organization identity.
- SSO option if available.
- Email/password fallback if required.
- Password visibility toggle.
- Forgot password link if supported.
- MFA step if enabled.
- Clear error text for failed login.

Behavior:

- Preserve entered email after failed login.
- Do not reveal whether a specific email exists.
- Redirect by role after successful login.

Accessibility:

- Every input needs a visible label.
- Login errors must be text, not color only.
- Form can be completed by keyboard.

## Forbidden

Purpose: explain that the user cannot access the requested page.

Required content:

- Title: `You do not have access`.
- Signed-in user email.
- Required role or permission if known.
- Actions: `Request access`, `Go home`, `Sign out`.

Behavior:

- Log access-denied events for admins.
- Help the user recover instead of leaving them at a dead end.
