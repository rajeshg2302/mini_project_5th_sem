# PhishGuard X — AI Threat Investigation Engine Documentation

## Executive Overview
PhishGuard X Phase 10 transforms PhishGuard from a basic URL classifier into a full-scale **AI-Powered Phishing Investigation and Threat-Analysis Platform**.

Built on top of the verified 22-feature Machine Learning ensemble, the Threat Investigation Engine provides SOC analysts with end-to-end evidence transparency, structured indicator matrixes, analytical threat scorecards, and persistent case management.

---

## Architectural Components

```
USER / ANALYST
      ↓
URL INTELLIGENCE SCANNER
      ↓
ANALYSIS ENGINE (22 Features, ML Ensemble, Risk Score)
      ↓
THREAT INVESTIGATION ENGINE
      ├── Evidence Chain (9-Stage Decision Pipeline)
      ├── Threat Severity Matrix (Indicator Table & Evidence)
      ├── Security Scorecard (5 Dimension Breakdown)
      ├── AI Security Assessment & Analyst Conclusion
      └── Model Decision Center (Per-Model Probabilities & Consensus)
      ↓
CASE MANAGEMENT & REPORT GENERATOR (SQLAlchemy DB, ReportLab PDF)
```

### Key Principles
1. **Zero Fabricated Probabilities**: Model confidence and per-model probabilities mirror exact scikit-learn model evaluation metrics.
2. **Offline-Capable Privacy**: No external threat intelligence services or LLM APIs are invoked. All assessments are deterministically derived from extracted URL features.
3. **Forensic Integrity**: Case deletion removes only the investigation record, leaving original scan history intact in SQLite database.
