"""
PhishGuard ML Pipeline — Configuration

Central configuration for the ML pipeline.
All paths, hyperparameters, and feature definitions in one place.
"""

import os

# ─── Paths ────────────────────────────────────────────────────────

# Project root (phishguard/)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Data directories
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
RAW_DATA_DIR = os.path.join(DATA_DIR, "raw")
SYNTHETIC_DATA_DIR = os.path.join(RAW_DATA_DIR, "synthetic")
REAL_WORLD_DATA_DIR = os.path.join(RAW_DATA_DIR, "real_world")
PROCESSED_DATA_DIR = os.path.join(DATA_DIR, "processed")

# Dataset Resolution Mode: "synthetic" or "real_world"
DATASET_MODE = os.getenv("DATASET_MODE", "synthetic").lower()

SYNTHETIC_DATASET_PATH = os.path.join(SYNTHETIC_DATA_DIR, "phishing_dataset.csv")
REAL_WORLD_DATASET_PATH = os.path.join(REAL_WORLD_DATA_DIR, "phishing_dataset.csv")

if DATASET_MODE == "real_world" and os.path.exists(REAL_WORLD_DATASET_PATH):
    DATASET_PATH = REAL_WORLD_DATASET_PATH
    ACTIVE_DATASET_MODE = "real_world"
elif os.path.exists(SYNTHETIC_DATASET_PATH):
    DATASET_PATH = SYNTHETIC_DATASET_PATH
    ACTIVE_DATASET_MODE = "synthetic"
else:
    DATASET_PATH = os.path.join(PROJECT_ROOT, "ml", "data", "phishing_dataset.csv")
    ACTIVE_DATASET_MODE = "synthetic"

# Model output directory
MODELS_DIR = os.path.join(PROJECT_ROOT, "models")

# Results directory (evaluation metrics, reports)
RESULTS_DIR = os.path.join(PROJECT_ROOT, "ml", "results")

# ─── Reproducibility ─────────────────────────────────────────────

RANDOM_SEED = 42
TEST_SIZE = 0.20  # 80/20 train-test split

# ─── Feature Definition ──────────────────────────────────────────
# This list defines the exact order and names of features used during
# training and inference. Any change here requires retraining.

FEATURE_NAMES = [
    "url_length",
    "domain_length",
    "path_length",
    "num_dots",
    "num_hyphens",
    "num_underscores",
    "num_slashes",
    "num_query_params",
    "num_fragments",
    "num_at_symbols",
    "has_ip_address",
    "has_https",
    "has_www",
    "num_digits_in_domain",
    "digit_letter_ratio",
    "url_entropy",
    "has_suspicious_tld",
    "num_subdomains",
    "has_shortener",
    "special_char_ratio",
    "path_entropy",
    "has_suspicious_keywords",
]

NUM_FEATURES = len(FEATURE_NAMES)

# ─── Label Mapping ───────────────────────────────────────────────
# Maps various raw label strings to binary labels.
# 0 = legitimate, 1 = phishing

LABEL_MAP_LEGITIMATE = {"legitimate", "benign", "good", "safe", "0", 0}
LABEL_MAP_PHISHING = {"phishing", "malicious", "bad", "1", 1}

# ─── Suspicious Keywords ─────────────────────────────────────────
# Keywords commonly found in phishing URLs.

SUSPICIOUS_KEYWORDS = [
    "login", "signin", "sign-in", "verify", "verification",
    "secure", "account", "update", "bank", "confirm",
    "password", "credential", "suspend", "restrict", "unlock",
    "validate", "wallet", "billing", "invoice", "payment",
    "transfer", "alert", "urgent", "expire", "reactivate",
    "recover", "reset", "authenticate",
]

# ─── Known URL Shorteners ────────────────────────────────────────

URL_SHORTENERS = {
    "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly",
    "is.gd", "buff.ly", "adf.ly", "bit.do", "cutt.ly",
    "rb.gy", "shorturl.at", "v.gd", "tiny.cc", "bl.ink",
    "shorte.st", "x.co", "qr.ae", "lnkd.in",
}

# ─── Model Hyperparameters ───────────────────────────────────────
# Reasonable defaults for a student mini project.
# Not over-optimized — prioritizes clarity and reproducibility.

MODEL_PARAMS = {
    "logistic_regression": {
        "max_iter": 1000,
        "random_state": RANDOM_SEED,
        "C": 1.0,
        "solver": "lbfgs",
    },
    "decision_tree": {
        "max_depth": 10,
        "min_samples_split": 5,
        "min_samples_leaf": 2,
        "random_state": RANDOM_SEED,
    },
    "random_forest": {
        "n_estimators": 100,
        "max_depth": 15,
        "min_samples_split": 5,
        "min_samples_leaf": 2,
        "random_state": RANDOM_SEED,
        "n_jobs": -1,
    },
    "gradient_boosting": {
        "n_estimators": 100,
        "max_depth": 5,
        "learning_rate": 0.1,
        "min_samples_split": 5,
        "min_samples_leaf": 2,
        "random_state": RANDOM_SEED,
    },
}

# ─── Evaluation ──────────────────────────────────────────────────

# Primary metric for selecting the best model.
PRIMARY_METRIC = "f1_score"
