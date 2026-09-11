"""
PhishGuard Cases Router
CRUD endpoints and Report Generator for SOC Threat Case Management
"""

import io
import json
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models.case import Case
from ..models.scan import Scan
from ..schemas.case import CaseCreate, CaseUpdate, CaseResponse

router = APIRouter(prefix="/api", tags=["cases"])


def generate_case_number(db: Session) -> str:
    """Generate next sequential case number format PG-XXXXX."""
    count = db.query(Case).count() + 1
    return f"PG-{count:05d}"


def case_to_dict(c: Case) -> dict:
    evidence = c.evidence_summary
    if isinstance(evidence, str) and evidence:
        try:
            evidence = json.loads(evidence)
        except Exception:
            pass
    return {
        "id": c.id,
        "case_number": c.case_number,
        "scan_id": c.scan_id,
        "url": c.url,
        "verdict": c.verdict,
        "risk_score": c.risk_score,
        "severity": c.severity,
        "status": c.status,
        "analyst_notes": c.analyst_notes or "",
        "assigned_analyst": c.assigned_analyst or "Security Analyst",
        "evidence_summary": evidence or {},
        "assessment": getattr(c, "assessment", "") or "",
        "resolution": getattr(c, "resolution", "") or "",
        "resolution_notes": getattr(c, "resolution_notes", "") or "",
        "created_at": c.created_at.isoformat() if c.created_at else "",
        "updated_at": c.updated_at.isoformat() if c.updated_at else "",
    }


@router.post("/cases")
def create_case(req: CaseCreate, db: Session = Depends(get_db)):
    """Create a new threat investigation case or return existing for same scan."""
    if req.scan_id:
        existing = db.query(Case).filter(Case.scan_id == req.scan_id).first()
        if existing:
            return case_to_dict(existing)

    case_num = generate_case_number(db)

    evidence_json = None
    if req.evidence_summary is not None:
        if isinstance(req.evidence_summary, (dict, list)):
            evidence_json = json.dumps(req.evidence_summary)
        else:
            evidence_json = str(req.evidence_summary)

    case = Case(
        case_number=case_num,
        scan_id=req.scan_id,
        url=req.url,
        verdict=req.verdict,
        risk_score=req.risk_score,
        severity=req.severity,
        status=req.status or "NEW",
        analyst_notes=req.analyst_notes,
        assigned_analyst=req.assigned_analyst or "Security Analyst",
        evidence_summary=evidence_json,
        assessment=req.assessment,
        resolution=req.resolution,
        resolution_notes=req.resolution_notes,
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    from .audit_logs import log_audit_event
    log_audit_event(db, "CASE_CREATED", f"Created investigation case #{case.case_number} for {case.url}", "INFO")

    return case_to_dict(case)


@router.get("/cases")
def list_cases(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: Optional[str] = Query("newest"),
    db: Session = Depends(get_db),
):
    """Retrieve paginated threat cases with search, status filtering, and sorting."""
    query = db.query(Case)

    if status and status != "ALL":
        query = query.filter(Case.status == status)
    if severity and severity != "ALL":
        query = query.filter(Case.severity == severity)
    if search:
        query = query.filter(
            (Case.url.contains(search)) |
            (Case.case_number.contains(search)) |
            (Case.analyst_notes.contains(search))
        )

    total = query.count()

    if sort == "oldest":
        query = query.order_by(Case.created_at.asc())
    elif sort == "highest_risk":
        query = query.order_by(Case.risk_score.desc())
    elif sort == "lowest_risk":
        query = query.order_by(Case.risk_score.asc())
    else: # newest (default)
        query = query.order_by(Case.updated_at.desc())

    cases = query.offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "cases": [case_to_dict(c) for c in cases],
    }


@router.get("/cases/stats")
def get_cases_stats(db: Session = Depends(get_db)):
    """Retrieve aggregate statistics for SOC case management dashboard."""
    all_cases = db.query(Case).all()
    total = len(all_cases)
    open_cases = sum(1 for c in all_cases if c.status in ["NEW", "INVESTIGATING"])
    confirmed_threats = sum(1 for c in all_cases if c.status == "CONFIRMED THREAT")
    false_positives = sum(1 for c in all_cases if c.status == "FALSE POSITIVE")
    resolved = sum(1 for c in all_cases if c.status == "RESOLVED")
    high_risk_queue = sum(1 for c in all_cases if c.status in ["NEW", "INVESTIGATING"] and c.risk_score >= 70)

    return {
        "total": total,
        "open_cases": open_cases,
        "confirmed_threats": confirmed_threats,
        "false_positives": false_positives,
        "resolved": resolved,
        "high_risk_queue": high_risk_queue,
    }


