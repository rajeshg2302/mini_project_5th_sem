"""
PhishGuard ML Pipeline — Dataset Validator & Quality Auditor

Performs automated data quality checks:
  1. Missing values
  2. Duplicate URLs & duplicate feature vectors
  3. Invalid or unknown labels
  4. Class imbalance ratio
  5. Malformed URL schemes / structures
  6. Suspicious duplicate feature distributions

Generates JSON audit reports at data/dataset_quality_report.json.
Does NOT silently delete records — logs and documents all findings.
"""

import os
import sys
import json
import pandas as pd
import numpy as np
from urllib.parse import urlparse

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from ml.config import DATASET_PATH, ACTIVE_DATASET_MODE, FEATURE_NAMES, DATA_DIR


def validate_dataset(csv_path: str = DATASET_PATH) -> dict:
    """Run thorough data quality audit on specified CSV dataset."""
    print("=" * 60)
    print(f"  PhishGuard Dataset Quality Audit")
    print(f"  Dataset Mode: {ACTIVE_DATASET_MODE}")
    print(f"  File Path:    {csv_path}")
    print("=" * 60)

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset CSV not found at {csv_path}")

    df = pd.read_csv(csv_path)
    total_samples = len(df)

    # 1. Missing Values Check
    missing_counts = df.isnull().sum().to_dict()
    total_missing_values = int(df.isnull().sum().sum())

    # 2. Label Distribution & Invalid Labels
    label_col = "label" if "label" in df.columns else "verdict"
    if label_col not in df.columns:
        raise KeyError(f"Label column ('label') missing in {csv_path}")

    raw_labels = df[label_col].value_counts().to_dict()

    # Binary normalization check (0 = legit, 1 = phishing)
    legit_count = int((df[label_col] == 0).sum() + (df[label_col] == "0").sum() + (df[label_col] == "legitimate").sum())
    phish_count = int((df[label_col] == 1).sum() + (df[label_col] == "1").sum() + (df[label_col] == "phishing").sum())
    invalid_labels = total_samples - (legit_count + phish_count)

    imbalance_ratio = round(phish_count / max(legit_count, 1), 4)

    # 3. Duplicate URLs & Feature Vectors
    url_col = "url" if "url" in df.columns else None
    duplicate_urls = int(df[url_col].duplicated().sum()) if url_col else 0

    available_features = [f for f in FEATURE_NAMES if f in df.columns]
    duplicate_features = int(df.duplicated(subset=available_features).sum()) if available_features else 0

    # 4. Malformed URLs Check
    malformed_urls = 0
    if url_col:
        for val in df[url_col].dropna():
            try:
                parsed = urlparse(str(val))
                if not parsed.scheme or not parsed.netloc:
                    malformed_urls += 1
            except Exception:
                malformed_urls += 1

    report = {
        "dataset_mode": ACTIVE_DATASET_MODE,
        "dataset_path": csv_path,
        "total_samples": total_samples,
        "class_distribution": {
            "legitimate": legit_count,
            "phishing": phish_count,
            "imbalance_ratio": imbalance_ratio,
        },
        "quality_metrics": {
            "duplicate_urls": duplicate_urls,
            "duplicate_feature_vectors": duplicate_features,
            "malformed_urls": malformed_urls,
            "invalid_labels": invalid_labels,
            "total_missing_values": total_missing_values,
        },
        "missing_per_column": {k: int(v) for k, v in missing_counts.items() if v > 0},
    }

    # Print summary
    print(f"\nSamples Analyzed:          {total_samples}")
    print(f"Legitimate Samples (0):    {legit_count}")
    print(f"Phishing Samples (1):      {phish_count}")
    print(f"Imbalance Ratio:           {imbalance_ratio}")
    print(f"Duplicate URLs:            {duplicate_urls}")
    print(f"Duplicate Feature Vectors: {duplicate_features}")
    print(f"Malformed URLs:            {malformed_urls}")
    print(f"Invalid Labels:            {invalid_labels}")
    print(f"Total Missing Values:      {total_missing_values}")

    # Save report JSON
    os.makedirs(DATA_DIR, exist_ok=True)
    report_path = os.path.join(DATA_DIR, "dataset_quality_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    print(f"\n[+] Quality Report written to: {report_path}")
    print("=" * 60)
    return report


if __name__ == "__main__":
    validate_dataset()
