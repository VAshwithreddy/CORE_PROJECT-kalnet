import uuid

from sqlalchemy import Column, String, ForeignKey, Date, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.core.database import Base


class Assignment(Base):
    """Maps to the `assignments` table in Supabase PostgreSQL."""

    __tablename__ = "assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    person_id = Column(UUID(as_uuid=True), ForeignKey("people.id"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    role = Column(String, nullable=False)
    status = Column(String, nullable=False, default="on_track")
    @property
    def allocation_percent(self) -> int:
        return 100
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    project = relationship("Project", back_populates="assignments", lazy="select")
    person = relationship(
        "Person",
        foreign_keys="[Assignment.person_id]",
        back_populates="assignments",
        lazy="select",
    )
    status_updates = relationship(
        "StatusUpdate",
        foreign_keys="[StatusUpdate.assignment_id]",
        back_populates="assignment",
        lazy="select",
        order_by="StatusUpdate.created_at.desc()",
    )
