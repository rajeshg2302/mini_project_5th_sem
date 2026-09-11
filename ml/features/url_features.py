"""
PhishGuard — URL Feature Extraction Module

Extracts 22 deterministic, numeric features from a URL string by integrating
with the central backend feature extractor service.
Guarantees 100% parity between offline training and online inference.
"""

import sys
import os
from typing import Dict, List

# Ensure backend module is importable
backend_path = os.path.join(os.path.dirname(__file__), "..", "..", "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.services.feature_extractor import (
    extract_features as backend_extract_features,
    FEATURE_NAMES,
    get_feature_descriptions as backend_get_feature_descriptions,
)


def extract_features(url: str) -> Dict[str, float]:
    """Extract 22 numeric features using the unified feature extractor."""
    return backend_extract_features(url)


def extract_features_vector(url: str) -> List[float]:
    """Extract features as an ordered list matching FEATURE_NAMES."""
    feats = backend_extract_features(url)
    return [feats[name] for name in FEATURE_NAMES]


def get_feature_descriptions() -> Dict[str, str]:
    """Return human-readable feature descriptions."""
    return backend_get_feature_descriptions()
