import uuid
from sqlalchemy import Column, String, ForeignKey, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.core.database import Base


class ApprovalRequest(Base):
    """Maps to the `approval_requests` table in Supabase PostgreSQL."""

    __tablename__ = "approval_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    # The entity being approved (e.g. project, assignment)
    entity_type = Column(String, nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    requested_by_id = Column(UUID(as_uuid=True), ForeignKey("people.id"), nullable=False)
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("people.id"), nullable=True)
    status = Column(String, nullable=False, default="pending")  # pending | approved | rejected
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    requested_by = relationship(
        "Person",
        foreign_keys="[ApprovalRequest.requested_by_id]",
        lazy="select",
    )
    approved_by = relationship(
        "Person",
        foreign_keys="[ApprovalRequest.approved_by_id]",
        lazy="select",
    )

