import uuid
import enum

from sqlalchemy import Column, String, ForeignKey, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship

from src.core.database import Base
from .enums import Role, Availability

class Person(Base):
    """Maps to the `people` table in Supabase PostgreSQL."""

    __tablename__ = "people"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    auth_user_id = Column(UUID(as_uuid=True), nullable=True)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    job_title = Column(String, nullable=True)
    role = Column(Enum(Role), nullable=False)
    availability = Column(Enum(Availability), nullable=False, default=Availability.available)
    skills = Column(ARRAY(String), nullable=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("people.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default="now()", nullable=False)

    # Relationships
    department = relationship(
        "Department",
        foreign_keys=[department_id],
        back_populates="members",
        lazy="select",
    )
    manager = relationship(
        "Person",
        foreign_keys=[manager_id],
        remote_side=[id],
        lazy="select",
    )
    assignments = relationship(
        "Assignment",
        foreign_keys="[Assignment.person_id]",
        back_populates="person",
        lazy="select",
    )
    status_updates = relationship(
        "StatusUpdate",
        foreign_keys="[StatusUpdate.author_id]",
        back_populates="author",
        lazy="select",
    )
    headed_department = relationship(
        "Department",
        foreign_keys="[Department.head_person_id]",
        back_populates="head",
        lazy="select",
    )
