"""
PhishGuard Pydantic Schemas for Threat Investigation Cases
"""

from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field


class CaseCreate(BaseModel):
    url: str
    verdict: str
    risk_score: int = Field(..., ge=0, le=100)
    severity: str = "MEDIUM"
    scan_id: Optional[int] = None
    status: str = "NEW"
    analyst_notes: Optional[str] = None
    assigned_analyst: Optional[str] = "Security Analyst"
    evidence_summary: Optional[Any] = None
    assessment: Optional[str] = None
    resolution: Optional[str] = None
    resolution_notes: Optional[str] = None


class CaseUpdate(BaseModel):
    status: Optional[str] = None
    analyst_notes: Optional[str] = None
    assigned_analyst: Optional[str] = None
    severity: Optional[str] = None
    assessment: Optional[str] = None
    resolution: Optional[str] = None
    resolution_notes: Optional[str] = None


class CaseResponse(BaseModel):
    id: int
    case_number: str
    scan_id: Optional[int] = None
    url: str
    verdict: str
    risk_score: int
    severity: str
    status: str
    analyst_notes: Optional[str] = None
    assigned_analyst: Optional[str] = None
    evidence_summary: Optional[Any] = None
    assessment: Optional[str] = None
    resolution: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        orm_mode = True
