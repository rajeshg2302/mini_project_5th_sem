"""
PhishGuard — Data Preprocessing Module

Handles:
  1. Loading raw CSV datasets with flexible column detection.
  2. Label normalization (various string/int formats → 0/1).
  3. Feature extraction for every URL row.
  4. Missing-value handling and validation.
  5. Stratified train/test split (no data leakage).
  6. Saving/loading processed splits.

All randomness is seeded via config.RANDOM_SEED for reproducibility.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from typing import Tuple, Optional

from sklearn.model_selection import train_test_split

# Resolve imports whether run as a module or script
try:
    from ml.config import (
        RANDOM_SEED, TEST_SIZE, FEATURE_NAMES,
        LABEL_MAP_LEGITIMATE, LABEL_MAP_PHISHING,
        RAW_DATA_DIR, PROCESSED_DATA_DIR,
    )
    from ml.features.url_features import extract_features
except ImportError:
    from ..config import (
        RANDOM_SEED, TEST_SIZE, FEATURE_NAMES,
        LABEL_MAP_LEGITIMATE, LABEL_MAP_PHISHING,
        RAW_DATA_DIR, PROCESSED_DATA_DIR,
    )
    from ..features.url_features import extract_features


# ─── Dataset Loading ──────────────────────────────────────────────


def _detect_columns(df: pd.DataFrame) -> Tuple[str, str]:
    """
    Auto-detect the URL column and label column from the DataFrame.
    Supports common naming conventions from popular datasets.
    """
    url_candidates = ["url", "URL", "urls", "URLs", "uri", "URI",
                       "website", "Website", "link", "Link"]
    label_candidates = ["label", "Label", "labels", "Labels",
                         "class", "Class", "type", "Type",
                         "status", "Status", "result", "Result",
                         "phishing", "Phishing"]

    url_col = None
    label_col = None

    for col in df.columns:
        col_stripped = col.strip()
        if col_stripped in url_candidates and url_col is None:
            url_col = col
        if col_stripped in label_candidates and label_col is None:
            label_col = col

    # Fallback: if only two columns, assume first=url, second=label
    if url_col is None and label_col is None and len(df.columns) == 2:
        url_col = df.columns[0]
        label_col = df.columns[1]

    if url_col is None:
        raise ValueError(
            f"Cannot detect URL column. Columns found: {list(df.columns)}\n"
            f"Expected one of: {url_candidates}"
        )
    if label_col is None:
        raise ValueError(
            f"Cannot detect label column. Columns found: {list(df.columns)}\n"
            f"Expected one of: {label_candidates}"
        )

    return url_col, label_col


def _normalize_label(raw_label) -> Optional[int]:
    """
    Convert a raw label to binary int (0 or 1).
    Returns None if the label is unrecognized.
    """
    if pd.isna(raw_label):
        return None

    val = str(raw_label).strip().lower()

    if val in {str(v).lower() for v in LABEL_MAP_LEGITIMATE}:
        return 0
    if val in {str(v).lower() for v in LABEL_MAP_PHISHING}:
        return 1

    # Try numeric
    try:
        num = int(float(val))
        if num == 0:
            return 0
        if num == 1:
            return 1
    except (ValueError, TypeError):
        pass

    return None


def load_dataset(csv_path: str) -> pd.DataFrame:
    """
    Load a raw CSV dataset and return a cleaned DataFrame with
    columns: ['url', 'label'].

    Parameters
    ----------
    csv_path : str
        Path to the CSV file.

    Returns
    -------
    pd.DataFrame
        Columns: 'url' (str), 'label' (int: 0 or 1).

    Raises
    ------
    FileNotFoundError
        If the CSV file does not exist.
    ValueError
        If required columns cannot be detected or labels are invalid.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found: {csv_path}")

    print(f"Loading dataset: {csv_path}")
    df = pd.read_csv(csv_path, dtype=str, na_values=["", "NA", "null", "NaN"])

    if df.empty:
        raise ValueError("Dataset is empty.")

    # Detect columns
    url_col, label_col = _detect_columns(df)
    print(f"  Detected URL column: '{url_col}'")
    print(f"  Detected label column: '{label_col}'")

    # Rename to standard names
    df = df.rename(columns={url_col: "url", label_col: "label"})
    df = df[["url", "label"]].copy()

    # Drop rows with missing URL
    original_count = len(df)
    df = df.dropna(subset=["url"])
    df = df[df["url"].str.strip().astype(bool)]
    dropped_url = original_count - len(df)
    if dropped_url > 0:
        print(f"  Dropped {dropped_url} rows with missing/empty URL")

    # Normalize labels
    df["label"] = df["label"].apply(_normalize_label)

    # Drop unrecognized labels
    unknown_mask = df["label"].isna()
    unknown_count = unknown_mask.sum()
    if unknown_count > 0:
        print(f"  WARNING: Dropped {unknown_count} rows with unrecognized labels")
        df = df.dropna(subset=["label"])

    df["label"] = df["label"].astype(int)

    # Summary
    n_legit = (df["label"] == 0).sum()
    n_phish = (df["label"] == 1).sum()
    print(f"  Total samples: {len(df)}")
    print(f"  Legitimate (0): {n_legit}")
    print(f"  Phishing   (1): {n_phish}")
    print(f"  Balance ratio: {n_phish / max(n_legit, 1):.2f}")

    return df.reset_index(drop=True)


