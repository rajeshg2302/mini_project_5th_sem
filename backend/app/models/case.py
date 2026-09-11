"""
PhishGuard SQLAlchemy ORM Model for Threat Investigation Cases
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_number = Column(String(50), unique=True, nullable=False, index=True) # e.g. PG-00042
    scan_id = Column(Integer, ForeignKey("scans.id"), nullable=True)
    url = Column(Text, nullable=False)
    verdict = Column(String(30), nullable=False)
    risk_score = Column(Integer, nullable=False)
    severity = Column(String(20), nullable=False) # CRITICAL, HIGH, MEDIUM, GUARDED, LOW
    status = Column(String(30), nullable=False, default="NEW") # NEW, INVESTIGATING, CONFIRMED THREAT, FALSE POSITIVE, RESOLVED
    analyst_notes = Column(Text, nullable=True)
    assigned_analyst = Column(String(100), nullable=True, default="Security Analyst")
    evidence_summary = Column(Text, nullable=True) # JSON blob of key evidence indicators
    assessment = Column(Text, nullable=True) # Editable analyst investigation assessment
    resolution = Column(String(50), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
