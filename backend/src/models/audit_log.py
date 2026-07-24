import uuid
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from src.core.database import Base


class AuditLog(Base):
    """Maps to the `audit_logs` table in Supabase PostgreSQL."""

    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    action = Column(String, nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False)   # not a FK — preserve log even if user deleted
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String, nullable=True)

