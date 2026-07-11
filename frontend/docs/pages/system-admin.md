# System Admin Pages

Use this doc for:

- `src/app/system/users`
- `src/app/system/roles`
- `src/app/system/permissions`
- `src/app/system/service-accounts`
- `src/app/system/audit`
- `src/app/system/settings`

## Shared system admin pattern

System pages are high-trust, high-risk admin areas. They should be clear, searchable, and careful with destructive actions.

Use `system-admin-shell` with:

- Users.
- Roles.
- Permissions.
- Service accounts.
- Audit.
- Settings.

High-risk changes require confirmation and audit logging.

## Users

Purpose: manage user accounts.

Required features:

- Users table.
- Invite user action.
- User detail drawer.
- Activate or deactivate user.
- Assign role and department.
- Reset MFA or session if supported.

Filters:

- Role.
- Status.
- Department.

Rule:

- Deactivation requires confirmation.
- Role changes should show permission impact.

## Roles

Purpose: manage role definitions.

Required features:

- Role list.
- Role detail panel.
- Permission summary.
- Assigned users.
- Custom role editing if supported.

Rule:

- Role changes are high-risk and must be confirmed.

## Permissions

Purpose: manage permission matrix.

Required features:

- Matrix by role and permission.
- Search permissions.
- Compare roles.
- Change summary panel.
- Sensitive permission warnings.

Rule:

- Users must review permission changes before saving.

## Service accounts

Purpose: manage machine/API accounts.

Required features:

- Service account table.
- Create service account.
- Rotate token.
- Disable account.
- Set scopes.
- Last used timestamp.

Rule:

- Secret values should show once only.
- Token rotation and disable actions require confirmation.

## Audit

Purpose: global audit center.

Required features:

- Audit search.
- Filters by date range, actor, object, action, severity.
- Audit table.
- Detail drawer.
- Export if permitted.

Rule:

- Audit events are read-only.

## Settings

Purpose: organization-level configuration.

Required sections:

- Organization profile.
- Integrations.
- Notification policies.
- Security settings.
- Workflow defaults.

Rule:

- Low-risk preferences can autosave.
- Security and workflow settings require explicit save and confirmation.
