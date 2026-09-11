"""
PhishGuard History & Analytics Router
"""

import json
from datetime import datetime, timedelta
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from ..database import get_db
from ..models.scan import Scan
from ..services.report_generator import scan_to_response

router = APIRouter(prefix="/api", tags=["history"])


@router.get("/history")
def get_scan_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    verdict: str = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db),
):
    """Get paginated scan history with optional filtering."""
    query = db.query(Scan)

    if verdict:
        query = query.filter(Scan.verdict == verdict)
    if search:
        query = query.filter(Scan.url.contains(search))

    total = query.count()
    scans = query.order_by(desc(Scan.created_at)).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "scans": [
            {
                "id": s.id,
                "url": s.url,
                "risk_score": s.risk_score,
                "verdict": s.verdict,
                "confidence": s.confidence,
                "created_at": s.created_at.isoformat() if s.created_at else "",
            }
            for s in scans
        ],
    }


@router.get("/report/{scan_id}")
def get_scan_report(scan_id: int, db: Session = Depends(get_db)):
    """Get full report for a specific scan."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan_to_response(scan)


@router.delete("/history/{scan_id}")
def delete_scan(scan_id: int, db: Session = Depends(get_db)):
    """Delete a specific scan record."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    scan_url = scan.url
    db.delete(scan)
    db.commit()

    from .audit_logs import log_audit_event
    log_audit_event(db, "SCAN_DELETED", f"Deleted scan record #{scan_id} ({scan_url})", "WARN")

    return {
        "success": True,
        "message": "Scan deleted successfully",
        "id": scan_id
    }


@router.delete("/history")
def clear_scan_history(db: Session = Depends(get_db)):
    """Clear all scan history records from the database."""
    count = db.query(Scan).count()
    db.query(Scan).delete(synchronize_session=False)
    db.commit()

    from .audit_logs import log_audit_event
    log_audit_event(db, "HISTORY_CLEARED", f"Cleared all scan history ({count} records deleted)", "WARN")

    return {
        "success": True,
        "message": "All scan history cleared successfully",
        "deleted_count": count
    }


@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    """Get aggregated analytics data."""
    total_scans = db.query(Scan).count()
    
    if total_scans == 0:
        return {
            "total_scans": 0,
            "phishing_count": 0,
            "suspicious_count": 0,
            "safe_count": 0,
            "average_risk_score": 0,
            "threat_percentage": 0,
            "recent_scans": [],
            "risk_distribution": {
                "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0
            },
            "daily_scans": [],
        }

    phishing_count = db.query(Scan).filter(Scan.verdict == "Phishing").count()
    suspicious_count = db.query(Scan).filter(Scan.verdict == "Suspicious").count()
    safe_count = db.query(Scan).filter(Scan.verdict == "Safe").count()

    avg_score = db.query(func.avg(Scan.risk_score)).scalar() or 0

    threat_percentage = round(
        (phishing_count + suspicious_count) / max(total_scans, 1) * 100, 1
    )

    # Recent scans
    recent = db.query(Scan).order_by(desc(Scan.created_at)).limit(10).all()
    recent_scans = [
        {
            "id": s.id,
            "url": s.url,
            "risk_score": s.risk_score,
            "verdict": s.verdict,
            "confidence": s.confidence,
            "created_at": s.created_at.isoformat() if s.created_at else "",
        }
        for s in recent
    ]

    # Risk score distribution
    risk_ranges = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    all_scans = db.query(Scan.risk_score).all()
    for (score,) in all_scans:
        if score <= 20:
            risk_ranges["0-20"] += 1
        elif score <= 40:
            risk_ranges["21-40"] += 1
        elif score <= 60:
            risk_ranges["41-60"] += 1
        elif score <= 80:
            risk_ranges["61-80"] += 1
        else:
            risk_ranges["81-100"] += 1

    # Daily scan counts (last 30 days)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    daily_query = (
        db.query(
            func.date(Scan.created_at).label('date'),
            func.count().label('count'),
        )
        .filter(Scan.created_at >= thirty_days_ago)
        .group_by(func.date(Scan.created_at))
        .order_by(func.date(Scan.created_at))
        .all()
    )
    daily_scans = [{"date": str(row.date), "count": row.count} for row in daily_query]

    return {
        "total_scans": total_scans,
        "phishing_count": phishing_count,
        "suspicious_count": suspicious_count,
        "safe_count": safe_count,
        "average_risk_score": round(float(avg_score), 1),
        "threat_percentage": threat_percentage,
        "recent_scans": recent_scans,
        "risk_distribution": risk_ranges,
        "daily_scans": daily_scans,
    }
