import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.core.database import Base


class Notification(Base):
    """Maps to the `notifications` table."""

    __tablename__ = "notifications"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    recipient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("people.id"),
        nullable=False,
    )

    type = Column(String, nullable=False)

    message = Column(Text, nullable=False)

    action_url = Column(Text, nullable=True)

    is_read = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    read_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    severity = Column(
        String,
        nullable=False,
        default="info",
        server_default="info",
    )

    entity_type = Column(
        String,
        nullable=True,
    )

    entity_id = Column(
        UUID(as_uuid=True),
        nullable=True,
    )

    requires_acknowledgement = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    acknowledged_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    acknowledged_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("people.id"),
        nullable=True,
    )

    dedup_key = Column(
        String,
        nullable=True,
    )

    # Relationships
    recipient = relationship(
        "Person",
        foreign_keys=[recipient_id],
        lazy="select",
    )

    enrichment = relationship(
        "NotificationEnrichment",
        back_populates="notification",
        uselist=False,
        lazy="select",
    )

    acknowledged_by = relationship(
        "Person",
        foreign_keys=[acknowledged_by_id],
        lazy="select",
    )