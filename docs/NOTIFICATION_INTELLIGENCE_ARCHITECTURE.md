# CORE — AI-Powered Notification & Alert Intelligence System
## Architecture Assessment & Implementation Record

Status: Layer A (deterministic) complete and tested. Layer B (AI) built and tested,
disabled by default (`AI_ENABLED=false`). Frontend wired with a documented fallback.
Phases 9–13 of the original spec (smart grouping, AI-driven prioritization ranking,
manager/executive aggregate dashboards, full frontend redesign) are deliberately not
started — see "What's deliberately not done" at the end.

---

## 1. Repository inspection findings (Phase 0)

Before any code was written, the actual repository (not just the task spec) was
inspected. Several findings changed the design materially:

- **The `notifications` table already had an API-facing shape that differs from
  what a first read of the SQLAlchemy model suggested.** The model in the original
  zip declared a required `title` column and no `action_url`. The real Supabase
  table (confirmed against a schema screenshot and explicit column list provided
  mid-task) has no `title` and does have `action_url`. This would have caused every
  `INSERT` to fail against the real database despite passing every test locally,
  because local tests bootstrap via `Base.metadata.create_all()` from the same
  model file that was wrong. **Fixed**: `title` removed, `action_url` added,
  `message` is the single display string. See `models/notification.py`.
- **`Notification` had zero API surface.** No router, service, or schema referenced
  it anywhere — it was a bare table. This is being built from scratch, not extended.
- **`StalenessAlert` is the only pre-existing "alert" concept**, and it has no live
  detection job — the only place a row was ever created was a one-time dev-seed in
  `core/database.py`. Per instruction not to build a competing detection engine,
  no new detection logic was added; instead the one creation path was centralized
  into `AlertsService.report_stale_assignment()`, which now also produces guaranteed
  notifications. Whenever a real detection job is added later, it should call this
  function instead of inserting into `staleness_alerts` directly.
- **`WeeklyDigest` / the "AI digest" is a complete stub** (`services/digests.py`
  hardcodes `summary="Generated a new weekly digest."` and `model_version="gpt-4"` as
  a literal string — no model is ever called). There is no existing AI/LLM
  infrastructure to reuse; the AI layer here is new.
- **No scheduler or job queue exists.** Periodic work (deadline/overdue checks, AI
  enrichment) is exposed as explicit endpoints for an external scheduler to call,
  matching the existing `POST /api/v1/digests/weekly/run` pattern — not a new Celery/
  cron dependency.
- **Blockers are not a first-class entity.** "Blocked" only exists as
  `StatusUpdate.status`, and — importantly — **posting a status update never
  updates `Assignment.status`**; they are independent fields that nothing
  previously kept in sync. The rules engine treats `StatusUpdate` as the
  authoritative, real-time signal and derives blocker lifecycle (open since when,
  how long) from its history rather than mirroring it into a new table.
- **The frontend has no real backend session at all.** `lib/mock-session.ts` is a
  client-side demo-persona switcher (ids like `"EMP-014"`, stored in `localStorage`)
  with no login flow that ever calls the backend's real JWT auth. This is a
  pre-existing gap across the *entire* frontend, not specific to notifications —
  see "Frontend integration" below for how this was handled honestly rather than
  papered over.
- **Some DB columns are native Postgres enum types in production but declared as
  plain `String` in SQLAlchemy** (e.g. `Person.role` ↔ `person_role`,
  `StalenessAlert.severity`/`status`). This confirmed the production schema was
  built from separate hand-authored DDL, not from `create_all()`. New notification
  fields deliberately follow the plain-string convention (matching
  `Notification.type`, `Assignment.status`, `Project.priority`) specifically to
  avoid `ALTER TYPE ... ADD VALUE` migration friction — the same friction visible in
  `migrations/002_add_new_roles.sql`.

## 2. Security finding (reported separately, repeated here for the record)

Previously, local utility files exposed database and signing credentials. The
utilities have been removed, generated tokens are ignored, and deployments must
use deployment-managed secrets. Rotate any credentials that were used before
this remediation.

Also found, and fixed, since it directly affects notification data quality: the
dev-seed in `core/database.py` set a seed `Assignment.status` to `"active"`, which
does not exist in the `on_track | blocked | done` status set — the same "ghost
status" bug independently visible in `services/dashboards.py`'s dead
`a.status == "active"` check (not fixed — unrelated file, out of scope).

