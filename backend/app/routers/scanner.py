"""
PhishGuard Scanner Router
POST /api/scan — Submit a URL for phishing analysis
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.scan import ScanRequest
from ..services.url_validator import validate_url, URLValidationError
from ..services.feature_extractor import extract_features
from ..services.ml_predictor import predictor
from ..services.explainer import generate_explanations, generate_top_reasons
from ..services.report_generator import create_scan_record, scan_to_response

router = APIRouter(prefix="/api", tags=["scanner"])


@router.post("/scan")
def scan_url(request: ScanRequest, db: Session = Depends(get_db)):
    """
    Full phishing analysis pipeline:
    1. Validate URL
    2. Extract features
    3. ML prediction
    4. Generate explanations
    5. Store and return report
    """
    # Step 1: Validate URL
    try:
        validated_url = validate_url(request.url)
    except URLValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Step 2: Check if models are loaded
    if not predictor.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="ML models not loaded. Please run the training pipeline first."
        )

    # Step 3: Extract features
    features = extract_features(validated_url)

    # Step 4: ML Prediction
    prediction_result = predictor.predict(features)

    # Step 5: Generate explanations
    explanations = generate_explanations(features, prediction_result)
    top_reasons = generate_top_reasons(
        explanations,
        prediction_result['verdict'],
        prediction_result['risk_score']
    )

    # Step 6: Store scan record
    scan = create_scan_record(
        db=db,
        url=validated_url,
        risk_score=prediction_result['risk_score'],
        verdict=prediction_result['verdict'],
        confidence=prediction_result['confidence'],
        features=features,
        shap_explanations=explanations,
        model_predictions=prediction_result['model_predictions'],
        top_reasons=top_reasons,
        best_model_name=prediction_result.get('best_model_name'),
    )

    # Step 7: Log security audit event
    from .audit_logs import log_audit_event
    severity = "WARN" if prediction_result['verdict'] == "Phishing" else "INFO"
    log_audit_event(db, "SCAN_CREATED", f"Scanned URL: {validated_url} — Verdict: {prediction_result['verdict']} (Risk: {prediction_result['risk_score']}/100)", severity)

    # Step 8: Return response
    return scan_to_response(scan)
