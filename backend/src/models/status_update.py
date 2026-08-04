import uuid

from sqlalchemy import Column, String, ForeignKey, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.core.database import Base


class StatusUpdate(Base):
    """Maps to the `status_updates` table in Supabase PostgreSQL."""

    __tablename__ = "status_updates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("people.id"), nullable=False)
    status = Column(String, nullable=False)
    progress_note = Column(Text, nullable=True)
    blockers = Column(Text, nullable=True)
    evidence_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    assignment = relationship(
        "Assignment",
        foreign_keys="[StatusUpdate.assignment_id]",
        back_populates="status_updates",
        lazy="select",
    )
    author = relationship(
        "Person",
        foreign_keys="[StatusUpdate.author_id]",
        back_populates="status_updates",
        lazy="select",
    )
