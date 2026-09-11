# PhishGuard — Live Project Demonstration Script

**Estimated Duration:** 5–7 Minutes  
**Target Audience:** Project Evaluators, Faculty Examiners, and Viva Board  

---

## Pre-Demo Setup Instructions

1. **Launch FastAPI Backend Server:**
   ```bash
   cd backend
   python run.py
   ```
   *Verify output displays: `Uvicorn running on http://0.0.0.0:8000` and `ML models loaded successfully.`*

2. **Launch React Frontend Dev Server:**
   ```bash
   cd frontend
   npm run dev
   ```
   *Verify output displays: `Local: http://localhost:5173/`.*

3. **Open Browser:** Navigate to `http://localhost:5173`.

---

## Demonstration Sequence (17 Steps)

### Step 1: Start Application & Show AI Engine Status
- **Action:** Point out the top header bar status badge showing `AI ENGINE ONLINE` with green indicator.
- **Script:** "We begin on the PhishGuard dashboard. Notice the top status bar confirms the AI Engine is online and connected to our FastAPI backend on port 8000."

### Step 2: Explain Dashboard Overview
- **Action:** Scroll through the home page hero section, feature cards, and system status metrics.
- **Script:** "The interface is styled as a modern Security Operations Center (SOC). It provides quick access to our URL Scanner, Threat Analytics, History, Model Comparison Lab, and Simulator."

### Step 3: Enter Legitimate Target URL
- **Action:** Click on the **Scanner** tab and type `https://google.com` into the URL input box.
- **Script:** "Now let's demonstrate a live scan. First, we enter a known legitimate target URL: `https://google.com`."

### Step 4: Run Legitimate Scan
- **Action:** Click the **Scan URL** button. Observe the 6-stage loading animation.
- **Script:** "When I click 'Scan URL', the backend extracts 22 features, passes them to our 4 ML models, computes the ensemble probability, and stores the record in SQLite."

### Step 5: Explain Legitimate Result Verdict
- **Action:** Point to the scan verdict banner displaying `VERDICT: SAFE` in green text.
- **Script:** "The analysis completes in under 50 milliseconds. The system returns a verdict of 'Safe' with high confidence."

### Step 6: Show Risk Score Indicator
- **Action:** Highlight the radial Risk Gauge showing a Risk Score of `1 / 100` and `LOW` risk level badge.
- **Script:** "Our 5-tier risk scoring system maps this URL to a score of 1 out of 100, placing it squarely in the 'LOW' risk tier (0–20 range)."

### Step 7: Show Risk Factors & XAI Explanations
- **Action:** Scroll down to the **Top Risk Factors** card. Point out positive security indicators (e.g., HTTPS present, low entropy, standard domain length).
- **Script:** "PhishGuard provides explainable AI outputs. It highlights that the URL uses HTTPS encryption, possesses a standard domain length, and exhibits very low character entropy."

### Step 8: Show Threat Profile Radar
- **Action:** Hover over the 5 vertices of the **Threat Profile Radar** chart (Structure, Host, Obfuscation, Keywords, Indicators).
- **Script:** "Here is our derived 5-dimension Threat Profile Radar chart. All dimensions show near-zero risk polygon bounds for legitimate traffic."

### Step 9: Show URL DNA Fingerprint
- **Action:** Point to the **URL DNA Fingerprint** matrix.
- **Script:** "The URL DNA matrix visualizes the exact extracted values across all 22 features, including character lengths, token counts, and Shannon entropy values."

### Step 10: Show Actionable Security Recommendations
- **Action:** Highlight the **Dynamic Recommendations** action panel displaying low-risk guidance.
- **Script:** "PhishGuard provides dynamic remediation advice. For safe links, it confirms standard web browsing safety."

### Step 11: Scan Phishing Target Example
- **Action:** Enter a suspicious phishing link into the scanner:  
  `http://paypal-security-update.account-verification-login.com/auth`  
  Click **Scan URL**.
- **Script:** "Now let's test a malicious phishing attack vector containing keyword spoofing, excessive subdomains, and HTTP scheme."

### Step 12: Explain Phishing Results & Risk Score
- **Action:** Point to the red `VERDICT: PHISHING` banner, Risk Score of `82 / 100`, and `CRITICAL` risk level badge.
- **Script:** "PhishGuard immediately detects the threat, assigning a Risk Score of 82 out of 100 ('CRITICAL' tier). The XAI engine flags missing HTTPS, suspicious financial keywords, and excessive domain length."

### Step 13: Demonstrate Dual Scan Comparison (`/compare`)
- **Action:** Click on the **Scan Comparison** tab in the sidebar. Select the `google.com` scan and the `paypal-security-update...` scan to display side-by-side.
- **Script:** "Our Scan Comparison tool allows security analysts to perform differential analysis between two URLs, comparing entropy differentials and feature weights side-by-side."

### Step 14: Show Scan History Interface (`/history`)
- **Action:** Click **History** in the sidebar. Demonstrate the search bar (filter by "paypal") and verdict filter dropdown.
- **Script:** "The History view displays all past scans stored in our SQLite database. Analysts can search, filter by verdict, and re-open complete reports."

### Step 15: Show Threat Analytics Dashboard (`/analytics`)
- **Action:** Click **Analytics** in the sidebar. Highlight the total scans count, threat percentage, risk score distribution histogram, and daily scan chart.
- **Script:** "The Analytics dashboard aggregates historical metrics, displaying risk tier histograms and daily threat percentages."

### Step 16: Demonstrate AI Model Simulator (`/simulator`)
- **Action:** Click **Model Simulator** in the sidebar. Adjust the Random Forest weight slider from `0.35` to `0.50` and observe the live ensemble recalculation.
- **Script:** "The Model Simulator allows researchers to dynamically test custom ensemble weights across our 4 models without retraining."

### Step 17: Explain Security Protections & Conclude
- **Action:** Return to the home screen and summarize system safeguards.
- **Script:** "In conclusion, PhishGuard operates 100% locally with zero remote HTTP crawling, preventing SSRF attacks while delivering sub-50ms explainable threat analysis. This concludes our live demonstration."
