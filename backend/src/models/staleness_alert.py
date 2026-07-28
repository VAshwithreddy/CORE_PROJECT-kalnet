import uuid
from sqlalchemy import Column, String, ForeignKey, Boolean, DateTime, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.core.database import Base


class StalenessAlert(Base):
    """Maps to the `staleness_alerts` table in Supabase PostgreSQL."""

    __tablename__ = "staleness_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id"), nullable=False)
    severity = Column(String, nullable=False, default="low")
    reason = Column(Text, nullable=False)
    days_since_update = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="open")
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    @property
    def is_dismissed(self) -> bool:
        return self.status != "open"
        
    @is_dismissed.setter
    def is_dismissed(self, value: bool):
        self.status = "resolved" if value else "open"

    @property
    def title(self) -> str:
        return f"Stale Assignment ({self.severity} severity)"
        
    @property
    def description(self) -> str:
        return self.reason

    @property
    def type(self) -> str:
        return "stale_assignment"

    # Relationships
    assignment = relationship("Assignment", lazy="select")