## 3. Two-layer architecture, as built

```
CORE domain event (assignment created/updated, status update, project update)
        │
        ▼
NotificationRulesEngine   (services/notifications.py — Layer A, deterministic)
        │
        ▼
NotificationService.deliver()   → guaranteed row in `notifications`
        │
        ▼ (optional, separate call, never inline)
NotificationIntelligenceService   (services/notification_intelligence.py — Layer B)
        │
        ▼
`notification_enrichments` (1:1, advisory only)
```

Layer A has zero import of, or dependency on, anything AI-related. Layer B can be
deleted entirely and Layer A keeps working exactly as before — this is enforced by
file boundaries (Layer B is a separate module) and by tests
(`test_notification_intelligence.py` asserts AI output never touches the
underlying `Notification` row).

### Why no new `Blocker` table
"Blocked" is derived from `StatusUpdate` history at read time
(`get_current_blocker_state`) rather than mirrored into a new table: it keeps a
single source of truth, needed no migration to the core work-tracking domain, and
is only ever computed for the bounded set of currently-blocked assignments (not a
full-table scan). Trade-off: querying blocker age costs a small bounded query per
assignment during the sweep, instead of an O(1) column read. If the product later
wants richer blocker metadata (categories, manual severity override, comments), a
dedicated table is the natural next step — the original `frontend/docs/
API_CONTRACT.md` draft anticipated a `/assignments/:id/blocker` endpoint that was
never built, which would be the natural trigger for that change.

### Dedup design
Two layers, not one:
1. **Transition-based emission** — `BLOCKER_CREATED`/`BLOCKER_RESOLVED` only fire
   when `StatusUpdate.status` actually *changes into or out of* `"blocked"`,
   compared against the immediately-prior status update. A second consecutive
   "blocked" update produces no new event. This is the primary mechanism, and
   needs no key-based dedup at all.
2. **`dedup_key` + a partial UNIQUE index** — for anything that could otherwise
   repeat (a scheduler running the sweep multiple times a day; two near-
   simultaneous requests), every draft that should be deduplicated carries a
   `dedup_key`, and `migrations/003_notification_system.sql` adds
   `CREATE UNIQUE INDEX ... WHERE dedup_key IS NOT NULL`. The application-level
   pre-check in `NotificationService.deliver()` is a fast path only — the *actual*
   guarantee under concurrent requests is the database constraint; a lost race
   raises `IntegrityError`, which is caught and treated as "already delivered," not
   an error. Sweep-driven types (deadline/overdue/escalation) scope their key to
   the calendar day, so a persistent condition still reminds daily rather than
   going silent forever after the first notification.

### Employee identity
Every message is built from `Person.full_name`, resolved server-side
(`assignment_person_name()`, `get_person()`) from the real `people` table — never
from caller-supplied data, never invented. The recipient's own name is never
included in their own notification (`"You reported a blocker..."`, not
`"{name} reported a blocker..."`); other people's real names are used when
relevant to the recipient (a manager sees `"{employee.full_name} raised a critical
blocker on {project}"`, matching the requested example exactly). See
`test_staleness_alert_wiring_notifies_assignee_and_manager` and the blocker tests
in `test_notifications_rules_engine.py` for the enforced assertions, including an
explicit assertion that a person's own name is absent from their own message.

### Escalation recipients
`get_escalation_recipients()`: the assignee's manager, then the project's
department head, then — only if both are unset — any `work_admin`. A
critical/escalation-worthy event must never end up with zero recipients because
org data is incomplete; this fallback chain is unit-tested directly.

### No job queue
Two endpoints exist for an external scheduler (there is no Celery/cron in this
project and none was added):
- `POST /api/v1/notifications/sweep` — deadline/overdue/escalation checks
  (work_admin/system_admin only)
- `POST /api/v1/notifications/enrich-pending` — batch AI enrichment
  (work_admin/system_admin only)

Both mirror the existing `POST /api/v1/digests/weekly/run` pattern already in the
codebase.

## 4. AI layer (Layer B) — what it does and doesn't do

