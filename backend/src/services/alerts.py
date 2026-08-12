from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.models.staleness_alert import StalenessAlert
from src.schemas.alerts import AlertResponse, AlertUpdate
from src.services.notifications import NotificationService, NotificationRulesEngine


class AlertsService:
    """Business logic for the Alerts module."""

    @staticmethod
    def get_stale_alerts(db: Session) -> List[AlertResponse]:
        """
        Retrieve a list of active (non-dismissed) stale alerts.
        """
        alerts = (
            db.query(StalenessAlert)
            .filter(StalenessAlert.status == "open")
            .all()
        )

        return [AlertResponse.model_validate(alert) for alert in alerts]

    @staticmethod
    def report_stale_assignment(
        db: Session,
        assignment_id: UUID,
        severity: str = "medium",
        reason: str = "no check-in",
        days_since_update: int = 0,
    ):
        """
        Create a staleness alert for an assignment.

        Staleness is different from overdue:
        this alert is based on lack of progress updates, not a
        passed assignment deadline.
        """
        alert = StalenessAlert(
            assignment_id=assignment_id,
            severity=severity,
            reason=reason,
            days_since_update=days_since_update,
            status="open",
        )

        db.add(alert)
        db.commit()
        db.refresh(alert)
        NotificationService.notify(
            db,
            NotificationRulesEngine.on_staleness_alert_created,
            alert,
        )


        return alert

    @staticmethod
    def get_alert_by_id(
        alert_id: UUID,
        db: Session,
    ) -> AlertResponse:
        """
        Retrieve a single alert by its ID.
        """
        alert = None

        try:
            uuid_val = UUID(str(alert_id))
            alert = (
                db.query(StalenessAlert)
                .filter(StalenessAlert.id == uuid_val)
                .first()
            )
        except ValueError:
            pass

        if alert:
            return AlertResponse.model_validate(alert)

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {alert_id} not found.",
        )

    @staticmethod
    def update_alert(
        alert_id: UUID,
        update_data: AlertUpdate,
        db: Session,
    ) -> AlertResponse:
        """
        Update an alert, for example dismissing it.
        Returns the updated alert.
        """
        alert = None

        try:
            uuid_val = UUID(str(alert_id))
            alert = (
                db.query(StalenessAlert)
                .filter(StalenessAlert.id == uuid_val)
                .first()
            )
        except ValueError:
            pass

        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Alert with ID {alert_id} not found.",
            )

        if update_data.is_dismissed is not None:
            alert.is_dismissed = update_data.is_dismissed
            db.commit()
            db.refresh(alert)

        return AlertResponse.model_validate(alert)