# PhishGuard — Final Academic Mini Project Report Outline

**Project Title:** PhishGuard — AI-Based Phishing Website Detection Using Machine Learning  
**Degree / Course:** Bachelor of Technology (B.Tech) — AIML (5th Semester Mini Project)  

---

## Structure & Chapter Breakdown

```
PHISHGUARD FINAL REPORT
│
├── TITLE PAGE & DECLARATION
├── CERTIFICATE OF COMPLETION
├── ACKNOWLEDGEMENTS
├── ABSTRACT
├── TABLE OF CONTENTS
├── LIST OF FIGURES & TABLES
│
├── CHAPTER 1 — INTRODUCTION
│   ├── 1.1 Background & Context
│   ├── 1.2 Problem Statement
│   ├── 1.3 Project Objectives
│   ├── 1.4 Project Scope & Boundaries
│   ├── 1.5 Real-World & Industry Applications
│
├── CHAPTER 2 — LITERATURE SURVEY
│   ├── 2.1 Overview of Phishing Attack Vectors
│   ├── 2.2 Traditional Blacklist & Heuristic Approaches
│   ├── 2.3 URL-Based Lexical & Entropy Machine Learning
│   ├── 2.4 Explainable AI (XAI) in Cybersecurity
│   ├── 2.5 Identified Research Gaps & Proposed Innovation
│
├── CHAPTER 3 — SYSTEM ANALYSIS & FEASIBILITY
│   ├── 3.1 Existing Systems & Limitations
│   ├── 3.2 Proposed PhishGuard System
│   ├── 3.3 Comparative Advantage & Key Novelties
│   ├── 3.4 Feasibility Study (Technical, Operational, Economic)
│
├── CHAPTER 4 — SYSTEM DESIGN & ARCHITECTURE
│   ├── 4.1 High-Level Software Architecture
│   ├── 4.2 Data Flow Diagrams (DFD Level 0 & Level 1)
│   ├── 4.3 Machine Learning Pipeline Architecture
│   ├── 4.4 Phishing Scan Sequence Flowchart
│   ├── 4.5 Entity-Relationship (ER) Database Schema
│   ├── 4.6 UI/UX Design System & Modular Layout
│
├── CHAPTER 5 — METHODOLOGY & ML ENGINEERING
│   ├── 5.1 Dataset Description (Development Dataset N=1,200)
│   ├── 5.2 Data Preprocessing & Sanitization
│   ├── 5.3 22 URL Feature Extraction Mathematics
│   ├── 5.4 Machine Learning Classifiers (LR, DT, RF, GB)
│   ├── 5.5 Model Training & Weighted Ensemble Formulation
│   ├── 5.6 5-Fold Stratified Cross-Validation Strategy
│   ├── 5.7 Risk Score Formulation & 5-Tier Level Mapping
│   ├── 5.8 Threat Profile Radar & Explainable AI (XAI) Engine
│
├── CHAPTER 6 — SYSTEM IMPLEMENTATION
│   ├── 6.1 Backend API Implementation (FastAPI, Python)
│   ├── 6.2 Frontend Interface Implementation (React 18, Vite)
│   ├── 6.3 Machine Learning Persistence & Pipeline (Scikit-Learn)
│   ├── 6.4 Database Integration (SQLite, SQLAlchemy ORM)
│   ├── 6.5 Security Controls (SSRF Protection, Input Sanitization)
│
├── CHAPTER 7 — EXPERIMENTAL RESULTS & EVALUATION
│   ├── 7.1 Experimental Setup & Test Environment
│   ├── 7.2 Holdout Evaluation Results (LR, DT, RF, GB)
│   ├── 7.3 5-Fold Stratified Cross-Validation Performance
│   ├── 7.4 Feature Importance Analysis & Shannon Entropy Impact
│   ├── 7.5 Automated System Testing (38 Unit/Integration Tests)
│   ├── 7.6 Runtime Latency & Build Performance Benchmarks
│   ├── 7.7 Scientific Disclaimer & Dataset Limitation Notice
│
├── CHAPTER 8 — LIMITATIONS & CONSTRAINTS
│   ├── 8.1 Synthetic Dataset Constraints
│   ├── 8.2 Scope Restriction to URL String Features
│   ├── 8.3 Zero External Network API Verification
│
├── CHAPTER 9 — FUTURE RESEARCH SCOPE
│   ├── 9.1 Live Real-World Dataset Integration (PhishTank / OpenPhish)
│   ├── 9.2 HTML/DOM & Computer Vision Multimodal Analysis
│   ├── 9.3 Browser Extension & Enterprise SOC Deployment
│
├── CHAPTER 10 — CONCLUSION
│   ├── 10.1 Summary of Contributions
│   ├── 10.2 Final Academic Assessment
│
└── REFERENCES & APPENDIX
```

