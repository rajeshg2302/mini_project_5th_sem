# PhishGuard — Methodology & Implementation Framework

## 1. System Methodology Overview

PhishGuard employs a scientific, modular methodology for detection and explainable evaluation of phishing website addresses. The pipeline is designed around six core phases:

```
[Phase 1: Dataset Quality & Audit]
               ↓
[Phase 2: Local 22-Feature Extraction]
               ↓
[Phase 3: Stratified 5-Fold Cross-Validation]
               ↓
[Phase 4: Weighted Multi-Model Ensemble Inference]
               ↓
[Phase 5: 5-Tier Risk Level & SHAP Matrix Derivation]
               ↓
[Phase 6: Threat Intelligence & SOC Experience Rendering]
```

---

## 2. Dataset Pipeline & Configuration Modes

PhishGuard supports dual dataset execution modes managed via environment configuration:

- **Synthetic Development Mode (`DATASET_MODE=synthetic`):** Uses `data/raw/synthetic/phishing_dataset.csv` (1,200 total samples; 600 legitimate, 600 phishing). Used for reproducible CI testing and architecture validation.
- **Real-World Research Mode (`DATASET_MODE=real_world`):** Allows seamless drop-in placement of external research datasets (e.g. PhishTank live feeds, UNB ISCX URL-2016) at `data/raw/real_world/phishing_dataset.csv`.

---

## 3. Dataset Validation & Quality Control

Before model evaluation, `ml/dataset_validator.py` executes automated quality verification checks:
1. **Null/Missing Value Audit:** Identifies and flags empty cells.
2. **Duplicate URL Detection:** Identifies repeated submissions.
3. **Feature Vector Duplication:** Audits rows with identical 22-feature signatures to inspect potential dataset redundancy.
4. **Scheme & Syntax Inspection:** Validates URL parse structures (`urlparse`).
5. **Class Imbalance Calculation:** Computes $\text{Imbalance Ratio} = \frac{N_{\text{phish}}}{N_{\text{legit}}}$.

---

## 4. 22 Local URL Feature Engineering

Feature extraction executes 100% locally on the raw URL string without opening socket connections. The 22 features span four analytical categories:

- **Structural Metrics:** `url_length`, `domain_length`, `path_length`, `num_dots`, `num_hyphens`, `num_underscores`, `num_slashes`, `num_query_params`, `num_fragments`.
- **Security & Protocol Attributes:** `has_ip_address`, `has_https`, `has_www`, `has_shortener`, `has_suspicious_tld`.
- **Lexical & Statistical Distributions:** `num_digits_in_domain`, `digit_letter_ratio`, `special_char_ratio`, `num_at_symbols`.
- **Information Entropy & Keywords:** `url_entropy`, `path_entropy`, `has_suspicious_keywords`.

---

## 5. Model Ensemble & Cross-Validation

The ML core evaluates four verified scikit-learn algorithms:

1. **Random Forest Classifier** ($w_1 = 0.35$): 100 decision trees (`max_depth=15`).
2. **Gradient Boosting Classifier** ($w_2 = 0.30$): Gradient boosted decision trees (`max_depth=5`, `learning_rate=0.1`).
3. **Logistic Regression** ($w_3 = 0.20$): Linear classifier with L2 regularization (`solver='lbfgs'`).
4. **Decision Tree Classifier** ($w_4 = 0.15$): Single decision tree (`max_depth=10`).

### Data Leakage Prevention:
- **Stratified 80/20 Train-Test Split:** `train_test_split(..., test_size=0.2, random_state=42, stratify=y)`.
- **5-Fold Stratified Cross-Validation:** `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)`.

---

## 6. Risk Scoring & 5-Tier Boundary Mapping

Ensemble probability $P_{\text{phish}}$ is computed as:

$$P_{\text{phish}} = \sum_{i=1}^{4} w_i \cdot p_i \quad \text{where } \sum w_i = 1.0$$

Risk score is scaled and clamped to $[0, 100]$:

$$\text{Risk Score} = \max\left(0, \min\left(100, \text{round}(P_{\text{phish}} \times 100)\right)\right)$$

The risk score maps to a 5-tier threat level:
- `0 – 20`: **`LOW`**
- `21 – 40`: **`GUARDED`**
- `41 – 60`: **`MEDIUM`**
- `61 – 80`: **`HIGH`**
- `81 – 100`: **`CRITICAL`**

---

## 7. Derived Threat Intelligence & Explainability

1. **SHAP-Inspired Feature Matrix:** Identifies individual feature contributions toward the phishing verdict.
2. **Threat Profile Radar:** Derives 5 risk dimensions (*URL Structure*, *Hostname/IP*, *Obfuscation*, *Keywords*, *Security Risk*) directly from extracted feature values.
3. **URL DNA Fingerprint:** Renders a 10-indicator feature intensity matrix comparing raw observed values against baseline thresholds.
4. **Dynamic Recommendations:** Generates targeted actionable security advice based on specific detected traits (e.g. IP hostname, HTTP protocol, keywords).
