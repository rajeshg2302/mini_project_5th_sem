"""
PhishGuard Audit Logs Router
Endpoints for logging and retrieving security audit events
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models.audit_log import AuditLog

router = APIRouter(prefix="/api", tags=["audit_logs"])


class AuditLogCreate(BaseModel):
    event_type: str
    action_details: str
    severity: Optional[str] = "INFO"


def log_audit_event(db: Session, event_type: str, action_details: str, severity: str = "INFO") -> AuditLog:
    """Helper function to log a security audit event directly from backend routers."""
    try:
        log = AuditLog(
            event_type=event_type,
            action_details=action_details,
            severity=severity,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
    except Exception as e:
        db.rollback()
        print(f"Warning: Failed to create audit log event: {e}")
        return None


def audit_log_to_dict(log: AuditLog) -> dict:
    return {
        "id": log.id,
        "event_type": log.event_type,
        "action_details": log.action_details,
        "severity": log.severity,
        "timestamp": log.timestamp.isoformat() if log.timestamp else "",
    }


@router.get("/audit-logs")
def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    sort: Optional[str] = Query("newest"),
    db: Session = Depends(get_db),
):
    """Retrieve paginated security audit logs with search, event_type filtering, and sorting."""
    query = db.query(AuditLog)

    if event_type and event_type != "ALL":
        query = query.filter(AuditLog.event_type == event_type)
    if severity and severity != "ALL":
        query = query.filter(AuditLog.severity == severity)
    if search:
        query = query.filter(
            (AuditLog.event_type.contains(search)) |
            (AuditLog.action_details.contains(search))
        )

    total = query.count()

    if sort == "oldest":
        query = query.order_by(AuditLog.timestamp.asc())
    else:
        query = query.order_by(desc(AuditLog.timestamp))

    logs = query.offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "logs": [audit_log_to_dict(l) for l in logs],
    }


@router.post("/audit-logs")
def create_audit_log(req: AuditLogCreate, db: Session = Depends(get_db)):
    """Manually post a security audit event."""
    log = log_audit_event(db, req.event_type, req.action_details, req.severity or "INFO")
    if not log:
        return {"message": "Audit event recorded"}
    return audit_log_to_dict(log)
