from sqlalchemy import Column, String, Text, Date, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from src.core.database import Base
from .enums import ReviewStatus


class WeeklyDigest(Base):
    """
    Maps to the `weekly_digests` table in Supabase PostgreSQL.
    """

    __tablename__ = "weekly_digests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    week_start = Column(Date, nullable=False)
    week_end = Column(Date, nullable=False)
    summary = Column(Text, nullable=False)
    generated_by = Column(String, nullable=False, default="system")
    model_version = Column(String, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("people.id"), nullable=True)
    review_status = Column(SAEnum(ReviewStatus), nullable=False, default=ReviewStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    department = relationship("Department", foreign_keys=[department_id], lazy="select")
    reviewer = relationship("Person", foreign_keys=[reviewed_by], lazy="select")
