# PhishGuard: AI-Based Phishing Website Detection Using Machine Learning

**A Mini Project Report Submitted in Partial Fulfillment of the Requirements for the Degree of**  
**Bachelor of Technology (B.Tech) in Artificial Intelligence and Machine Learning (AIML)**

---

## TITLE PAGE

**PROJECT TITLE:** PhishGuard: AI-Based Phishing Website Detection Using Machine Learning  
**DEPARTMENT:** Department of Computer Science & Engineering (AIML)  
**ACADEMIC YEAR:** 2025–2026 (5th Semester Mini Project)  

---

## CERTIFICATE

This is to certify that the mini-project entitled **"PhishGuard: AI-Based Phishing Website Detection Using Machine Learning"** is a bona fide record of work carried out by the student in partial fulfillment of the requirements for the award of the degree of Bachelor of Technology in Artificial Intelligence and Machine Learning during the 5th semester.

**Project Guide / Supervisor**  
Department of AIML  

**Head of Department (HOD)**  
Department of AIML  

---

## DECLARATION

I hereby declare that the mini-project report entitled **"PhishGuard: AI-Based Phishing Website Detection Using Machine Learning"** submitted to the Department of AIML is an authentic record of my original work. The empirical results presented in this report are based on the actual verified implementation of the PhishGuard software architecture.

Student Signature  
Date: September 11, 2026  

---

## ACKNOWLEDGEMENT

I express my sincere gratitude to our Head of Department and Project Supervisor for their invaluable guidance, encouragement, and technical insights throughout the design, implementation, and evaluation of PhishGuard. I also thank my faculty members and peers for their continuous support.

---

## ABSTRACT

Phishing remains one of the most pervasive cyber threat vectors, exploiting human trust to harvest sensitive credentials and financial data through deceptively engineered hyperlinked URLs. Traditional security mechanisms rely heavily on static blacklists and remote web crawling; however, blacklists exhibit high latency against zero-day phishing campaigns, while active crawling incurs significant privacy risks, network bandwidth overhead, and exposure to client-side cloaking scripts.

This report presents **PhishGuard**, a zero-network, explainable machine learning architecture designed to detect malicious phishing websites exclusively through structural, lexical, host, and Shannon entropy analysis of incoming URL strings. PhishGuard computes a 22-dimensional numerical feature representation per URL in approximately $12\text{ ms}$ without making outbound HTTP connections. Classification is performed using a weighted ensemble of four supervised machine learning models: Logistic Regression, Decision Tree, Random Forest, and Gradient Boosting.

Predictions are mapped to a dynamic $0–100$ Risk Score across five distinct risk tiers (`LOW`, `GUARDED`, `MEDIUM`, `HIGH`, `CRITICAL`) and augmented with Explainable AI (XAI) feature contribution differentials and a derived 5-dimension Threat Profile Radar. The full-stack solution integrates a FastAPI Python backend, an SQLite database for historical scan storage, and a React 18 visual Security Operations Center (SOC) frontend.

Across a balanced synthetic development dataset of 1,200 samples (600 legitimate, 600 phishing), the trained Random Forest and Logistic Regression models achieved $1.000$ accuracy and F1-score on a stratified holdout test split ($N=240$), while Gradient Boosting and Decision Tree achieved $0.850$ accuracy ($0.8605$ F1-score). 5-fold stratified cross-validation yielded mean F1-scores of $1.0000 \pm 0.0000$ for Random Forest and $0.9990 \pm 0.0021$ for Gradient Boosting. System reliability was validated through 38 automated unit/integration tests and production build verification.

*Academic Disclaimer:* The reported performance metrics reflect evaluation strictly on the synthetic development dataset ($N=1,200$) and must not be interpreted as real-world phishing detection accuracy.

---

## TABLE OF CONTENTS