@router.get("/cases/{case_id}")
def get_case(case_id: int, db: Session = Depends(get_db)):
    """Retrieve details for a specific case by ID."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found")
    return case_to_dict(case)


@router.put("/cases/{case_id}")
def update_case(case_id: int, req: CaseUpdate, db: Session = Depends(get_db)):
    """Update status, analyst notes, investigator assignment, assessment, or resolution for a case."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found")

    if req.status is not None:
        case.status = req.status
    if req.analyst_notes is not None:
        case.analyst_notes = req.analyst_notes
    if req.assigned_analyst is not None:
        case.assigned_analyst = req.assigned_analyst
    if req.severity is not None:
        case.severity = req.severity
    if req.assessment is not None:
        case.assessment = req.assessment
    if req.resolution is not None:
        case.resolution = req.resolution
    if req.resolution_notes is not None:
        case.resolution_notes = req.resolution_notes

    db.commit()
    db.refresh(case)

    from .audit_logs import log_audit_event
    log_audit_event(db, "STATUS_CHANGED", f"Updated case #{case.case_number} status to {case.status}", "INFO")

    return case_to_dict(case)


@router.post("/cases/{case_id}/reopen")
def reopen_case(case_id: int, db: Session = Depends(get_db)):
    """Reopen a resolved or closed investigation case."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found")

    case.status = "INVESTIGATING"
    db.commit()
    db.refresh(case)

    from .audit_logs import log_audit_event
    log_audit_event(db, "STATUS_CHANGED", f"Reopened case #{case.case_number} to INVESTIGATING", "INFO")

    return case_to_dict(case)


@router.delete("/cases/{case_id}")
def delete_case(case_id: int, db: Session = Depends(get_db)):
    """Delete an investigation case record (preserves original scan history)."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found")

    case_num = case.case_number
    case_url = case.url

    db.delete(case)
    db.commit()

    from .audit_logs import log_audit_event
    log_audit_event(db, "CASE_DELETED", f"Deleted investigation case #{case_num} ({case_url})", "WARN")

    return {"message": f"Case {case_num} deleted successfully"}