`services/notification_intelligence.py`, `NotificationIntelligenceService`:
- **Disabled by default** (`AI_ENABLED=false`). Every code path that reads
  `settings.ai_enabled` short-circuits to "no enrichment" — nothing calls out or
  writes anything unless explicitly turned on.
- **Provider call is isolated** in one function, `_call_anthropic()`, using `httpx`
  (already a project dependency) directly against `https://api.anthropic.com/v1/
  messages` — no new SDK dependency for one call type. Swapping providers later
  means changing this one function.
- **Structured output only.** The system prompt requires a single JSON object with
  a fixed shape; `_validate_ai_output()` then independently re-validates
  everything server-side regardless of what the model claims: `importance_score`
  clamped to 0–100, `risk_level` checked against a fixed enum (invalid values are
  dropped, not stored), `confidence` clamped to 0.0–1.0, all text fields truncated.
  Malformed JSON is discarded entirely, not partially parsed.
- **Prompt-injection aware.** All CORE text (blocker reasons, project names) is
  passed as a JSON blob explicitly labeled `CONTEXT_DATA` with an instruction that
  its contents are data to analyze, never instructions to follow.
- **Grounded only in CORE data.** `_build_context()` pulls the notification's own
  fields plus the linked assignment/project/recent status updates — nothing else,
  nothing sent that wasn't already scoped to this one notification.
- **Fails closed, always.** Timeout, HTTP error, network error, missing API key,
  unexpected exception, malformed JSON, or a value that fails validation all result
  in "no enrichment this time," never an exception reaching the caller and never a
  half-written row. If enrichment already existed from a prior run, a new failed
  attempt leaves the old enrichment in place rather than erasing it.
- **Never touches the Notification row.** `NotificationEnrichment` is a separate
  table, joined 1:1. `Notification.severity` (deterministic) is never overwritten
  by the AI's `risk_level` (advisory) — verified directly in
  `test_enrichment_never_touches_the_underlying_notification`.
- **Caches on a context fingerprint** (§19 cost control) — identical underlying
  state is not re-analyzed; verified in `test_identical_context_is_not_re_analyzed`.
- **Fully testable without a real API key.** Every test in
  `test_notification_intelligence.py` mocks at the `_call_anthropic` boundary; no
  network call is made during the test suite.

What it does *not* do (deliberately deferred): risk-based re-*prioritization* of
the notification list (spec Phase 9), AI-recommended escalation feeding back into
the deterministic escalation decision (Phase 11 — today's escalation is 100%
deterministic, by threshold), and AI-authored digests (Phase 12, since
`services/digests.py` itself is still a stub — extending a stub wasn't in scope
for this pass).

## 5. Frontend integration — what exists and the gap that was not papered over

Real, typed API calls now exist (`frontend/src/lib/notifications-api.ts`) for list/
read/read-all/acknowledge, and `employee/notifications/page.tsx` plus
`EmployeeShell`'s nav badge were rewired to use them. Field names mirror the real
backend response exactly (`message`, `action_url`, `severity`, no `title`).

**The gap**: this frontend has no working login flow anywhere — `mock-session.ts`
never acquires a real JWT for a real `people.id`. Building that bridge is a
separate, materially larger undertaking (real login UI, credential handling,
session persistence) than "wire up notifications," and touches auth architecture
across the whole app, not just this feature. Rather than either (a) silently
faking a session, or (b) leaving the new code uncallable, `lib/auth-token.ts`
isolates the gap behind one honestly-documented function, `getAuthToken()`, which
returns `null` until something calls `setAuthToken()` with a real token from
`POST /api/v1/auth/login`. Every real-API call site checks `hasRealSession()`
first and falls back to the existing `mock-db.ts` behavior when it's false — so
today's demo experience is completely unchanged, and the moment a real login flow
exists and calls `setAuthToken()`, the real data starts flowing with no further
change needed here.

`NotificationType` (frontend) was widened from 4 to 10 values to represent the
real backend categories (Blocker, Escalation, Deadline, etc.) precisely, rather
than either lying to the type checker with a cast or collapsing real distinctions
into "Assignment" for expedience.

AI insight (`ai_reason`, `recommended_action`) is appended to the message as
clearly-labeled additional text ("AI: ...", "Recommended: ...") rather than
replacing the deterministic message — matching the "distinguish CORE fact from AI
recommendation" requirement.

