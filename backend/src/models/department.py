import uuid

from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from src.core.database import Base


class Department(Base):
    """Maps to the `departments` table in Supabase PostgreSQL."""

    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    head_person_id = Column(UUID(as_uuid=True), ForeignKey("people.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default="now()", nullable=False)

    # Relationships
    members = relationship(
        "Person",
        foreign_keys="[Person.department_id]",
        back_populates="department",
        lazy="select",
    )
    head = relationship(
        "Person",
        foreign_keys="[Department.head_person_id]",
        back_populates="headed_department",
        lazy="select",
    )
