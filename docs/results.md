# PhishGuard — Experimental Results & Model Evaluation Benchmark

> [!WARNING]
> **IMPORTANT ACADEMIC DISCLAIMER:**
> The experimental results documented below are evaluated exclusively on the project's **synthetic development dataset** ($N=1,200$). High metric values (including 1.0000 F1 scores) reflect model convergence against synthetic lexical patterns and **MUST NOT** be interpreted as real-world phishing detection accuracy. Real-world dataset configuration support is implemented via `DATASET_MODE=real_world`, but an empirical real-world dataset evaluation was not performed in this implementation.

---

## 1. Experimental Setup

- **Development Dataset Mode:** `synthetic` (`data/raw/synthetic/phishing_dataset.csv`)
- **Total Samples:** 1,200 URLs (600 Legitimate, 600 Phishing)
- **Split Ratio:** 80% Train ($N=960$), 20% Holdout Test ($N=240$)
- **Split Strategy:** Stratified splitting (`stratify=y`, `random_state=42`)
- **Cross-Validation:** 5-Fold Stratified Cross-Validation (`StratifiedKFold(n_splits=5, shuffle=True, random_state=42)`)

---

## 2. Holdout Test Set Evaluation Results

| Model | Accuracy | Precision | Recall | F1-Score | AUC-ROC | Confusion Matrix [TN, FP, FN, TP] |
|---|---|---|---|---|---|---|
| **Logistic Regression** | `1.0000` | `1.0000` | `1.0000` | `1.0000` | `1.0000` | `[[120, 0], [0, 120]]` |
| **Random Forest** | `1.0000` | `1.0000` | `1.0000` | `1.0000` | `1.0000` | `[[120, 0], [0, 120]]` |
| **Gradient Boosting** | `0.8500` | `0.8043` | `0.9250` | `0.8605` | `0.8868` | `[[93, 27], [9, 111]]` |
| **Decision Tree** | `0.8500` | `0.8043` | `0.9250` | `0.8605` | `0.8500` | `[[93, 27], [9, 111]]` |

---

## 3. 5-Fold Stratified Cross-Validation Benchmark

| Model | CV Accuracy Mean | CV Accuracy Std | CV Precision Mean | CV Recall Mean | CV F1 Mean |
|---|---|---|---|---|---|
| **Logistic Regression** | `1.0000` | `0.0000` | `1.0000` | `1.0000` | `1.0000 ± 0.0000` |
| **Random Forest** | `1.0000` | `0.0000` | `1.0000` | `1.0000` | `1.0000 ± 0.0000` |
| **Gradient Boosting** | `0.9990` | `0.0021` | `1.0000` | `0.9979` | `0.9990 ± 0.0021` |
| **Decision Tree** | `0.9979` | `0.0026` | `0.9979` | `0.9979` | `0.9979 ± 0.0026` |

---

## 4. Model Selection Rationale

Logistic Regression and Random Forest achieved top holdout and cross-validation scores on the synthetic dataset. `logistic_regression` is registered as the default `best_model_name` for labeling in `models/metadata.json`. Inference predictions utilize the full weighted ensemble ($0.35$ Random Forest, $0.30$ Gradient Boosting, $0.20$ Logistic Regression, $0.15$ Decision Tree).
