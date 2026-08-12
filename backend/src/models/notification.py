import uuid
from sqlalchemy import Column, String, ForeignKey, Boolean, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.core.database import Base


class Notification(Base):
    """Maps to the `notifications` table in Supabase PostgreSQL."""

    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("people.id"), nullable=False)
    type = Column(String, nullable=False)        # e.g. assignment_created, status_blocked
    title = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    action_url = Column(String, nullable=True)   # optional deep-link for the notification
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    recipient = relationship("Person", foreign_keys="[Notification.recipient_id]", lazy="select")

