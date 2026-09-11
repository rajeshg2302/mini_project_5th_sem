# PhishGuard — User Guide & SOC Operations Manual

Welcome to **PhishGuard**. This guide walks through the application workflow for security analysts, students, and users.

---

## 1. Accessing the Platform

1. Open your web browser and navigate to `http://localhost:5173`.
2. Observe the top application header:
   - Verify the system status indicator shows **`● AI ENGINE ONLINE`**.
   - Review system clock and architecture status.

---

## 2. Scanning a Suspicious URL

1. Click **Scanner** in the left sidebar (or navigate to `/scan`).
2. Type or paste any website address into the input bar (e.g. `http://192.168.1.1/login.php?verify=account`).
3. Click **ANALYZE WEBSITE** or press `Enter`.
4. Observe the visual analysis progress sequence (`URL RECEIVED` ➔ `VALIDATED` ➔ `FEATURES EXTRACTED` ➔ `MODEL EVALUATED` ➔ `RISK CALCULATED` ➔ `EXPLANATION GENERATED`).

---

## 3. Interpreting the Security Report

1. **Threat Level & Verdict:**
   - **`PHISHING DETECTED` (`CRITICAL THREAT`):** High likelihood of malicious intent.
   - **`SUSPICIOUS INDICATORS DETECTED` (`ELEVATED RISK`):** Moderate risk anomalies.
   - **`NO SIGNIFICANT PHISHING INDICATORS DETECTED` (`LOW RISK`):** Clean structural signature.
2. **Circular Risk Gauge:** Displays exact risk score from `0` to `100`.
3. **AI Assessment Panel:** Review model confidence score and per-model probability progress bars (Random Forest, Gradient Boosting, Logistic Regression, Decision Tree).
4. **Threat Profile Radar:** Inspect the 5 derived risk dimensions (*URL Structure*, *Hostname/IP*, *Obfuscation*, *Keywords*, *Security Risk*).
5. **PhishGuard URL DNA:** Review the 10-indicator feature intensity fingerprint bars.
6. **Feature-Based Risk Factors:** Inspect observed feature values and SHAP impact statements.
7. **Dynamic Security Recommendations:** Review targeted guidelines (e.g., checking domain credentials, unshortening URLs, SSL warnings).
8. **Security Education Panel:** Expand *"Why Phishing Attackers Use This Technique"* to learn about IP hostnames, subdomain stuffing, and keywords.
9. **Technical 22-Feature Analysis:** Expand to inspect raw feature values categorized by *URL Structure*, *Security & Protocol*, *Suspicious Indicators*, and *Lexical Ratios*.
10. **Report Actions:**
    - Click **GENERATE REPORT (JSON)** to download an offline JSON report.
    - Click **COMPARE SCAN** to send the report to the Scan Comparison tool.

---

## 4. Comparing Scans (`/compare`)

1. Click **Scan Comparison** or navigate to `/compare`.
2. Select **Scan A** and **Scan B** from the dropdown selectors.
3. Review the side-by-side verdict cards and inspect highlighted rows in the **Feature Comparison Matrix** to identify exact structural differences.

---

## 5. Threat Simulator (`/simulator`)

1. Click **Threat Simulator** in the sidebar.
2. Select a preset target or enter a URL.
3. Toggle structural feature switches (*Force HTTP Protocol*, *IP Hostname*, *Inject Phishing Keywords*).
4. Compare **ORIGINAL TARGET** vs **SIMULATED TARGET** risk scores side-by-side to learn how feature variations alter ML predictions.

---

## 6. Reviewing Scan History (`/history`)

1. Click **Scan History** in the sidebar.
2. Use the search input to filter by domain pattern.
3. Filter by verdict level (`Safe`, `Suspicious`, `Phishing`) or sort order.
4. Click **View** to inspect a full security report or **Delete** to purge a record from the SQLite database.

---

## 7. Viewing Threat Analytics (`/analytics`)

1. Click **Threat Analytics** in the sidebar.
2. Review real-time SOC metrics: Total Scans, Phishing Detected, Safe Predictions, Average Risk Score.
3. Inspect the **Threat Verdict Breakdown** pie chart, **Risk Score Histogram**, and **30-Day Scan Activity Trend**.
