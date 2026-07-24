import uuid
from sqlalchemy import Column, String, ForeignKey, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.core.database import Base


class StalenessAlert(Base):
    """Maps to the `staleness_alerts` table in Supabase PostgreSQL."""

    __tablename__ = "staleness_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    type = Column(String, nullable=False, default="stale_assignment")
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_dismissed = Column(Boolean, nullable=False, default=False)

    # Relationships
    assignment = relationship("Assignment", lazy="select")