**Not done**: a dedicated bell/dropdown widget (the existing UI pattern is a nav-
link unread badge, which was extended rather than replaced, per "existing
architecture > invented architecture"); wiring the manager/department/executive-
facing pages (only the employee notifications page and shell badge were rewired).

## 6. Files changed

**New (backend):**
`src/models/notification_enrichment.py`, `src/schemas/notifications.py`,
`src/api/notifications.py`, `src/services/notifications.py`,
`src/services/notification_intelligence.py`,
`migrations/003_notification_system.sql`, `tests/conftest.py`,
`tests/test_notifications_models.py`, `tests/test_notifications_rules_engine.py`,
`tests/test_notifications_service.py`, `tests/test_notifications_integration.py`,
`tests/test_notification_intelligence.py`

**Modified (backend):** `src/models/notification.py` (schema-corrected),
`src/models/enums.py`, `src/models/__init__.py`, `src/core/config.py`,
`src/main.py`, `src/services/assignments.py`, `src/schemas/assignments.py`
(added a missing `person_id` field — see §7), `src/services/status_updates.py`,
`src/services/projects.py`, `src/services/alerts.py`, `src/core/database.py`,
`apply_migration.py`, `.env.example`

**New (frontend):** `src/lib/auth-token.ts`, `src/lib/notifications-api.ts`

**Modified (frontend):** `src/lib/mock-db.ts` (widened `NotificationType`, added
`actionUrl`), `src/app/employee/notifications/page.tsx`,
`src/components/employee-shell/index.tsx`

## 7. Bugs found and fixed along the way (not the original ask, but directly
   necessary or immediately adjacent)

1. **Sweep query excluded assignments with no deadline from escalation checks
   entirely** (should only affect the deadline-specific checks) — caught by
   `test_sweep_escalates_long_unresolved_blockers_on_critical_projects`, fixed.
2. **`AssignmentUpdate` schema was missing `person_id`** — `AssignmentsService.
   update_assignment` already had reassignment logic, but Pydantic silently
   dropped the field since it wasn't declared, making reassignment (and
   `WORK_REASSIGNED`) unreachable through the real API. Fixed by adding the field.
3. **Notification model/schema mismatch** (`title` vs `action_url`) — see §1.
4. **Seed data set `Assignment.status = "active"`**, not a valid status value —
   see §2.

## 8. Testing

70 new tests across 5 files, all passing; full suite: 71 passed. The 2 failures in
`tests/test_health.py` are pre-existing and unrelated (routes the tests expect —
`/health`, `/api/v1/setup-summary` — don't match the current router mounts; not
touched, out of scope).

Verification was not "does it look right" — an actual local PostgreSQL 16 instance
was stood up, `init_db()` and all migrations were run against it for real, and the
full acceptance scenario (assign → block → escalate → acknowledge → resolve → no
duplicates) runs end-to-end against a real database, not mocks.

## 9. What's deliberately not done

- Smart grouping ("4 items updated in Project Alpha") — spec Phase 10.
- AI-driven re-ranking of the notification list and AI-recommended escalation
  feeding into the deterministic decision — Phases 9 and 11; today's
  prioritization and escalation are both 100% deterministic.
- Manager/executive aggregate dashboards — `GET /api/v1/notifications` is
  intentionally caller-scoped-only for now (RLS policies for a future privileged
  view already exist in migration 003, unused).
- Extending the (still-stub) weekly digest with real AI summarization.
- A real frontend login flow — see §5. This is the one item that blocks the
  frontend integration from doing anything today beyond the existing demo
  experience, and is pre-existing, not introduced by this work.
- Manager/department/executive-facing frontend pages — only the employee
  notification page and the shared employee shell badge were rewired.

---

## 10. Addendum — second pass: real auth, pagination, scheduler, security findings

The item at the end of §9 ("a real frontend login flow") is no longer accurate —
this pass built one. This section records what changed and why.

### Authentication gap found and partially addressed