- Certificate & Declaration
- Acknowledgement & Abstract
- Chapter 1: Introduction
- Chapter 2: Literature Survey
- Chapter 3: Existing and Proposed System
- Chapter 4: System Design & Architecture
- Chapter 5: Methodology & Feature Engineering
- Chapter 6: System Implementation
- Chapter 7: Results and Testing
- Chapter 8: System Limitations
- Chapter 9: Future Research Scope
- Chapter 10: Conclusion
- References

---

## LIST OF FIGURES

1. Figure 4.1: PhishGuard High-Level Architecture
2. Figure 4.2: Data Flow Diagram — Level 0 (Context Diagram)
3. Figure 4.3: Data Flow Diagram — Level 1 (Process Breakdown)
4. Figure 4.4: Machine Learning Pipeline Flowchart
5. Figure 4.5: URL Processing Sequence Diagram
6. Figure 4.6: Database Entity-Relationship (ER) Diagram
7. Figure 6.1: Security Operations Center Visual Dashboard
8. Figure 7.1: Multi-Model Evaluation & Feature Importance Comparison

---

## LIST OF TABLES

1. Table 5.1: 22 URL Feature Inventory & Mathematical Specifications
2. Table 5.2: 5-Tier Risk Level Classification Boundaries
3. Table 6.1: PhishGuard Technology Stack Specifications
4. Table 7.1: Holdout Evaluation Metrics Across 4 Machine Learning Models
5. Table 7.2: 5-Fold Stratified Cross-Validation F1-Score Summary
6. Table 7.3: System Execution & Response Time Latency Benchmarks

---

## CHAPTER 1 — INTRODUCTION

### 1.1 Background
The rapid expansion of web-based digital services has led to a surge in social engineering attacks. Phishing links distribute malicious payloads and clone legitimate authentication portals. Because domain registration can be automated rapidly, attackers generate thousands of short-lived malicious URLs daily.

### 1.2 Problem Statement
Traditional detection methods suffer from major limitations:
1. Static blacklists fail against zero-day phishing URLs before manual verification.
2. Web crawling parsing engines incur high latency, bandwidth consumption, and client-side cloaking vulnerabilities.
3. Conventional machine learning classifiers lack transparent explainability, returning opaque probabilities without context.

### 1.3 Objectives
- Design a zero-network URL feature extraction engine computing 22 lexical, host, and entropy metrics locally.
- Implement a weighted ensemble combining Logistic Regression, Decision Tree, Random Forest, and Gradient Boosting.
- Develop a transparent Risk Scoring algorithm ($0-100$) mapped into 5 risk tiers.
- Provide Explainable AI (XAI) feature contribution differentials and derived 5-dimension Threat Profile Radar visualizations.
- Deliver an interactive React 18 visual dashboard backed by FastAPI and SQLite.

### 1.4 Scope
PhishGuard processes incoming target URL strings locally. It does not perform HTTP web crawling, DOM parsing, SSL certificate chain inspection, or remote DNS lookups.

### 1.5 Applications
- **SOC Triage:** Pre-screening suspicious hyperlinks submitted by organization employees.
- **Email Gateway Integration:** Fast string preprocessing prior to network sandbox detonation.
- **User Education:** Interactive security awareness training platforms.

### 1.6 Motivation
Building a lightweight, privacy-preserving, zero-latency detection engine demonstrates how machine learning and lexical feature engineering can mitigate social engineering attacks without compromising user privacy.

---

## CHAPTER 2 — LITERATURE SURVEY

### 2.1 Introduction to Phishing Detection
Phishing URL detection has evolved from rule-based regex matching to statistical feature extraction and machine learning.

### 2.2 URL-Based Phishing Detection
Research by Ma et al. (2009) established that lexical features (URL length, token counts, character distributions) and host properties contain strong predictive signals for distinguishing malicious sites without inspecting page content.

### 2.3 Machine Learning for Phishing Detection
Supervised classification algorithms (Decision Trees, Random Forests, Gradient Boosted Trees) excel at tabular feature classification. Random Forests demonstrate high resilience against noisy decision boundaries due to bootstrap aggregation.

