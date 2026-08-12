#!/usr/bin/env python3
"""
scripts/run_notification_sweep.py

Runs the time-based notification checks (DEADLINE_APPROACHING, WORK_OVERDUE,
ESCALATION_REQUIRED) and, if AI is enabled, batch AI enrichment for any
notification that doesn't have one yet.

WHY A SCRIPT INSTEAD OF CALLING THE HTTP ENDPOINT:
POST /api/v1/notifications/sweep and /enrich-pending exist and work (see
src/api/notifications.py) and are restricted to work_admin/system_admin.
But CORE has no service-account JWT issuance today (see AuthService.login
docstring) — a cron job would have no clean way to hold a long-lived
work_admin token without a wider auth change. Since this is an internal
maintenance task, not a public API consumer, this script instead calls
the same service-layer functions the endpoints call
(NotificationService.run_sweep, NotificationIntelligenceService.
enrich_pending) directly against the database, using a single DB session
scoped to this process — no HTTP, no token to manage or leak.

If you'd rather go through the HTTP API (e.g. the scheduler runs in a
different environment than the database), see "Alternative: HTTP-based
scheduling" in docs/NOTIFICATION_INTELLIGENCE_ARCHITECTURE.md.

USAGE:
    python scripts/run_notification_sweep.py [--enrich] [--quiet]

    --enrich   Also run AI enrichment for pending notifications
               (no-op if AI_ENABLED=false, which is the default).
    --quiet    Only print output if something was created — useful for
               cron, where routine "nothing to do" runs shouldn't send mail.

EXIT CODES:
    0  ran successfully (whether or not anything was created)
    1  a genuine error occurred (DB unreachable, etc.) — check stderr

SCHEDULING — pick one:

1) cron (simplest, if this host always has DATABASE_URL / .env available):
     */15 * * * * cd /path/to/backend && /path/to/venv/bin/python scripts/run_notification_sweep.py --enrich --quiet >> /var/log/core-sweep.log 2>&1

2) systemd timer (preferred on systemd hosts — see
   scripts/core-notification-sweep.service and .timer alongside this file):
     systemctl enable --now core-notification-sweep.timer

3) A scheduled CI workflow (e.g. GitHub Actions `schedule:` cron trigger)
   that checks out the repo and runs this script with DATABASE_URL/
   AI_* supplied as secrets — appropriate if you don't want a
   long-running host dedicated to this.

Any of these call the SAME script; the difference is only what's doing
the calling. Pick whichever matches how the rest of CORE is already
operated — this deliberately doesn't require adding Celery, Redis, or
any new infrastructure (see docs/NOTIFICATION_INTELLIGENCE_ARCHITECTURE.md,
"No job queue").
"""
import argparse
import os
import sys
from datetime import datetime, timezone

# Allow running this script from any working directory by adding the
# backend/ directory (this script's parent) to the import path.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.database import SessionLocal  # noqa: E402
from src.services.notifications import NotificationService  # noqa: E402
from src.services.notification_intelligence import NotificationIntelligenceService  # noqa: E402
from src.core.config import settings  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--enrich", action="store_true", help="Also run AI enrichment for pending notifications")
    parser.add_argument("--quiet", action="store_true", help="Only print output if something was created")
    args = parser.parse_args()

    started_at = datetime.now(timezone.utc).isoformat()
    db = SessionLocal()
    try:
        created = NotificationService.run_sweep(db)
        enriched = 0
        if args.enrich:
            if not settings.ai_enabled:
                if not args.quiet:
                    print(f"[{started_at}] --enrich passed but AI_ENABLED=false — skipping enrichment.")
            else:
                enriched = NotificationIntelligenceService.enrich_pending(db)

        if created or enriched or not args.quiet:
            print(f"[{started_at}] sweep: {created} notification(s) created, {enriched} enriched.")
        return 0
    except Exception as e:
        print(f"[{started_at}] ERROR running notification sweep: {e}", file=sys.stderr)
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