---

## Detailed Chapter Descriptions

### Chapter 1: Introduction
- **1.1 Background:** Rapid proliferation of social engineering, brand spoofing, and credential theft via malicious hyperlinks.
- **1.2 Problem Statement:** Web users frequently click malicious links before blacklists update, while deep content inspection is slow and resource-heavy.
- **1.3 Objectives:** Build a zero-latency, local ML-based URL analyzer providing transparent risk scores, multi-model predictions, and actionable security recommendations.
- **1.4 Scope:** Focused on structural, lexical, host, and entropy URL features without outbound network crawling.
- **1.5 Applications:** Security Operations Centers (SOC), email gateway preprocessing, user security awareness training.

### Chapter 2: Literature Survey
- Comparative evaluation of existing literature: Blacklist databases (Google Safe Browsing), DOM content parsing, and URL-based feature engineering.
- Summary table highlighting how PhishGuard addresses the research gap by combining 22 local features, 4 ML algorithms, explainable risk scoring, and threat profile radar visualizations.

### Chapter 3: System Analysis
- **Existing Systems:** Reliance on static blacklists (high latency) or active DOM crawling (privacy and performance risks).
- **Proposed System:** Decoupled FastAPI/React architecture executing 22 local feature calculations in $\sim 12\text{ ms}$.

### Chapter 4: System Design
- Complete UML and Mermaid diagrams: High-level System Architecture, DFD Level 0, DFD Level 1, ML Pipeline, URL Processing Sequence, Database ER Diagram.

### Chapter 5: Methodology
- Mathematical definitions of all 22 features, including Shannon Entropy formula.
- Ensemble formulation:
  $$\text{Probability}_{\text{ensemble}} = 0.35 \cdot P_{\text{RF}} + 0.30 \cdot P_{\text{GB}} + 0.20 \cdot P_{\text{LR}} + 0.15 \cdot P_{\text{DT}}$$
- 5-Tier Risk Boundaries ($0-20$ `LOW`, $21-40$ `GUARDED`, $41-60$ `MEDIUM`, $61-80$ `HIGH`, $81-100$ `CRITICAL`).

### Chapter 6: Implementation
- Detailed breakdown of backend modules (`scanner.py`, `url_validator.py`, `feature_extractor.py`, `ml_predictor.py`, `explainer.py`), frontend views (`ScannerView`, `HistoryView`, `AnalyticsView`, `ModelLabView`), and SQLite ORM models.

### Chapter 7: Results
- Includes official Phase 5 metric tables: Holdout performance and 5-Fold Stratified Cross-Validation F1 scores.
- Mandatory academic disclaimer highlighting that metric scores are evaluated on the synthetic development dataset ($N=1,200$).

### Chapter 8 & 9: Limitations & Future Scope
- Honest academic discussion of URL-only constraints, lack of real-world evaluation, and roadmap for real-world feeds and browser extensions.

### Chapter 10: Conclusion
- Reiteration of project accomplishments, technical verification (38/38 passing tests), and academic readiness.