### 2.4 Explainable Security Systems
Modern cybersecurity operations require explainability (XAI). Security analysts require human-readable rationales (e.g., "Contains suspicious financial keyword", "Excessive subdomain depth") to make informed triage decisions.

### 2.5 Existing Approaches
- **Blacklists (Google Safe Browsing):** High precision, poor recall on new domains.
- **DOM/Heuristic Crawlers:** Accurate, but slow ($\sim 2-5\text{ s}$) and susceptible to server-side cloaking.

### 2.6 Research Gap
Existing solutions rarely combine zero-network local feature extraction, multi-model ensemble evaluation, dynamic risk tiering ($0-100$), and visual threat profiling in an integrated SOC dashboard.

### 2.7 Summary
PhishGuard addresses this gap by executing local 22-feature string extraction and multi-model classification within $\sim 12\text{ ms}$, presenting results through an explainable visual interface.

---

## CHAPTER 3 — EXISTING AND PROPOSED SYSTEM

### 3.1 Existing System
Existing security solutions rely heavily on centralized cloud lookup services or active browser extensions that render remote DOM elements.

### 3.2 Limitations of Existing System
- High network latency during remote page rendering.
- Privacy risks associated with sending browsing histories to third-party APIs.
- Inability to catch zero-day phishing URLs created seconds before submission.

### 3.3 Proposed System
PhishGuard receives a target URL, sanitizes the input, extracts 22 structural features locally, computes ensemble ML predictions, maps probability to a $0-100$ Risk Score, generates top risk factors, and displays derived threat visualizations.

### 3.4 Advantages of Proposed System
- **Zero Network Overhead:** Operates 100% locally on string input.
- **Sub-50ms Latency:** Total API turn-around in $\sim 35\text{ ms}$.
- **Multi-Model Consensus:** Combines 4 ML algorithms.
- **Transparent XAI:** Clear reason strings and risk tiering.

### 3.5 Functional Requirements
- URL validation and SSRF protection.
- 22 local feature calculations.
- Multi-model ML inference.
- SQLite scan history persistence and paginated search.
- Dual scan comparison (`/compare`) and interactive model simulation.

### 3.6 Non-Functional Requirements
- **Performance:** Feature extraction + inference under $20\text{ ms}$.
- **Security:** Strict rejection of private IP ranges and dangerous pseudo-schemes.
- **Reliability:** 100% test pass rate across unit and integration suites.

---

## CHAPTER 4 — SYSTEM DESIGN

### 4.1 Overall Architecture
PhishGuard adopts a decoupled architecture: React 18 SPA frontend, FastAPI Python backend, Scikit-learn ML pipeline, and SQLite database.

```
[ User Browser ] ──(HTTP JSON)──► [ FastAPI Backend ]
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
   [ URL Validator ]         [ 22-Feature Extractor ]    [ ML Predictor ]
   (SSRF Safety)             (Lexical/Entropy)           (LR, DT, RF, GB)
                                                                  │
            ┌─────────────────────────────────────────────────────┘
            ▼
   [ XAI Explainer & DB ] ──► [ React Visual Dashboard ]
```

### 4.2 System Components
- **Scanner Service (`scanner.py`):** Coordinates pipeline execution.
- **URL Validator (`url_validator.py`):** Enforces scheme, length, and IP safety.
- **Feature Extractor (`feature_extractor.py`):** Computes 22 numerical/binary features.
- **ML Predictor (`ml_predictor.py`):** Loads joblib artifacts and executes weighted ensemble scoring.
- **Explainer (`explainer.py`):** Generates XAI explanations.

### 4.3 Data Flow Diagrams
- **DFD Level 0:** User inputs URL -> PhishGuard System -> Returns Risk Report & Verdict.
- **DFD Level 1:** URL -> Validation -> Feature Extraction -> ML Scoring -> XAI Engine -> SQLite Persistence -> UI Display.

