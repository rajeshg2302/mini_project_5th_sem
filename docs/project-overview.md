# PhishGuard — Project Overview

## 1. Project Title
**PhishGuard: AI-Based Phishing Website Detection Using Machine Learning & Explainable Threat Intelligence**

## 2. Abstract
Phishing attacks remain one of the primary vectors for cyber attacks, credential harvesting, and identity theft across global computer networks. Traditional signature-based detection mechanisms (such as domain blocklists) often fail against newly registered, zero-day, or obfuscated phishing domains. This project presents **PhishGuard**, a full-stack, machine learning-driven web platform for real-time phishing URL detection and explainable cyber threat analysis. PhishGuard extracts 22 structural, lexical, and protocol features from target URLs locally without opening outbound network connections, preventing Server-Side Request Forgery (SSRF) vulnerabilities. An ensemble of four verified machine learning algorithms—Random Forest, Gradient Boosting, Logistic Regression, and Decision Trees—evaluates the URL and assigns a 0–100 risk score across five risk tiers (`LOW`, `GUARDED`, `MEDIUM`, `HIGH`, `CRITICAL`). Predictions are enriched with SHAP-inspired feature impact explanations, Threat Profile radar metrics, URL DNA fingerprints, dynamic recommendations, and an educational analysis timeline.

## 3. Introduction
Phishing relies on social engineering to trick internet users into revealing sensitive credentials, financial data, or personal identification. As attackers deploy automated kits to create convincing domain lookalikes, static blocklists lag behind. PhishGuard addresses this gap by utilizing client-server machine learning that operates entirely on URL syntax and character distributions, providing instantaneous protection without relying on third-party domain reputation services or visual webpage rendering.

## 4. Problem Statement
Existing web safety solutions present significant operational challenges:
- **Blocklist Latency:** Blocklists require hours or days to identify and publish newly registered malicious domains.
- **Privacy & Security Risks:** Scanning platforms that download remote webpage contents expose systems to SSRF, drive-by downloads, and tracking.
- **Lack of Explainability:** Commercial anti-phishing tools output opaque binary scores without explaining why a website address is flagged.

## 5. Objectives
1. **Local Feature Extraction:** Extract 22 canonical features purely from raw URL strings with 0 external network requests.
2. **Multi-Model ML Ensemble:** Implement and evaluate Logistic Regression, Decision Trees, Random Forests, and Gradient Boosting.
3. **5-Tier Risk Classification:** Map weighted ensemble probabilities to clamped risk scores (0–100) and five risk boundaries (`LOW`, `GUARDED`, `MEDIUM`, `HIGH`, `CRITICAL`).
4. **Explainable AI (XAI):** Provide human-readable SHAP-inspired feature impact statements for every prediction.
5. **Interactive Threat Intelligence UX:** Render 5-dimension Threat Profile Radars, URL DNA Fingerprints, Security Pipeline Timelines, and Scan Comparisons.
6. **Academic Rigor & Security:** Prevent data leakage using 5-fold Stratified Cross-Validation, enforce SSRF protection, and achieve 100% pass rates on automated test suites.

## 6. Scope
- **Included:** URL-string lexical analysis, machine learning ensemble classification, explainable feature importance, persistent SQLite history, dynamic recommendations, threat profile radar, scan comparison, model simulation, and REST API endpoints.
- **Excluded:** Remote webpage HTML/DOM scraping, visual computer vision screenshot analysis, WHOIS domain registration queries, commercial threat API fetching, and offensive penetration testing tools.

## 7. Applications
- **Cybersecurity Operations Centers (SOC):** Rapid triage of suspicious link submissions.
- **User Education & Awareness Training:** Interactive demonstration of phishing domain techniques (subdomain stuffing, IP hostnames, typosquatting).
- **Academic Research:** Baseline platform for evaluating lexical URL classification algorithms and feature parity.

## 8. Proposed System Architecture
PhishGuard consists of a React 18 single-page application communicating via REST API with a Python FastAPI backend server. Scans pass through URL validation, 22-feature extraction, ML ensemble evaluation, SHAP-inspired explainer matrix derivation, and persistent storage in SQLite.

## 9. Key Features
- 🔍 **Smart 22-Feature Extractor:** Local string processing with zero network latency.
- 🤖 **Verified Ensemble Model Engine:** Random Forest, Gradient Boosting, Logistic Regression, Decision Tree.
- 🎯 **5-Tier Risk Level Classification:** `LOW` (0–20), `GUARDED` (21–40), `MEDIUM` (41–60), `HIGH` (61–80), `CRITICAL` (81–100).
- 🧠 **Explainable AI (XAI):** Feature-based impact explanations.
- 📊 **Threat Profile Radar & URL DNA:** 5-dimension risk radar overlay and normalized feature intensity fingerprint.
- ⏱️ **Pipeline Execution Timeline:** Transparent visual tracking of processing stages.
- ⚖️ **Side-by-Side Scan Comparison:** Detailed matrix comparison between two historical scans.
- ⚡ **Model Simulator:** Safe feature modifier testing without mutating database records.

## 10. Technology Stack
- **Frontend:** React 18, Vite, Recharts, Framer Motion, Axios, CSS3.
- **Backend:** Python 3.10+, FastAPI, Uvicorn, SQLAlchemy ORM, SQLite.
- **Machine Learning:** scikit-learn, joblib, pandas, numpy.

## 11. Actual Outcomes
- **Test Suite:** 38/38 automated unit & integration tests passing (100%).
- **Build Status:** Clean production Vite bundle (`dist/`) generated in 8.35s.
- **Inference Speed:** ~12 ms feature extraction & model prediction time per URL.
- **Academic Transparency:** Explicit scientific disclaimers distinguishing synthetic development dataset benchmarks from real-world accuracy guarantees.
