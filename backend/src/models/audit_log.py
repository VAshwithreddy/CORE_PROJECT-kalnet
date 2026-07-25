import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from src.core.database import Base


class AuditLog(Base):
    """Maps to the `audit_logs` table in Supabase PostgreSQL."""

    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("people.id"), nullable=True)
    action = Column(String, nullable=False)
    entity = Column(String, nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    before_state = Column(JSONB, nullable=True)
    after_state = Column(JSONB, nullable=True)
    reason = Column(Text, nullable=True)
    request_id = Column(UUID(as_uuid=True), nullable=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    @property
    def user_id(self) -> uuid.UUID:
        return self.actor_id or uuid.UUID("00000000-0000-0000-0000-000000000001")

    @property
    def timestamp(self) -> DateTime:
        return self.created_at

    @property
    def details(self) -> str:
        parts = [f"Action: {self.action}", f"Entity: {self.entity}"]
        if self.reason:
            parts.append(f"Reason: {self.reason}")
        return " - ".join(parts)

    @property
    def ip_address(self) -> str:
        return "127.0.0.1"