### 4.4 Machine Learning Pipeline
1. Dataset Loading ($N=1,200$) -> 2. Feature Extraction -> 3. `StandardScaler` Normalization -> 4. Stratified 80/20 Train/Test Split -> 5. 5-Fold Stratified Cross-Validation -> 6. Artifact Serialization (`joblib`).

### 4.5 Database Design
Stored in SQLite via SQLAlchemy ORM (`scans` table): `id`, `url`, `risk_score`, `verdict`, `confidence`, `features_json`, `model_predictions_json`, `shap_explanations_json`, `top_reasons_json`, `created_at`.

---

## CHAPTER 5 — METHODOLOGY

### 5.1 Dataset
Evaluated on a balanced synthetic development dataset of 1,200 samples (600 legitimate URLs, 600 phishing URLs).

### 5.2 22 URL Features & Mathematical Specifications

1. `url_length` (Int): Character count of full URL.
2. `domain_length` (Int): Hostname character count.
3. `path_length` (Int): Path string character count.
4. `num_dots` (Int): Count of `.` characters.
5. `num_hyphens` (Int): Count of `-` characters.
6. `num_underscores` (Int): Count of `_` characters.
7. `num_slashes` (Int): Count of `/` characters.
8. `num_query_params` (Int): Count of query parameters (`&`/`=`).
9. `num_fragments` (Int): Fragment presence (`#`).
10. `num_at_symbols` (Binary): `@` character presence.
11. `has_ip_address` (Binary): IPv4 string pattern detection.
12. `has_https` (Binary): HTTPS scheme presence.
13. `has_www` (Binary): `www` prefix presence.
14. `num_digits_in_domain` (Int): Digit count in hostname.
15. `digit_letter_ratio` (Float): Digit to character ratio.
16. `url_entropy` (Float): Shannon entropy of full URL:
    $$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
17. `has_suspicious_tld` (Binary): Match against high-risk TLD list (`.xyz`, `.top`, `.club`, etc.).
18. `num_subdomains` (Int): Subdomain count.
19. `has_shortener` (Binary): Match against URL shortener list (`bit.ly`, `tinyurl.com`, etc.).
20. `special_char_ratio` (Float): Ratio of non-alphanumeric characters.
21. `path_entropy` (Float): Shannon entropy of path segment.
22. `has_suspicious_keywords` (Binary): Match against credential harvesting keywords (`login`, `verify`, `paypal`, `secure`, etc.).

### 5.3 Machine Learning Algorithms & Weighted Ensemble
- **Random Forest (Weight 0.35):** Bagging ensemble of 100 decision trees.
- **Gradient Boosting (Weight 0.30):** Sequential boosted tree model.
- **Logistic Regression (Weight 0.20):** L2-regularized linear model with `StandardScaler`.
- **Decision Tree (Weight 0.15):** Gini impurity split tree.

$$\text{Probability}_{\text{ensemble}} = 0.35 \cdot P_{\text{RF}} + 0.30 \cdot P_{\text{GB}} + 0.20 \cdot P_{\text{LR}} + 0.15 \cdot P_{\text{DT}}$$

### 5.4 Risk Scoring & 5-Tier Boundary Levels
The ensemble probability ($0.0-1.0$) is multiplied by 100 and adjusted via heuristic risk offsets, clamped between $0$ and $100$:

- **0–20:** `LOW`
- **21–40:** `GUARDED`
- **41–60:** `MEDIUM`
- **61–80:** `HIGH`
- **81–100:** `CRITICAL`

---

## CHAPTER 6 — SYSTEM IMPLEMENTATION

### 6.1 Technology Stack
- **Frontend:** React 18, Vite, Recharts, Lucide React, Vanilla CSS.
- **Backend:** Python 3.10+, FastAPI, Uvicorn, Pydantic.
- **ML Framework:** Scikit-learn, Pandas, NumPy, Joblib.
- **Database:** SQLite3, SQLAlchemy ORM.

### 6.2 Security Implementation
- **SSRF Prevention:** Rejects `localhost`, `127.0.0.1`, private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and non-HTTP schemes.
- **Input Boundaries:** 2,048 character maximum length limit and control character sanitization.
- **SQL Injection Safety:** Parameterized ORM operations via SQLAlchemy.

