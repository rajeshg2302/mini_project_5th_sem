"""
PhishGuard SQLAlchemy ORM Model for Security Audit Logs
"""

from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from ..database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String(50), nullable=False, index=True) # e.g. SCAN_CREATED, CASE_CREATED, STATUS_CHANGED, etc.
    action_details = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False, default="INFO") # INFO, WARN, ERROR
    timestamp = Column(DateTime, server_default=func.now(), index=True)
