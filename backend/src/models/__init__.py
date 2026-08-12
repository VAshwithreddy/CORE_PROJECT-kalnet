"""
SQLAlchemy ORM models for the CORE platform.

Import all models here so that Base.metadata knows about every table
and relationship resolution works correctly across modules.
"""

from src.models.department import Department
from src.models.person import Person
from src.models.project import Project
from src.models.assignment import Assignment
from src.models.status_update import StatusUpdate
from src.models.weekly_digest import WeeklyDigest
from src.models.staleness_alert import StalenessAlert
from src.models.approval_request import ApprovalRequest
from src.models.notification import Notification
from src.models.notification_enrichment import NotificationEnrichment
from src.models.audit_log import AuditLog
from src.models.service_account import ServiceAccount

__all__ = [
    "Department",
    "Person",
    "Project",
    "Assignment",
    "StatusUpdate",
    "WeeklyDigest",
    "StalenessAlert",
    "ApprovalRequest",
    "Notification",
    "NotificationEnrichment",
    "AuditLog",
    "ServiceAccount",
]
