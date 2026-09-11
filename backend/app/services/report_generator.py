"""
PhishGuard Report Generator
Assembles the final security report from all analysis components.
"""

import json
from typing import Dict, List
from sqlalchemy.orm import Session
from ..models.scan import Scan


def create_scan_record(
    db: Session,
    url: str,
    risk_score: int,
    verdict: str,
    confidence: float,
    features: Dict,
    shap_explanations: List[Dict],
    model_predictions: List[Dict],
    top_reasons: List[str],
    best_model_name: str = None,
) -> Scan:
    """
    Create and persist a scan record to the database.
    
    Returns the created Scan ORM instance.
    """
    scan = Scan(
        url=url,
        risk_score=risk_score,
        verdict=verdict,
        confidence=confidence,
        features=json.dumps(features),
        shap_values=json.dumps(shap_explanations),
        model_predictions=json.dumps(model_predictions),
        top_reasons=json.dumps(top_reasons),
        best_model_name=best_model_name,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


def scan_to_response(scan: Scan) -> Dict:
    """Convert a Scan ORM instance to API response dict."""
    return {
        'id': scan.id,
        'url': scan.url,
        'risk_score': scan.risk_score,
        'verdict': scan.verdict,
        'confidence': scan.confidence,
        'features': json.loads(scan.features),
        'model_predictions': json.loads(scan.model_predictions),
        'shap_explanations': json.loads(scan.shap_values),
        'top_reasons': json.loads(scan.top_reasons),
        'created_at': scan.created_at.isoformat() if scan.created_at else '',
        'best_model_name': scan.best_model_name,
    }
