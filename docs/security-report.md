# PhishGuard X — Security Investigation Report Specifications

## Overview
The PhishGuard X Security Investigation Report is an official audit document generated dynamically in PDF format using Python's `reportlab` library (with fallback JSON support).

## 18 Required Audit Sections

1. **Report Header**: Official title, audit badge, case number `PG-XXXXX`.
2. **Case Information**: Case ID, Scan ID, Assigned Analyst, Created/Updated timestamps.
3. **Target URL**: Full investigated URL string.
4. **Scan Timestamp**: UTC timestamp of original URL feature extraction.
5. **Final Verdict**: `Phishing`, `Suspicious`, or `Legitimate`.
6. **Risk Score**: Score between `0 / 100` and `100 / 100`.
7. **Risk Level**: `CRITICAL`, `HIGH`, `MEDIUM`, `GUARDED`, `LOW`.
8. **ML Prediction**: Primary ML model classification result.
9. **Probability / Confidence**: Exact ML confidence percentage (e.g. `96.4%`).
10. **Model Information**: Primary model name (`Random Forest`, `Gradient Boosting`, etc.) and verified ensemble models list.
11. **22-Feature Analysis**: Complete 22 URL extracted feature snapshot table.
12. **Threat Dimensions**: Breakdown of URL structure, hostname/IP risk, obfuscation, keywords, and protocol security.
13. **Severity Matrix**: Indicators detected table (IP host, keyword trigger, shortener, HTTPS status).
14. **Identified Risk Factors**: Top reasons triggering risk elevation.
15. **Actionable Recommendations**: Standardized security guidelines tailored to verdict.
16. **Analyst Investigation Notes**: Recorded analyst technical observations.
17. **Investigation Status**: `NEW`, `INVESTIGATING`, `CONFIRMED THREAT`, `FALSE POSITIVE`, or `RESOLVED`.
18. **Analyst Security Assessment & Resolution**: Technical assessment summary, resolution disposition, and mitigation notes.