@router.get("/cases/{case_id}/report")
def get_case_report(
    case_id: int,
    format: Optional[str] = Query("pdf"),
    db: Session = Depends(get_db)
):
    """
    Generate official PhishGuard X Security Investigation Report (PDF or JSON).
    Contains all 18 required audit sections.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found")

    scan = None
    if case.scan_id:
        scan = db.query(Scan).filter(Scan.id == case.scan_id).first()

    scan_features = json.loads(scan.features) if scan and scan.features else {}
    scan_models = json.loads(scan.model_predictions) if scan and scan.model_predictions else []
    scan_shap = json.loads(scan.shap_values) if scan and scan.shap_values else []
    scan_reasons = json.loads(scan.top_reasons) if scan and scan.top_reasons else []

    # 18 Required Report Sections Data Structure
    analyst_assessment_text = case.assessment or (
        f"The target URL was classified as {case.verdict} with a risk score of {case.risk_score}/100. "
        f"Decision derived deterministically from 22 extracted URL features."
    )

    report_data = {
        "report_title": "PHISHGUARD X THREAT INVESTIGATION REPORT",
        "case_information": {
            "case_number": case.case_number,
            "case_id": case.id,
            "scan_id": case.scan_id or "Not available",
            "assigned_analyst": case.assigned_analyst or "Security Analyst",
            "created_at": case.created_at.isoformat() if case.created_at else "Not available",
            "updated_at": case.updated_at.isoformat() if case.updated_at else "Not available",
        },
        "target_url": case.url,
        "timestamp": case.created_at.isoformat() if case.created_at else "Not available",
        "verdict": case.verdict,
        "risk_score": f"{case.risk_score} / 100",
        "risk_level": case.severity,
        "ml_prediction": case.verdict,
        "probability": f"{(scan.confidence * 100):.1f}%" if scan and scan.confidence is not None else "Not available",
        "model_information": {
            "primary_model": scan.best_model_name if scan and scan.best_model_name else "Ensemble Pipeline",
            "verified_models": [m.get("model_name") for m in scan_models] if scan_models else ["Logistic Regression", "Decision Tree", "Random Forest", "Gradient Boosting"],
        },
        "twenty_two_feature_analysis": scan_features if scan_features else "Not available",
        "threat_dimensions": {
            "url_structure": "Evaluated from URL length, path depth, query string complexity",
            "hostname_ip_risk": "Evaluated from IP host, domain length, subdomain count",
            "obfuscation_risk": "Evaluated from entropy, shortener presence, special char ratio",
            "suspicious_keywords": "Evaluated from credential triggers",
            "security_indicators": "Evaluated from HTTPS protocol status and TLD risk",
        },
        "severity_matrix": [
            {"indicator": "IP-based hostname", "detected": bool(scan_features.get("has_ip_address"))},
            {"indicator": "Suspicious keywords", "detected": bool(scan_features.get("has_suspicious_keywords"))},
            {"indicator": "URL shortener obfuscation", "detected": bool(scan_features.get("has_shortener"))},
            {"indicator": "HTTPS active", "detected": bool(scan_features.get("has_https"))},
        ] if scan_features else "Not available",
        "risk_factors": scan_reasons if scan_reasons else ["Elevated risk indicators observed during URL extraction"],
        "recommendations": [
            "Do not enter account credentials or personal financial information.",
            "Verify destination domain through independent official channels.",
            "Report malicious link to local Security Operations Center (SOC)."
        ] if case.verdict.lower() != "safe" else ["Standard security caution recommended."],
        "analyst_notes": case.analyst_notes or "No analyst notes provided.",
        "investigation_status": case.status,
        "analyst_assessment": analyst_assessment_text,
        "resolution": getattr(case, "resolution", "") or "Pending Investigation Resolution",
        "resolution_notes": getattr(case, "resolution_notes", "") or "No resolution notes recorded.",
    }

    if format.lower() == "json":
        return report_data

    # PDF Report Generation using ReportLab
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#06b6d4'), spaceAfter=8)
        subtitle_style = ParagraphStyle('SubTitleStyle', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#94a3b8'), spaceAfter=14)
        h2_style = ParagraphStyle('H2Style', parent=styles['Heading2'], fontSize=12, textColor=colors.HexColor('#38bdf8'), spaceBefore=10, spaceAfter=4)
        body_style = ParagraphStyle('BodyStyle', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#1e293b'), spaceAfter=4)
        mono_style = ParagraphStyle('MonoStyle', parent=styles['Normal'], fontSize=8, fontName='Helvetica', textColor=colors.HexColor('#0f172a'))

        elements = []

        elements.append(Paragraph("PHISHGUARD X — THREAT INVESTIGATION REPORT", title_style))
        elements.append(Paragraph(f"Official Cybersecurity Intelligence Audit • Case #{case.case_number}", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#06b6d4'), spaceAfter=12))

        # Summary Table
        summary_table_data = [
            ["Case Number", case.case_number, "Status", case.status],
            ["Target URL", case.url[:60] + ("..." if len(case.url) > 60 else ""), "Verdict", case.verdict],
            ["Risk Score", f"{case.risk_score} / 100", "Risk Level", case.severity],
            ["Assigned Analyst", case.assigned_analyst or "Security Analyst", "Created At", case.created_at.strftime("%Y-%m-%d %H:%M") if case.created_at else "N/A"],
        ]
        t = Table(summary_table_data, colWidths=[100, 170, 100, 170])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#0f172a')),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 10))

        # Sections
        sections = [
            ("1. Case & Model Identification", [
                f"• Scan ID: {case.scan_id or 'Not linked'}",
                f"• Primary ML Model: {scan.best_model_name if scan and scan.best_model_name else 'Ensemble Pipeline'}",
                f"• Model Confidence: {(scan.confidence * 100):.1f}%" if scan and scan.confidence is not None else "• Model Confidence: N/A",
            ]),
            ("2. AI Security Assessment", [
                report_data["analyst_assessment"],
            ]),
            ("3. Analyst Notes & Resolution", [
                f"• Analyst Notes: {case.analyst_notes or 'None recorded'}",
                f"• Resolution: {getattr(case, 'resolution', '') or 'Pending'}",
                f"• Resolution Notes: {getattr(case, 'resolution_notes', '') or 'None recorded'}",
            ]),
            ("4. Identified Risk Factors & Recommendations", [
                f"• Risk Factors: {', '.join(scan_reasons) if scan_reasons else 'Elevated URL indicators'}",
                f"• Recommendations: Avoid submitting credentials; independently verify hostname.",
            ]),
        ]

        for sec_title, sec_bullets in sections:
            elements.append(Paragraph(sec_title, h2_style))
            for b in sec_bullets:
                elements.append(Paragraph(b, body_style))
            elements.append(Spacer(1, 4))

        # 22 Feature Snapshot
        if scan_features:
            elements.append(Paragraph("5. Extracted 22 URL Features Snapshot", h2_style))
            feat_rows = [["Feature Name", "Value", "Feature Name", "Value"]]
            feat_keys = list(scan_features.keys())
            for i in range(0, len(feat_keys), 2):
                k1 = feat_keys[i]
                v1 = str(scan_features[k1])
                k2 = feat_keys[i+1] if i+1 < len(feat_keys) else ""
                v2 = str(scan_features[k2]) if k2 else ""
                feat_rows.append([k1, v1, k2, v2])

            ft = Table(feat_rows, colWidths=[140, 130, 140, 130])
            ft.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                ('FONTSIZE', (0,0), (-1,-1), 7),
                ('PADDING', (0,0), (-1,-1), 3),
            ]))
            elements.append(ft)

        doc.build(elements)
        buffer.seek(0)
        return Response(
            content=buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename={case.case_number}.pdf"}
        )
    except Exception as e:
        # Fallback to JSON if PDF engine encounters unexpected error
        return report_data


