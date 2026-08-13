import enum

class Role(str, enum.Enum):
    employee = "employee"
    manager = "manager"
    team_leader = "team_leader"
    department_head = "department_head"
    executive = "executive"
    work_admin = "work_admin"
    system_admin = "system_admin"

class Availability(str, enum.Enum):
    available = "available"
    partially_available = "partially_available"
    unavailable = "unavailable"

class ProjectPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class ProjectStatus(str, enum.Enum):
    planned = "planned"
    active = "active"
    on_hold = "on_hold"
    completed = "completed"
    cancelled = "cancelled"

class AssignmentStatus(str, enum.Enum):
    on_track = "on_track"
    blocked = "blocked"
    done = "done"

class StatusUpdateStatus(str, enum.Enum):
    on_track = "on_track"
    blocked = "blocked"
    done = "done"

class ReviewStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    flagged = "flagged"

class AlertSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class AlertStatus(str, enum.Enum):
    open = "open"
    resolved = "resolved"

class NotificationSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class NotificationEntityType(str, enum.Enum):
    PROJECT = "project"
    ASSIGNMENT = "assignment"

class NotificationType(str, enum.Enum):
    WORK_ASSIGNED = "WORK_ASSIGNED"
    WORK_REASSIGNED = "WORK_REASSIGNED"
    BLOCKER_CREATED = "BLOCKER_CREATED"
    BLOCKER_RESOLVED = "BLOCKER_RESOLVED"
    CRITICAL_BLOCKER = "CRITICAL_BLOCKER"
    WORK_COMPLETED = "WORK_COMPLETED"
    PRIORITY_CHANGED = "PRIORITY_CHANGED"
    WORK_OVERDUE = "WORK_OVERDUE"
    DEADLINE_APPROACHING = "DEADLINE_APPROACHING"
    ESCALATION_REQUIRED = "ESCALATION_REQUIRED"
    STALE_ASSIGNMENT = "STALE_ASSIGNMENT"

class ApprovalRequestType(str, enum.Enum):
    profile_update = "profile_update"
    assignment_change = "assignment_change"
    scope_change = "scope_change"
    due_date_change = "due_date_change"

class ApprovalStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