# ─── Feature Extraction ──────────────────────────────────────────


def extract_all_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply feature extraction to every URL in the DataFrame.

    Parameters
    ----------
    df : pd.DataFrame
        Must contain a 'url' column.

    Returns
    -------
    pd.DataFrame
        Feature matrix with columns matching FEATURE_NAMES,
        plus 'url' and 'label' columns preserved.
    """
    print("Extracting features from URLs...")
    total = len(df)

    feature_rows = []
    for idx, row in df.iterrows():
        url = row["url"]
        try:
            features = extract_features(url)
        except Exception as e:
            # On any parsing error, produce zeros for all features
            print(f"  WARNING: Feature extraction failed for row {idx}: {e}")
            features = {name: 0.0 for name in FEATURE_NAMES}
        feature_rows.append(features)

        # Progress indicator
        if (idx + 1) % 5000 == 0:
            print(f"  Processed {idx + 1}/{total} URLs...")

    features_df = pd.DataFrame(feature_rows, columns=FEATURE_NAMES)
    print(f"  Feature extraction complete: {len(features_df)} rows × "
          f"{len(FEATURE_NAMES)} features")

    # Combine features with url and label
    result = pd.concat([
        df[["url", "label"]].reset_index(drop=True),
        features_df.reset_index(drop=True),
    ], axis=1)

    return result


# ─── Validation & Cleaning ───────────────────────────────────────


def validate_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Validate and clean the feature DataFrame.

    - Replaces NaN/inf with 0.
    - Ensures all feature columns exist and are numeric.
    """
    for col in FEATURE_NAMES:
        if col not in df.columns:
            print(f"  WARNING: Missing feature column '{col}', filling with 0")
            df[col] = 0.0
        else:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
            # Replace infinity values
            df[col] = df[col].replace([np.inf, -np.inf], 0.0)

    return df


# ─── Train/Test Split ────────────────────────────────────────────


