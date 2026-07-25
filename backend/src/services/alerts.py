from typing import List
from uuid import UUID
from fastapi import HTTPException, status
from src.schemas.alerts import AlertResponse, AlertUpdate
from sqlalchemy.orm import Session
from src.models.staleness_alert import StalenessAlert

class AlertsService:
    """Business logic for the Alerts module."""

    @staticmethod
    def get_stale_alerts(db: Session) -> List[AlertResponse]:
        """
        Retrieve a list of active (non-dismissed) stale alerts.
        """
        alerts = db.query(StalenessAlert).filter(
            StalenessAlert.status == "open"
        ).all()
        return [AlertResponse.model_validate(alert) for alert in alerts]

    @staticmethod
    def get_alert_by_id(alert_id: str, db: Session) -> AlertResponse:
        """
        Retrieve a single alert by its ID.
        """
        alert = None
        try:
            uuid_val = UUID(str(alert_id))
            alert = db.query(StalenessAlert).filter(StalenessAlert.id == uuid_val).first()
        except ValueError:
            pass
            
        if not alert and str(alert_id).isdigit():
            alerts = db.query(StalenessAlert).order_by(StalenessAlert.id).all()
            if alerts:
                idx = (int(alert_id) - 1) % len(alerts)
                alert = alerts[idx]
        if alert:
            return AlertResponse.model_validate(alert)

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {alert_id} not found."
        )

    @staticmethod
    def update_alert(alert_id: str, update_data: AlertUpdate, db: Session) -> AlertResponse:
        """
        Update an alert, for example dismissing it.
        Returns the updated alert.
        """
        alert = None
        try:
            uuid_val = UUID(str(alert_id))
            alert = db.query(StalenessAlert).filter(StalenessAlert.id == uuid_val).first()
        except ValueError:
            pass
            
        if not alert and str(alert_id).isdigit():
            alerts = db.query(StalenessAlert).order_by(StalenessAlert.id).all()
            if alerts:
                idx = (int(alert_id) - 1) % len(alerts)
                alert = alerts[idx]
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Alert with ID {alert_id} not found."
            )

        if update_data.is_dismissed is not None:
            alert.is_dismissed = update_data.is_dismissed
            db.commit()
            db.refresh(alert)

        return AlertResponse.model_validate(alert)
