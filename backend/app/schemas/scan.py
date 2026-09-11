"""
PhishGuard Pydantic Schemas for Request/Response Validation
"""

from pydantic import BaseModel, HttpUrl, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# ─── Request Schemas ──────────────────────────────────────────────

class ScanRequest(BaseModel):
    url: str

    @field_validator('url')
    @classmethod
    def validate_url(cls, v):
        v = v.strip()
        if not v:
            raise ValueError('URL cannot be empty')
        if len(v) > 2048:
            raise ValueError('URL is too long (max 2048 characters)')
        return v


# ─── Response Schemas ─────────────────────────────────────────────

class ModelPrediction(BaseModel):
    model_name: str
    prediction: int          # 0 or 1
    probability: float       # phishing probability
    confidence: float        # max probability


class ShapExplanation(BaseModel):
    feature: str
    value: float             # actual feature value
    shap_value: float        # SHAP contribution
    description: str         # human-readable explanation
    impact: str              # "increases_risk" or "decreases_risk"


class ScanResponse(BaseModel):
    id: int
    url: str
    risk_score: int
    verdict: str
    confidence: float
    features: Dict[str, float]
    model_predictions: List[ModelPrediction]
    shap_explanations: List[ShapExplanation]
    top_reasons: List[str]
    created_at: str

    class Config:
        from_attributes = True


class ScanHistoryItem(BaseModel):
    id: int
    url: str
    risk_score: int
    verdict: str
    confidence: float
    created_at: str

    class Config:
        from_attributes = True


class AnalyticsResponse(BaseModel):
    total_scans: int
    phishing_count: int
    suspicious_count: int
    safe_count: int
    average_risk_score: float
    threat_percentage: float
    recent_scans: List[ScanHistoryItem]
    risk_distribution: Dict[str, int]
    daily_scans: List[Dict[str, Any]]


class ModelComparisonResponse(BaseModel):
    models: Dict[str, Dict[str, Any]]
    feature_importances: Dict[str, Dict[str, float]]
