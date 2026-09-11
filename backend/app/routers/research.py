"""
PhishGuard Phase 14 — Research API Router
All endpoints under /api/research/
All data comes from actual evaluation results — never fabricated.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel

from ..database import get_db
from ..services import research_service as rs

router = APIRouter(prefix="/api/research", tags=["research"])


# ─── Request Models ───────────────────────────────────────────────────────────

class CVRequest(BaseModel):
    model_key:  str = "random_forest"
    metric:     str = "f1"
    n_splits:   int = 5


class ThresholdRequest(BaseModel):
    model_key: str = "random_forest"


class RobustnessRequest(BaseModel):
    url:           str
    modifications: List[str] = []


class StabilityRequest(BaseModel):
    model_key: str = "random_forest"
    n_runs:    int = 5


class ExperimentCreate(BaseModel):
    dataset_name:    str = "Synthetic Development Dataset"
    dataset_mode:    str = "synthetic"
    model_name:      str = "all"
    split:           str = "80/20 Stratified"
    random_seed:     int = 42
    metrics:         dict = {}
    model_version:   str = "1.0.0-phase5"
    dataset_version: str = "synthetic-v1"
    notes:           str = ""


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/datasets")
def get_datasets():
    """Return dataset availability and quality info."""
    return rs.get_dataset_info()


@router.get("/model-comparison")
def get_model_comparison():
    """Return actual evaluation metrics for all 4 models. Never fabricated."""
    return rs.get_evaluation_results()


@router.get("/feature-importance")
def get_feature_importance():
    """Return actual feature importances derived from trained models."""
    data = rs.get_evaluation_results()
    return {"feature_importances": data.get("feature_importances", {})}


@router.post("/cross-validation")
def run_cross_validation(req: CVRequest):
    """Run or return 5-fold stratified CV for a specified model and metric."""
    valid_models  = ["logistic_regression", "decision_tree", "random_forest", "gradient_boosting"]
    valid_metrics = ["f1", "accuracy", "precision", "recall", "roc_auc"]
    if req.model_key not in valid_models:
        raise HTTPException(status_code=400, detail=f"Invalid model_key. Choose from: {valid_models}")
    if req.metric not in valid_metrics:
        raise HTTPException(status_code=400, detail=f"Invalid metric. Choose from: {valid_metrics}")
    if not (2 <= req.n_splits <= 10):
        raise HTTPException(status_code=400, detail="n_splits must be between 2 and 10")
    result = rs.run_cross_validation(req.model_key, req.metric, req.n_splits)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@router.post("/threshold-analysis")
def threshold_analysis(req: ThresholdRequest):
    """Compute P/R/F1/FP/FN at thresholds 0.05–0.95 for a model."""
    valid_models = ["logistic_regression", "decision_tree", "random_forest", "gradient_boosting"]
    if req.model_key not in valid_models:
        raise HTTPException(status_code=400, detail=f"Invalid model_key. Choose from: {valid_models}")
    result = rs.compute_threshold_analysis(req.model_key)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@router.get("/roc-curve")
def get_roc_curve():
    """Return ROC curve data for all 4 models from actual test predictions."""
    result = rs.compute_roc_curve_data()
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@router.get("/pr-curve")
def get_pr_curve():
    """Return Precision-Recall curve data for all 4 models."""
    result = rs.compute_pr_curve_data()
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@router.post("/robustness")
def robustness_test(req: RobustnessRequest):
    """
    Offline robustness test — modifies URL features, re-runs ML ensemble.
    NEVER fetches the URL. NEVER visits external websites.
    """
    if not req.url or len(req.url.strip()) < 3:
        raise HTTPException(status_code=400, detail="A valid URL is required")
    valid_mods = [
        "add_subdomain", "add_keyword", "add_query_params",
        "use_http", "use_https", "add_ip", "add_shortener",
        "increase_entropy", "increase_length", "suspicious_tld",
    ]
    invalid = [m for m in req.modifications if m not in valid_mods]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid modifications: {invalid}")
    result = rs.run_robustness_test(req.url, req.modifications)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@router.post("/stability")
def stability_test(req: StabilityRequest):
    """Run model stability evaluation across multiple random seeds."""
    valid_models = ["logistic_regression", "decision_tree", "random_forest", "gradient_boosting"]
    if req.model_key not in valid_models:
        raise HTTPException(status_code=400, detail=f"Invalid model_key. Choose from: {valid_models}")
    if not (2 <= req.n_runs <= 10):
        raise HTTPException(status_code=400, detail="n_runs must be between 2 and 10")
    result = rs.run_stability_test(req.model_key, req.n_runs)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@router.get("/leakage-check")
def check_data_leakage():
    """Run dataset integrity and leakage audit."""
    return rs.detect_data_leakage()


@router.get("/research-summary")
def get_research_summary():
    """Return auto-generated research conclusions from measured results."""
    result = rs.generate_research_summary()
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@router.get("/experiments")
def list_experiments(limit: int = 50, db: Session = Depends(get_db)):
    """List all saved research experiments."""
    return {"experiments": rs.list_experiments(db, limit), "total": len(rs.list_experiments(db, limit))}


@router.get("/experiments/{experiment_id}")
def get_experiment(experiment_id: str, db: Session = Depends(get_db)):
    """Get a single experiment by EXP-XXXXX ID."""
    exp = rs.get_experiment(db, experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail=f"Experiment {experiment_id} not found")
    return exp


@router.post("/experiments")
def create_experiment(req: ExperimentCreate, db: Session = Depends(get_db)):
    """Save a new research experiment to the database."""
    exp = rs.save_experiment(db, req.model_dump())
    return exp
