import os
import json
from fastapi import APIRouter
from ..services.ml_predictor import predictor
from ..config import ML_MODELS_DIR

router = APIRouter(prefix="/api", tags=["models"])


@router.get("/models/compare")
def compare_models():
    """Get evaluation metrics, metadata, and dataset mode for all verified models."""
    results = predictor.get_evaluation_results()
    importances = predictor.get_feature_importances()
    
    metadata = {}
    meta_path = os.path.join(ML_MODELS_DIR, 'metadata.json')
    if os.path.exists(meta_path):
        try:
            with open(meta_path, 'r') as f:
                metadata = json.load(f)
        except Exception:
            pass

    dataset_mode = metadata.get('dataset_mode', 'synthetic')

    return {
        "dataset_mode": dataset_mode,
        "metadata": metadata,
        "models": results,
        "feature_importances": importances,
    }


@router.get("/models/feature-importance")
def get_feature_importance():
    """Get feature importance rankings for all models."""
    return predictor.get_feature_importances()