---

## CHAPTER 7 — RESULTS AND TESTING

### 7.1 Holdout Evaluation Results (Phase 5 Verification)

| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
|---|---|---|---|---|---|
| **Logistic Regression** | `1.0000` | `1.0000` | `1.0000` | `1.0000` | `1.0000` |
| **Random Forest** | `1.0000` | `1.0000` | `1.0000` | `1.0000` | `1.0000` |
| **Gradient Boosting** | `0.8500` | `0.8043` | `0.9250` | `0.8605` | `0.8868` |
| **Decision Tree** | `0.8500` | `0.8043` | `0.9250` | `0.8605` | `0.8500` |

### 7.2 5-Fold Stratified Cross-Validation Results

| Model | Mean F1-Score | Std Dev |
|---|---|---|
| **Logistic Regression** | `1.0000` | `± 0.0000` |
| **Random Forest** | `1.0000` | `± 0.0000` |
| **Gradient Boosting** | `0.9990` | `± 0.0021` |
| **Decision Tree** | `0.9979` | `± 0.0026` |

*Academic Disclaimer:* These results were obtained using the synthetic development dataset ($N=1,200$) and should not be interpreted as real-world phishing detection accuracy.

### 7.3 System Testing Verification
- **Backend Automated Tests:** 38/38 unit and integration tests passing (`python -m unittest discover -s tests`).
- **Frontend Production Build:** Successful Vite compilation in `7.14s`.
- **Runtime Latency:** Feature extraction + inference: $\sim 12\text{ ms}$; Total API latency: $\sim 35\text{ ms}$.

---

## CHAPTER 8 — LIMITATIONS

1. **Synthetic Dataset Constraints:** Evaluated on synthetic development samples ($N=1,200$).
2. **URL-Only Scope:** Does not inspect rendered DOM HTML, active JavaScript, or SSL certificate chains.
3. **Sophisticated Brand Spoofing:** Adversarial phishing URLs utilizing low-entropy clean domain names may escape URL-only lexical flags.

---

## CHAPTER 9 — FUTURE RESEARCH SCOPE

1. **Real-World Feed Ingestion:** Active integration with live PhishTank and OpenPhish threat intelligence APIs.
2. **Multimodal Deep Learning:** Combining URL lexical features with webpage screenshot Computer Vision models (CNNs).
3. **Browser Extension Deployment:** Packaging the engine as a Manifest V3 browser extension for proactive client-side protection.

---

## CHAPTER 10 — CONCLUSION

PhishGuard demonstrates that a zero-network, local machine learning architecture utilizing 22 lexical, host, and Shannon entropy features can deliver sub-50ms phishing threat classification. By combining multi-model ensemble consensus with transparent Risk Scoring ($0-100$), XAI reason strings, and interactive threat visualizations, PhishGuard bridges the gap between machine learning research and usable cybersecurity threat analysis.

---

## REFERENCES

1. Ma, J., Saul, L. K., Savage, S., & Voelker, G. M. (2009). *Beyond Blacklists: Learning to Detect Malicious Web Sites from Suspect URLs*. Proceedings of the 15th ACM SIGKDD International Conference on Knowledge Discovery and Data Mining (KDD '09), 1245–1254.
2. Sahingoz, O. K., Buber, E., Demir, O., & Diri, B. (2019). *Machine learning based phishing detection from URLs*. Expert Systems with Applications, 117, 345–357.
3. Chiew, K. L., Tan, C. L., Wong, K., Yong, K. S., & Tiong, W. K. (2019). *A new hybrid ensemble feature selection framework for machine learning-based phishing website detection*. Information Sciences, 484, 153–166.
4. Scikit-learn Documentation: *Supervised Learning & Ensemble Methods*. https://scikit-learn.org/stable/
5. FastAPI Documentation: *Modern Python Web Framework*. https://fastapi.tiangolo.com/
