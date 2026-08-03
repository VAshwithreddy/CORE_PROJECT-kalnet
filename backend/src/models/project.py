import uuid

from sqlalchemy import Column, String, ForeignKey, Date, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.core.database import Base


class Project(Base):
    """Maps to the `projects` table in Supabase PostgreSQL."""

    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("people.id"), nullable=True)
    priority = Column(String, nullable=False, default="medium")
    status = Column(String, nullable=False, default="planned")
    target_date = Column(Date, nullable=True)
    metadata_ = Column("metadata", JSONB, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    department = relationship("Department", foreign_keys=[department_id], lazy="select")
    owner = relationship("Person", foreign_keys="[Project.owner_id]", lazy="select")
    assignments = relationship("Assignment", back_populates="project", lazy="select")
