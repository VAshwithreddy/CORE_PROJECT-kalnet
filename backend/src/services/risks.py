"""
risks.py — Business logic for the Risk Management module.

Risk data is derived from existing Supabase tables without schema changes:
  - staleness_alerts  → Performance risks (stale assignments)
  - approval_requests → Compliance risks (pending reviews)
  - audit_logs        → Tracks escalation/mitigation actions
                        action='risk_escalated' | action='risk_mitigated'
                        entity='risk', entity_id=<staleness_alert.id or approval_request.id>
                        after_state=JSONB snapshot of risk details (for Work Admin view)
                        reason=escalation reason text

Strategy for status:
  - "Mitigated"  : staleness_alert.status='resolved'  OR  approval_request.status='approved'
                   OR  latest audit_log action for this risk_id is 'risk_mitigated'
  - "Escalated"  : latest audit_log action for this risk_id is 'risk_escalated'
  - "Open"       : neither of the above
"""

import json
import uuid
import logging
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from src.core.dependencies import CurrentUser
from src.core.rbac import PRIVILEGED_ROLES

logger = logging.getLogger(__name__)


class RisksService:
    """Business logic for the Risk module."""

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _build_escalation_status_map(db: Session) -> Dict[str, str]:
        """
        Return {risk_id: latest_action} for all risks that have at least
        one 'risk_escalated' or 'risk_mitigated' audit-log entry.

        Uses DISTINCT ON to keep only the *most recent* action per risk.
        """
        result = db.execute(
            text("""
                SELECT DISTINCT ON (entity_id)
                    entity_id::text AS risk_id,
                    action
                FROM public.audit_logs
                WHERE entity = 'risk'
                  AND action IN ('risk_escalated', 'risk_mitigated')
                ORDER BY entity_id, created_at DESC
            """)
        )
        return {row[0]: row[1] for row in result}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @staticmethod
    def get_all_risks(db: Session) -> List[Dict[str, Any]]:
        """
        Fetch all risk records from Supabase.

        Sources:
          1. staleness_alerts  → Performance risks
          2. approval_requests → Compliance risks

        Status is derived from the source record plus the audit-log escalation
        map, so it always reflects the latest persisted state.
        """
        esc_map = RisksService._build_escalation_status_map(db)
        risks: List[Dict[str, Any]] = []

        # ── 1. Performance risks (staleness_alerts) ──────────────────────────
        perf_rows = db.execute(
            text("""
                SELECT sa.id::text,
                       sa.severity::text,
                       sa.reason,
                       sa.days_since_update,
                       sa.status::text,
                       pr.name  AS project_name,
                       pe.full_name AS person_name
                FROM public.staleness_alerts sa
                JOIN public.assignments a  ON sa.assignment_id = a.id
                JOIN public.projects   pr ON a.project_id      = pr.id
                JOIN public.people     pe ON a.person_id       = pe.id
            """)
        )
        for row in perf_rows:
            rid, sev, reason, days, alert_status, proj_name, person_name = row
            likelihood = 4 if sev == "high" else 3 if sev == "medium" else 2
            impact = likelihood  # symmetric heatmap position

            # Effective status: DB state takes priority over audit log for
            # "Mitigated" (resolved alert), then fall back to audit log.
            if alert_status == "resolved":
                eff_status = "Mitigated"
                progress = 100
            else:
                latest_action = esc_map.get(rid)
                if latest_action == "risk_escalated":
                    eff_status = "Escalated"
                    progress = 50
                elif latest_action == "risk_mitigated":
                    eff_status = "Mitigated"
                    progress = 100
                else:
                    eff_status = "Open"
                    progress = 50

            risks.append(
                {
                    "id": rid,
                    "name": f"Staleness: {proj_name} ({person_name})",
                    "category": "Performance",
                    "likelihood": likelihood,
                    "impact": impact,
                    "score": likelihood * impact,
                    "owner": person_name,
                    "status": eff_status,
                    "mitigation": f"{reason} Days since update: {days}",
                    "progress": progress,
                }
            )

        # ── 2. Compliance risks (approval_requests) ───────────────────────────
        comp_rows = db.execute(
            text("""
                SELECT ar.id::text,
                       pe.full_name AS owner,
                       ar.request_type::text,
                       ar.target_entity,
                       ar.status::text,
                       ar.payload
                FROM public.approval_requests ar
                JOIN public.people pe ON ar.requested_by = pe.id
            """)
        )
        for row in comp_rows:
            rid, owner, req_type, target_ent, ar_status, payload = row
            payload_dict: Dict[str, Any] = payload if isinstance(payload, dict) else {}

            if ar_status == "approved":
                eff_status = "Mitigated"
                progress = 100
            else:
                latest_action = esc_map.get(rid)
                if latest_action == "risk_escalated":
                    eff_status = "Escalated"
                    progress = 80
                elif latest_action == "risk_mitigated":
                    eff_status = "Mitigated"
                    progress = 100
                else:
                    eff_status = "Open"
                    progress = 80

            risks.append(
                {
                    "id": rid,
                    "name": f"Approval Pending: {req_type} on {target_ent}",
                    "category": "Compliance",
                    "likelihood": 2,
                    "impact": 3,
                    "score": 6,
                    "owner": owner,
                    "status": eff_status,
                    "mitigation": (
                        f"Pending review of payload: {json.dumps(payload_dict)}"
                    ),
                    "progress": progress,
                }
            )

        return risks

    # ------------------------------------------------------------------

    @staticmethod
    def escalate_risk(
        db: Session,
        risk_id: str,
        current_user: CurrentUser,
        reason: Optional[str],
    ) -> Dict[str, Any]:
        """
        Escalate a risk so that it appears in the Work Admin Escalations page.

        Steps:
          1. Validate the risk exists.
          2. Validate the caller is an executive (or system_admin).
          3. Guard against duplicate active escalation.
          4. Insert an audit_log row with action='risk_escalated',
             storing a snapshot of the risk details in after_state (JSONB)
             so the Work Admin can see them without re-joining.
          5. Commit.
        """
        # 1. Validate risk exists
        all_risks = RisksService.get_all_risks(db)
        risk = next((r for r in all_risks if r["id"] == risk_id), None)
        if not risk:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Risk '{risk_id}' not found.",
            )

        # 2. Authorisation: only executive (or system_admin) may escalate
        if current_user.role not in ("executive", "system_admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only executives can escalate risks.",
            )

        # 3. Guard: already escalated (no-op)
        if risk["status"] == "Escalated":
            # Return the existing escalation log id
            existing = db.execute(
                text("""
                    SELECT id::text FROM public.audit_logs
                    WHERE entity = 'risk'
                      AND entity_id = CAST(:rid AS UUID)
                      AND action = 'risk_escalated'
                    ORDER BY created_at DESC
                    LIMIT 1
                """),
                {"rid": risk_id},
            ).fetchone()
            return {
                "risk_id": risk_id,
                "escalation_id": existing[0] if existing else None,
                "status": "Escalated",
                "message": "Risk is already escalated.",
            }

        # 4. Create audit log entry
        log_id = str(uuid.uuid4())
        snapshot = {
            "risk_name": risk["name"],
            "category": risk["category"],
            "likelihood": risk["likelihood"],
            "impact": risk["impact"],
            "score": risk["score"],
            "owner": risk["owner"],
            "mitigation": risk["mitigation"],
            "progress": risk["progress"],
            "reason": reason or "Escalated by executive for immediate attention.",
        }

        db.execute(
            text("""
                INSERT INTO public.audit_logs
                    (id, actor_id, action, entity, entity_id, reason, after_state, created_at)
                VALUES
                    (
                        CAST(:id      AS UUID),
                        CAST(:actor   AS UUID),
                        'risk_escalated',
                        'risk',
                        CAST(:eid     AS UUID),
                        :reason,
                        CAST(:snap    AS JSONB),
                        NOW()
                    )
            """),
            {
                "id": log_id,
                "actor": str(current_user.person_id),
                "eid": risk_id,
                "reason": reason or "Executive escalation",
                "snap": json.dumps(snapshot),
            },
        )
        db.commit()

        logger.info(
            "Risk '%s' escalated by person_id=%s (role=%s)",
            risk_id,
            current_user.person_id,
            current_user.role,
        )

        return {
            "risk_id": risk_id,
            "escalation_id": log_id,
            "status": "Escalated",
            "message": "Risk escalated successfully.",
        }

    # ------------------------------------------------------------------

    @staticmethod
    def mitigate_risk(
        db: Session,
        risk_id: str,
        current_user: CurrentUser,
    ) -> Dict[str, Any]:
        """
        Mark a risk as mitigated.

        Steps:
          1. Validate the risk exists.
          2. Validate caller is a privileged role.
          3a. If the risk is a staleness_alert: set status='resolved'.
          3b. If the risk is an approval_request: set status='approved'.
          4. Insert an audit_log row with action='risk_mitigated'.
          5. Commit.
        """
        # 1. Validate risk exists
        all_risks = RisksService.get_all_risks(db)
        risk = next((r for r in all_risks if r["id"] == risk_id), None)
        if not risk:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Risk '{risk_id}' not found.",
            )

        # 2. Authorisation
        if current_user.role not in PRIVILEGED_ROLES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient privileges to mitigate risks.",
            )

        # 3a. Try staleness_alert update
        sa_row = db.execute(
            text("SELECT id FROM public.staleness_alerts WHERE id = CAST(:rid AS UUID)"),
            {"rid": risk_id},
        ).fetchone()

        if sa_row:
            db.execute(
                text("""
                    UPDATE public.staleness_alerts
                    SET    status      = 'resolved',
                           resolved_at = NOW()
                    WHERE  id = CAST(:rid AS UUID)
                """),
                {"rid": risk_id},
            )
        else:
            # 3b. Try approval_request update
            ar_row = db.execute(
                text("SELECT id FROM public.approval_requests WHERE id = CAST(:rid AS UUID)"),
                {"rid": risk_id},
            ).fetchone()

            if ar_row:
                db.execute(
                    text("""
                        UPDATE public.approval_requests
                        SET    status      = 'approved',
                               approved_by = CAST(:actor AS UUID),
                               resolved_at = NOW()
                        WHERE  id = CAST(:rid AS UUID)
                    """),
                    {"rid": risk_id, "actor": str(current_user.person_id)},
                )

        # 4. Audit log
        db.execute(
            text("""
                INSERT INTO public.audit_logs
                    (id, actor_id, action, entity, entity_id, reason, created_at)
                VALUES
                    (
                        CAST(:id    AS UUID),
                        CAST(:actor AS UUID),
                        'risk_mitigated',
                        'risk',
                        CAST(:eid   AS UUID),
                        'Risk marked as mitigated',
                        NOW()
                    )
            """),
            {
                "id": str(uuid.uuid4()),
                "actor": str(current_user.person_id),
                "eid": risk_id,
            },
        )
        db.commit()

        logger.info(
            "Risk '%s' mitigated by person_id=%s (role=%s)",
            risk_id,
            current_user.person_id,
            current_user.role,
        )

        return {
            "risk_id": risk_id,
            "escalation_id": None,
            "status": "Mitigated",
            "message": "Risk marked as mitigated.",
        }

    # ------------------------------------------------------------------

    @staticmethod
    def get_escalations(db: Session) -> List[Dict[str, Any]]:
        """
        Return all risk escalations for the Work Admin Escalations page.

        Uses audit_logs:
          - Finds every 'risk_escalated' entry.
          - Determines current status by checking whether the latest action
            for each risk_id is still 'risk_escalated' (pending) or has been
            superseded by 'risk_mitigated' (resolved).
          - Risk details come from the after_state JSONB snapshot stored at
            escalation time, so no further joins to alert/approval tables are
            needed.
        """
        rows = db.execute(
            text("""
                WITH latest_log AS (
                    SELECT DISTINCT ON (entity_id)
                        id::text AS log_id,
                        entity_id::text AS risk_id,
                        actor_id::text AS actor_id,
                        action,
                        reason,
                        created_at
                    FROM public.audit_logs
                    WHERE entity = 'risk'
                      AND action IN ('risk_escalated', 'risk_mitigated')
                    ORDER BY entity_id, created_at DESC
                ),
                esc_log AS (
                    SELECT DISTINCT ON (entity_id)
                        entity_id::text AS risk_id,
                        after_state,
                        actor_id::text AS original_actor_id
                    FROM public.audit_logs
                    WHERE entity = 'risk'
                      AND action = 'risk_escalated'
                    ORDER BY entity_id, created_at DESC
                )
                SELECT
                    l.log_id,
                    l.risk_id,
                    l.reason,
                    e.after_state,
                    l.created_at,
                    l.action AS latest_action,
                    pe.full_name AS escalated_by
                FROM latest_log l
                LEFT JOIN esc_log e ON l.risk_id = e.risk_id
                LEFT JOIN public.people pe ON pe.id = CAST(e.original_actor_id AS UUID)
                ORDER BY l.created_at DESC
            """)
        )

        escalations: List[Dict[str, Any]] = []
        for row in rows:
            log_id, risk_id, reason, after_state, created_at, latest_action, escalated_by = row
            snap: Dict[str, Any] = after_state if isinstance(after_state, dict) else {}

            # Only include risks whose latest action is 'risk_escalated'
            # (still pending) — resolved ones have latest_action='risk_mitigated'
            esc_status = "pending" if latest_action == "risk_escalated" else "resolved"

            escalations.append(
                {
                    "id": log_id,
                    "risk_id": risk_id,
                    "risk_name": snap.get("risk_name", "Unknown Risk"),
                    "risk_category": snap.get("category", "Unknown"),
                    "likelihood": snap.get("likelihood", 0),
                    "impact": snap.get("impact", 0),
                    "score": snap.get("score", 0),
                    "owner": snap.get("owner", "Unknown"),
                    "reason": snap.get("reason") or reason or "",
                    "escalated_by": escalated_by or "Unknown",
                    "escalation_status": esc_status,
                    "created_at": created_at,
                    "mitigation": snap.get("mitigation", ""),
                    "progress": 100 if esc_status == "resolved" else snap.get("progress", 0),
                }
            )

        return escalations
