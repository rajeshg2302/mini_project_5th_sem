# PhishGuard — Final Academic Screenshot & Visual Artifact Checklist

This checklist enumerates all **18 required visual artifacts** for inclusion in the final college mini-project report, PPT presentation deck, project evaluation binder, and GitHub documentation repository.

> [!IMPORTANT]  
> All screenshots must be captured from the **ACTUAL IMPLEMENTATION** running locally (`http://localhost:5173` frontend and `http://localhost:8000` backend API). Do not fabricate, modify, or mock screenshots.

---

## Required Visual Artifacts List

| # | Artifact Name | Target View / Component | Purpose in Report / PPT | Recommended Caption | Status |
|---|---|---|---|---|---|
| 1 | **Home / Dashboard Overview** | Navbar + Hero Banner + Scanner Layout | Project Introduction & SOC Aesthetics | *Figure 1.1: PhishGuard Security Operations Center Dashboard* | `[ ] Pending Manual Capture` |
| 2 | **URL Input & Validation** | Active Input Box with Sanitization Status | Input Layer Demonstration | *Figure 4.1: URL Scanner Input Interface with Real-time Validation* | `[ ] Pending Manual Capture` |
| 3 | **Legitimate URL Verdict Result** | Scan Verdict Card for `https://google.com` | Safe Verdict UI Showcase | *Figure 7.1: Low-Risk Verdict Output for Legitimate Target URL* | `[ ] Pending Manual Capture` |
| 4 | **Phishing URL Verdict Result** | Scan Verdict Card for Phishing target | Critical Threat Verdict UI Showcase | *Figure 7.2: Critical-Risk Verdict Output for Malicious Phishing Target* | `[ ] Pending Manual Capture` |
| 5 | **Risk Score Gauge** | Radial Risk Score Indicator ($0-100$) | Visual Risk Tier Representation | *Figure 5.1: 5-Tier Dynamic Risk Score Indicator (Critical Tier: 88/100)* | `[ ] Pending Manual Capture` |
| 6 | **Explainable Risk Factors** | Top Risk Reasons Panel | XAI Explainability Showcase | *Figure 5.2: Explainable Feature Contribution & Top Risk Factor Breakdown* | `[ ] Pending Manual Capture` |
| 7 | **Threat Profile Radar** | 5-Dimension Radar Chart (Recharts) | Derived Threat Intelligence UX | *Figure 6.1: Derived 5-Dimension Threat Profile Radar Chart* | `[ ] Pending Manual Capture` |
| 8 | **URL DNA Fingerprint** | URL DNA Feature Matrix Visualization | Structural Feature Representation | *Figure 6.2: Structural URL DNA Fingerprint Analysis Matrix* | `[ ] Pending Manual Capture` |
| 9 | **Security Pipeline Timeline** | Interactive 6-Stage Scan Execution Timeline | Pipeline Sequence Demonstration | *Figure 4.2: Real-time 6-Stage Security Pipeline Timeline Execution* | `[ ] Pending Manual Capture` |
| 10 | **Dynamic Security Recommendations** | Context-Aware Action Card | Actionable Remediation Guidance | *Figure 6.3: Dynamic Risk-Tiered Security Action Recommendations* | `[ ] Pending Manual Capture` |
| 11 | **Security Education Panel** | Interactive Phishing Tactic Learning Hub | Security Awareness Feature | *Figure 6.4: Interactive Phishing Tactics Security Education Panel* | `[ ] Pending Manual Capture` |
| 12 | **Scan History Interface** | Paginated Table with Search & Verdict Filters | SQLite History Management | *Figure 6.5: Historical Scan Log Management Interface with Search Filters* | `[ ] Pending Manual Capture` |
| 13 | **Scan Comparison View** | Side-by-Side Dual URL Comparison (`/compare`) | Differential Threat Analysis | *Figure 6.6: Side-by-Side Dual Scan Structural Feature Comparison Tool* | `[ ] Pending Manual Capture` |
| 14 | **Aggregated Threat Analytics** | Executive Dashboard (Charts & Distribution) | Analytics & Threat Metrics | *Figure 7.3: Aggregated Threat Distribution & Daily Scan Analytics* | `[ ] Pending Manual Capture` |
| 15 | **AI Model Comparison Lab** | Metrics Grid (LR, DT, RF, GB) | Machine Learning Evaluation | *Figure 7.4: Multi-Model Evaluation Metrics & Feature Importance Lab* | `[ ] Pending Manual Capture` |
| 16 | **Enhanced Model Simulator** | Dynamic Weight Adjustment Controls | Interactive ML Hypothesis Testing | *Figure 6.7: Interactive ML Model Ensemble Simulator & Weight Adjuster* | `[ ] Pending Manual Capture` |
| 17 | **About & Architecture Page** | System Overview & Tech Stack Cards | Project Context & Credits | *Figure 1.2: Technical Architecture & System Specifications View* | `[ ] Pending Manual Capture` |
| 18 | **FastAPI Interactive Docs** | Swagger UI (`http://localhost:8000/docs`) | REST API Contract Verification | *Figure 6.8: OpenAPI / Swagger Interactive REST API Reference* | `[ ] Pending Manual Capture` |

---

## Instructions for Capturing Screenshots

1. Launch backend API:
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```
2. Launch frontend server:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open browser at `http://localhost:5173`.
4. Capture high-resolution screenshots for each listed item.
5. Save screenshots in `docs/screenshots/` (e.g., `01_dashboard.png`, `02_scanner_input.png`, ..., `18_swagger_api.png`).
6. Embed images into the final Word report / PPT presentation using the recommended captions provided above.
