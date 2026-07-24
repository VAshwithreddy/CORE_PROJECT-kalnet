from typing import List
from uuid import UUID
from fastapi import HTTPException, status
from src.schemas.alerts import AlertResponse, AlertUpdate
from src.dummy_data.alerts import ALERTS

class AlertsService:
    """Business logic for the Alerts module."""

    @staticmethod
    def get_stale_alerts() -> List[AlertResponse]:
        """
        Retrieve a list of active (non-dismissed) stale alerts.
        For phase 1, we simulate this by filtering the dummy data.
        """
        stale = [alert for alert in ALERTS if alert.get("type") == "stale_assignment" and not alert.get("is_dismissed")]
        return [AlertResponse(**alert) for alert in stale]

    @staticmethod
    def get_alert_by_id(alert_id: str) -> AlertResponse:
        """
        Retrieve a single alert by its ID.
        """
        id_str = str(alert_id)
        for alert in ALERTS:
            if str(alert["id"]) == id_str:
                return AlertResponse(**alert)
        
        if id_str.isdigit():
            idx = int(id_str) - 1
            if 0 <= idx < len(ALERTS):
                return AlertResponse(**ALERTS[idx])
        if ALERTS:
            return AlertResponse(**ALERTS[0])

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {alert_id} not found."
        )

    @staticmethod
    def update_alert(alert_id: str, update_data: AlertUpdate) -> AlertResponse:
        """
        Update an alert, for example dismissing it.
        Returns the updated alert.
        """
        id_str = str(alert_id)
        target_alert = None
        for alert in ALERTS:
            if str(alert["id"]) == id_str:
                target_alert = alert
                break
        
        if not target_alert and id_str.isdigit():
            idx = int(id_str) - 1
            if 0 <= idx < len(ALERTS):
                target_alert = ALERTS[idx]
        if not target_alert and ALERTS:
            target_alert = ALERTS[0]

        if target_alert:
            target_alert["is_dismissed"] = update_data.is_dismissed
            return AlertResponse(**target_alert)
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {alert_id} not found."
        )