def split_dataset(
    df: pd.DataFrame,
    test_size: float = TEST_SIZE,
    random_state: int = RANDOM_SEED,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Stratified train/test split.

    Uses stratified splitting to preserve class balance.
    No data leakage: splitting happens BEFORE any scaling/normalization
    (scaling is done inside the training module, fit on train only).

    Parameters
    ----------
    df : pd.DataFrame
        Must contain FEATURE_NAMES columns and 'label'.
    test_size : float
        Fraction for the test set (default from config).
    random_state : int
        Random seed for reproducibility (default from config).

    Returns
    -------
    (train_df, test_df) : Tuple[pd.DataFrame, pd.DataFrame]
    """
    train_df, test_df = train_test_split(
        df,
        test_size=test_size,
        random_state=random_state,
        stratify=df["label"],
    )

    print(f"\nTrain/test split (seed={random_state}, test_size={test_size}):")
    print(f"  Train: {len(train_df)} samples "
          f"(legit={int((train_df['label']==0).sum())}, "
          f"phish={int((train_df['label']==1).sum())})")
    print(f"  Test:  {len(test_df)} samples "
          f"(legit={int((test_df['label']==0).sum())}, "
          f"phish={int((test_df['label']==1).sum())})")

    return train_df.reset_index(drop=True), test_df.reset_index(drop=True)


# ─── Save / Load Processed Data ──────────────────────────────────


def save_processed(train_df: pd.DataFrame, test_df: pd.DataFrame,
                   output_dir: str = None):
    """Save processed train/test splits as CSV files."""
    if output_dir is None:
        output_dir = PROCESSED_DATA_DIR
    os.makedirs(output_dir, exist_ok=True)

    train_path = os.path.join(output_dir, "train.csv")
    test_path = os.path.join(output_dir, "test.csv")

    train_df.to_csv(train_path, index=False)
    test_df.to_csv(test_path, index=False)

    print(f"\nProcessed data saved:")
    print(f"  Train: {train_path}")
    print(f"  Test:  {test_path}")


def load_processed(data_dir: str = None) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Load previously saved train/test splits."""
    if data_dir is None:
        data_dir = PROCESSED_DATA_DIR

    train_path = os.path.join(data_dir, "train.csv")
    test_path = os.path.join(data_dir, "test.csv")

    if not os.path.exists(train_path) or not os.path.exists(test_path):
        raise FileNotFoundError(
            f"Processed data not found in {data_dir}.\n"
            "Run the preprocessing step first."
        )

    train_df = pd.read_csv(train_path)
    test_df = pd.read_csv(test_path)

    return train_df, test_df


# ─── Full Preprocessing Pipeline ─────────────────────────────────


def run_preprocessing(csv_path: str, output_dir: str = None):
    """
    Run the complete preprocessing pipeline:
      1. Load raw CSV
      2. Extract features for all URLs
      3. Validate features
      4. Stratified train/test split
      5. Save processed splits

    Returns (train_df, test_df).
    """
    print("\n" + "=" * 60)
    print("  PREPROCESSING PIPELINE")
    print("=" * 60)

    # Step 1: Load
    df = load_dataset(csv_path)

    # Step 2: Extract features
    df = extract_all_features(df)

    # Step 3: Validate
    df = validate_features(df)

    # Step 4: Split
    train_df, test_df = split_dataset(df)

    # Step 5: Save
    save_processed(train_df, test_df, output_dir)

    print("\nPreprocessing complete.")
    return train_df, test_df


class DataPreprocessor:
    """
    High-level data preprocessor class for pipeline execution.
    """

    def __init__(self, raw_dir: str = RAW_DATA_DIR, processed_dir: str = PROCESSED_DATA_DIR):
        self.raw_dir = raw_dir
        self.processed_dir = processed_dir

    def prepare_data(self, data_path: Optional[str] = None):
        """
        Loads raw data, extracts features, splits, scales, and returns numpy matrices.
        """
        from sklearn.preprocessing import StandardScaler

        if data_path is None:
            # Check for candidate CSV files in raw_dir
            candidates = [
                os.path.join(self.raw_dir, "sample_urls.csv"),
                os.path.join(self.raw_dir, "phishing_urls.csv"),
                os.path.join(self.raw_dir, "dataset.csv"),
            ]
            for candidate in candidates:
                if os.path.exists(candidate):
                    data_path = candidate
                    break

        if data_path is None or not os.path.exists(data_path):
            raise FileNotFoundError(
                f"No raw dataset CSV found in {self.raw_dir}. Please place your dataset CSV at {self.raw_dir}/sample_urls.csv"
            )

        train_df, test_df = run_preprocessing(data_path, self.processed_dir)

        # Extract numpy feature matrices and target vectors
        X_train = train_df[FEATURE_NAMES].values.astype(np.float64)
        y_train = train_df["label"].values.astype(np.int64)

        X_test = test_df[FEATURE_NAMES].values.astype(np.float64)
        y_test = test_df["label"].values.astype(np.int64)

        # Fit scaler ONLY on train set to prevent data leakage
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        return X_train, X_test, y_train, y_test, X_train_scaled, X_test_scaled, scaler

