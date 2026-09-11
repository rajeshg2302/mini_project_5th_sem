# PhishGuard — Final Project Screenshot & Visual Artifact Guide

This document provides a comprehensive guide for capturing and embedding all **17 required visual artifacts** from the live PhishGuard application into the final academic report and presentation slides.

---

## Screenshot Specifications Table

| # | View / Page | What Should Be Visible | Recommended Report Chapter | Academic Purpose |
|---|---|---|---|---|
| 1 | **Dashboard (`/`)** | Hero banner, quick scanner input, top metrics summary, SOC layout | Chapter 1 (Introduction) | Showcases overall SOC user interface aesthetics and system branding. |
| 2 | **Scanner Input (`/scan`)** | Active URL input field with URL validation status and action button | Chapter 4 (System Design) | Demonstrates input sanitization and scanner user interaction layer. |
| 3 | **Legitimate Scan Result (`/scan`)** | Scan verdict card showing `Safe` verdict for `https://google.com` | Chapter 7 (Results) | Illustrates low-risk output display for verified legitimate target URL. |
| 4 | **Phishing Scan Result (`/scan`)** | Scan verdict card showing `Phishing` verdict for malicious URL | Chapter 7 (Results) | Illustrates high-risk critical verdict output for malicious target URL. |
| 5 | **Risk Score Indicator (`/scan`)** | Dynamic Radial Risk Gauge displaying score ($0-100$) & 5-tier level | Chapter 5 (Methodology) | Highlights 5-tier risk score visualization (`LOW`, `GUARDED`, `MEDIUM`, `HIGH`, `CRITICAL`). |
| 6 | **Explainable Risk Factors (`/scan`)** | Plain-language risk reasons and feature contribution score deltas | Chapter 5 (Methodology) | Demonstrates Explainable AI (XAI) transparent rationale generation. |
| 7 | **Threat Profile Radar (`/scan`)** | Recharts 5-Dimension Radar Chart (Structure, Host, Obfuscation, Keywords, Indicators) | Chapter 6 (Implementation) | Visualizes derived threat intelligence profile dimensions. |
| 8 | **URL DNA Fingerprint (`/scan`)** | Feature matrix grid displaying structural URL characteristics | Chapter 6 (Implementation) | Shows structural feature representation and entropy breakdown. |
| 9 | **Dynamic Recommendations (`/scan`)** | Context-aware security mitigation action cards based on risk tier | Chapter 6 (Implementation) | Demonstrates automated threat remediation guidance for analysts. |
| 10 | **Security Pipeline Timeline (`/scan`)** | Interactive 6-stage scan execution pipeline timeline component | Chapter 4 (System Design) | Visualizes execution flow from validation to storage. |
| 11 | **Security Education Panel (`/scan`)** | Interactive learning cards explaining phishing tactics and social engineering | Chapter 6 (Implementation) | Highlights integrated security awareness training features. |
| 12 | **Scan History (`/history`)** | Paginated database table with search bar and verdict filter dropdowns | Chapter 6 (Implementation) | Demonstrates SQLite persistence, search, filtering, and record lookup. |
| 13 | **Aggregated Analytics (`/analytics`)** | Executive dashboard with risk score histograms and daily scan trends | Chapter 7 (Results) | Shows cumulative threat distribution and database analytics. |
| 14 | **AI Model Lab (`/models`)** | Side-by-side evaluation metrics grid (LR, DT, RF, GB) & feature importance | Chapter 7 (Results) | Visualizes ML performance metrics, cross-validation, and feature weights. |
| 15 | **Model Simulator (`/simulator`)** | Dynamic model weight sliders and ensemble score recalculation engine | Chapter 6 (Implementation) | Demonstrates interactive ensemble weight tweaking and hypothesis testing. |
| 16 | **Scan Comparison (`/compare`)** | Side-by-side dual URL feature & risk metric differential view | Chapter 6 (Implementation) | Demonstrates comparative threat analysis between two URLs. |
| 17 | **About Page (`/about`)** | System architecture card, tech stack badges, and academic credits | Chapter 1 (Introduction) | Summarizes project specifications and technological framework. |

---

## Screenshot Capture Procedure

1. **Start Backend Server:**
   ```bash
   cd backend && python run.py
   ```
2. **Start Frontend Server:**
   ```bash
   cd frontend && npm run dev
   ```
3. **Open Browser:** Navigate to `http://localhost:5173`.
4. **Capture & Save:** Take full-resolution screenshots for items 1–17 and save them into `docs/screenshots/` (e.g., `fig_01_dashboard.png`, `fig_02_scanner.png`, etc.).