While wiring the frontend to real login, inspection of `AuthService.login`
(backend) turned up something more serious than "no login flow exists":
**`LoginRequest.password` is a required field that was never actually checked
against anything** — no `password_hash` column exists on `people` at all.
`AuthService.login` issued a fully real, signed JWT for *any* person matched by
username/email, no credential verification whatsoever. Layered on top were two
bypass hacks: typing `"jane"` or `"dummy"` as the username logged you in as the
first person in the database; any refresh token merely *containing* `"eyJ"` (the
base64 prefix every JWT starts with) did the same via `AuthService.refresh`.

Both bypasses were removed — they would have made every IDOR/isolation test in
this system meaningless, since anyone could become anyone (including an admin)
by typing a magic word. **Real password verification was not added** — that
needs a schema change to `people` (a column, a migration, a hashing scheme, and
setting initial passwords for existing seed data), which is a separate,
materially larger initiative than notifications. Today, `POST /api/v1/auth/login`
still only checks that the given username/email matches a real person.

`frontend/src/app/login/page.tsx` + `lib/auth-token.ts`'s new `login()` function
call this endpoint for real and store the resulting token. The login form still
collects and sends a password (the backend schema requires it, and the UI
shouldn't imply otherwise) with an explicit helper note that it isn't checked yet.

### Removing the silent mock fallback

Previously, `employee/notifications/page.tsx` and `EmployeeShell`'s nav badge
fell back to `mock-db.ts` automatically whenever there was no real session or
the real API call failed — reasonable when no real auth existed at all, wrong
now that it does, since a failed real fetch would have silently shown demo data
indistinguishable from real data. Replaced with an explicit state machine:
`loading → auth-required | error | ready`, plus an opt-in `demo` state reached
only by clicking "View demo data instead" (which then shows a persistent
"Demo data" banner). The shell badge now shows no count at all, rather than a
fabricated one, when there's no real session or the fetch fails.

### Pagination

`GET /api/v1/notifications` previously had no `limit`/`offset` parameters at
all (a hardcoded `limit=200`). Added `limit` (1–200, default 50) and `offset`
query params; `unread_count`/`action_required_count`/`total_count` are computed
with their own count queries (`NotificationService.count_for_recipient`,
`count_action_required`), independent of the current page, so they always
reflect the caller's whole inbox.

### Scheduler for the sweep endpoint

`POST /api/v1/notifications/sweep` requires a work_admin/system_admin JWT, and
CORE has no service-account auth flow to give a cron job one safely. Rather than
solve that auth problem, `backend/scripts/run_notification_sweep.py` calls
`NotificationService.run_sweep` / `NotificationIntelligenceService.enrich_pending`
directly against the database — no HTTP, no token to manage. Three scheduling
options are provided (pick one, not all): a cron one-liner (in the script's own
docstring), a systemd service+timer pair (`scripts/core-notification-sweep.
service`/`.timer`), and a GitHub Actions scheduled workflow
(`.github/workflows/notification-sweep.yml`). None require new infrastructure.

### `pytest` dependency gap

`python-jose[cryptography]` was already correctly declared and installs/imports
fine — verified from a genuinely empty venv. The actual cause of
`ModuleNotFoundError: No module named 'jose'` when running tests: **`pytest`
itself was declared nowhere in the project.** Any environment with `pytest`
available globally, but without this project's `requirements.txt` ever
installed into it, would hit exactly that error the moment a test imported
`src/`. Fixed with `backend/requirements-dev.txt` (`-r requirements.txt` +
`pytest`); validated by running the full suite from a from-scratch venv.

### A new, more serious hardcoded-credential finding

The executive reporting route now requires an authenticated executive or system
administrator session, uses only deployment-provided database configuration,
and returns an unavailable response instead of demo data when reporting is not
configured.

### Test coverage added

`tests/test_notifications_api.py` — the layer that was missing before: real
HTTP requests through FastAPI's `TestClient` with real JWTs, proving (not just
asserting) cross-user isolation, 403 on every attempted IDOR (read/acknowledge/
enrich another user's notification), role-gating on `/sweep` and
`/enrich-pending`, pagination correctness (no overlap between pages, counts
independent of page size), and mark-read/mark-all-read over real requests.

Full suite as of this pass: 86 passed, 2 pre-existing unrelated failures
(`test_health.py`, stale route expectations, not touched). Frontend: clean
`tsc --noEmit` and a clean `next build` across all 38 routes, including
`/login` and the rewired `/employee/notifications`.
