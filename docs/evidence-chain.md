# PhishGuard X — Evidence Chain Documentation

## Overview
The Evidence Chain provides full decision transparency by breaking down the automated ML classification pipeline into 9 traceable, expandable stages:

1. **URL RECEIVED**: Raw target URL ingestion and intake timestamping.
2. **URL VALIDATED**: RFC protocol validation, scheme check, and domain formatting verification.
3. **22 FEATURES EXTRACTED**: Computation of 22 lexical, structural, and security features.
4. **ML MODEL EVALUATED**: Evaluation across trained models (`Logistic Regression`, `Decision Tree`, `Random Forest`, `Gradient Boosting`).
5. **PROBABILITY CALCULATED**: Calculation of ensemble probability and model confidence.
6. **RISK SCORE GENERATED**: Risk score mapping (0 - 100) and severity level assignment.
7. **RISK FACTORS IDENTIFIED**: Extraction of key observed features influencing classification.
8. **THREAT PROFILE GENERATED**: Computation of 5 threat dimensions (`Structure`, `Hostname`, `Obfuscation`, `Keywords`, `Security`).
9. **FINAL ASSESSMENT**: Synthesis of overall threat verdict and analyst guidelines.
