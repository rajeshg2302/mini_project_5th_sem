# PhishGuard — Final Academic Project Presentation (PPT Deck)

**Project Title:** PhishGuard: AI-Based Phishing Website Detection Using Machine Learning  
**Degree:** B.Tech AIML — 5th Semester Mini Project  

---

## Slide 1: Title Slide
- **Title:** PhishGuard: AI-Based Phishing Website Detection Using Machine Learning
- **Subtitle:** A Zero-Network, Explainable Machine Learning Architecture & SOC Dashboard
- **Presenter:** Department of AIML (5th Semester Mini Project)
- **Suggested Visual:** PhishGuard shield logo & futuristic SOC dashboard mockup.
- **Speaker Notes:** "Good morning respected guide and evaluators. Today I present PhishGuard, a zero-network explainable machine learning architecture for real-time phishing website detection."

---

## Slide 2: Introduction
- Rapid increase in social engineering attacks and credential harvesting via deceptive URLs.
- Phishing accounts for over 80% of reported corporate security incidents globally.
- Attackers rapidly automate domain registration, creating short-lived zero-day phishing sites.
- Need for real-time, privacy-preserving, zero-latency local threat analysis.
- **Suggested Visual:** Cyber threat statistics infographic & malicious link example.
- **Speaker Notes:** "Phishing URLs pose a massive threat because attackers frequently register short-lived domains that bypass static security lists."

---

## Slide 3: Problem Statement
- **Static Blacklists Fail:** Incapable of detecting zero-day phishing URLs before manual reporting.
- **Active Crawlers are Slow & Risky:** Remote page crawling incurs high latency ($\sim 2-5\text{ s}$), bandwidth consumption, and cloaking risks.
- **Lack of Explainability:** Traditional ML classifiers output black-box probabilities without actionable analyst context.
- **Suggested Visual:** Diagram comparing slow remote crawling vs fast local inspection.
- **Speaker Notes:** "Existing solutions rely on blacklists or active web crawlers. Crawlers are slow and expose systems to malicious scripts, while blacklists miss new URLs."

---

## Slide 4: Project Objectives
- Extract 22 structural, lexical, host, and Shannon entropy features purely from URL strings.
- Implement a weighted ensemble combining 4 supervised ML models (LR, DT, RF, GB).
- Compute dynamic $0-100$ Risk Scores mapped into 5 risk tiers (`LOW` to `CRITICAL`).
- Deliver Explainable AI (XAI) feature contribution rationales and derived Threat Profile Radar charts.
- Build a full-stack React 18 visual dashboard backed by FastAPI and SQLite.
- **Suggested Visual:** Icons representing 22 Features, 4 ML Models, XAI Engine, and React UI.
- **Speaker Notes:** "Our objective is to perform zero-network 22-feature string extraction in sub-50ms, returning transparent risk scores and XAI explainability."

---

## Slide 5: Existing System & Limitations
- **Google Safe Browsing / Blacklists:** Database lookups miss newly generated URLs.
- **DOM Parsing Crawlers:** Download remote page HTML; vulnerable to server-side cloaking scripts.
- **Privacy Concerns:** Browsing links are sent to third-party cloud servers.
- **Suggested Visual:** Table highlighting Blacklist Latency vs DOM Crawling Overhead.
- **Speaker Notes:** "Conventional tools depend on third-party API lookups or active DOM crawling, which leaks user browsing data and delays classification."

---

## Slide 6: Proposed PhishGuard System
- **Zero-Network Engine:** Operates 100% locally on string input without outbound HTTP requests.
- **Sub-50ms Response:** Feature extraction + inference completes in $\sim 12\text{ ms}$.
- **Multi-Model Consensus:** Combines Logistic Regression, Decision Tree, Random Forest, and Gradient Boosting.
- **Explainable XAI Output:** Generates plain-language reason strings and 5-tier risk scoring.
- **Suggested Visual:** High-level system flow from URL Input -> Feature Extractor -> ML Ensemble -> Visual SOC UI.
- **Speaker Notes:** "PhishGuard processes incoming URLs locally within 12 milliseconds, producing transparent risk assessments without opening socket connections."

---

## Slide 7: Overall System Architecture
- **Frontend:** React 18 SPA (Vite, Recharts, Lucide React).
- **Backend API:** FastAPI Python REST web framework (`uvicorn`).
- **ML Pipeline:** Scikit-Learn classifiers serialized with `joblib`.
- **Database:** SQLite3 via SQLAlchemy ORM for scan logs and analytics.
- **Suggested Visual:** PhishGuard Architecture Diagram (Frontend -> FastAPI -> ML Predictor -> SQLite DB).
- **Speaker Notes:** "Here is our decoupled system architecture. The React frontend interacts with FastAPI via asynchronous REST APIs, backed by SQLite storage."

---

## Slide 8: Dataset & Audit
- **Dataset:** Balanced synthetic development dataset of 1,200 samples (600 legitimate, 600 phishing).
- **Data Validation:** 0 malformed URLs, 0 missing values, 52 audited duplicates removed.
- **Real-World Config Support:** Pipeline supports loading PhishTank / UNB ISCX datasets via configuration.
- **Suggested Visual:** Class distribution pie chart (50% Legitimate / 50% Phishing).
- **Speaker Notes:** "We validated our training dataset of 1,200 balanced samples, auditing for duplicate feature vectors and missing values."

---

## Slide 9: Feature Engineering (22 URL Features)
- **Lexical Features:** `url_length`, `domain_length`, `path_length`, `num_dots`, `num_hyphens`, `num_slashes`, etc.
- **Host & Protocol Features:** `has_ip_address`, `has_https`, `has_www`, `num_subdomains`, `has_suspicious_tld`.
- **Obfuscation & Entropy:** `special_char_ratio`, `num_at_symbols`, `has_shortener`, `has_suspicious_keywords`.
- **Shannon Entropy Math:**
  $$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
- **Suggested Visual:** Feature inventory graphic highlighting `url_entropy` mathematical equation.
- **Speaker Notes:** "We extract 22 numerical features including Shannon Entropy, which measures character randomness to catch algorithmic DGA domain names."

---

## Slide 10: Machine Learning Algorithms & Ensemble Strategy
- **Random Forest (Weight 0.35):** Bagging tree ensemble with highest generalization resilience.
- **Gradient Boosting (Weight 0.30):** Sequential boosted trees fitting residual errors.
- **Logistic Regression (Weight 0.20):** Standardized linear probability baseline (`StandardScaler`).
- **Decision Tree (Weight 0.15):** Gini impurity non-linear decision boundary tree.
- **Ensemble Formulation:**
  $$\text{Probability}_{\text{ensemble}} = 0.35 \cdot P_{\text{RF}} + 0.30 \cdot P_{\text{GB}} + 0.20 \cdot P_{\text{LR}} + 0.15 \cdot P_{\text{DT}}$$
- **Suggested Visual:** Ensemble weighting breakdown chart.
- **Speaker Notes:** "Our ensemble combines four classifiers. Random Forest receives the highest weight of 35% due to its cross-validation stability."

---

## Slide 11: Experimental Results & Model Performance
- **Holdout Test Set ($N=240$):**
  - **Random Forest:** Accuracy `1.000`, Precision `1.000`, Recall `1.000`, F1 `1.000`
  - **Logistic Regression:** Accuracy `1.000`, Precision `1.000`, Recall `1.000`, F1 `1.000`
  - **Gradient Boosting:** Accuracy `0.850`, Precision `0.8043`, Recall `0.925`, F1 `0.8605`
  - **Decision Tree:** Accuracy `0.850`, Precision `0.8043`, Recall `0.925`, F1 `0.8605`
- **5-Fold Stratified Cross-Validation:** RF F1 = `1.0000 ± 0.0000`; GB F1 = `0.9990 ± 0.0021`.
- **Suggested Visual:** Model comparison bar chart showing Holdout and CV metrics.
- **Speaker Notes:** "On our synthetic development dataset, Random Forest and Logistic Regression achieved 1.000 holdout accuracy, confirmed by 5-fold cross-validation."

---

## Slide 12: PhishGuard UI & User Experience
- **Interactive Scanner:** Real-time URL scan execution and risk tier badge display.
- **5 Risk Tiers:** `LOW` ($0-20$), `GUARDED` ($21-40$), `MEDIUM` ($41-60$), `HIGH` ($61-80$), `CRITICAL` ($81-100$).
- **XAI Explanation Cards:** Plain-language descriptions of top risk factors.
- **Suggested Visual:** Screenshot of PhishGuard Scanner Page showing Risk Score & XAI Cards.
- **Speaker Notes:** "The user interface displays a dynamic 0 to 100 risk score color-coded into 5 risk tiers alongside plain-language explanation cards."

---

## Slide 13: Threat Intelligence Features
- **Threat Profile Radar:** Derived 5-dimension radar chart (Structure, Host, Obfuscation, Keywords, Indicators).
- **URL DNA Fingerprint:** Matrix visualization of extracted URL characteristics.
- **Scan Timeline:** 6-stage interactive scan execution timeline.
- **Scan Comparison:** Side-by-side URL feature and metric differential analysis (`/compare`).
- **Suggested Visual:** Recharts Threat Profile Radar & URL DNA Fingerprint screenshots.
- **Speaker Notes:** "We also provide derived threat intelligence views, including a 5-dimension Radar chart and a dual URL comparison tool."

---

## Slide 14: Automated Testing & Security Safeguards
- **38 Automated Tests Passing:** 100% unit and integration test pass rate (`unittest`).
- **Zero-Network Isolation:** Eliminates malware execution risks from malicious target links.
- **SSRF Prevention:** Blocks `localhost`, `127.0.0.1`, private IP subnets, and non-HTTP schemes.
- **Length Boundaries:** Rejects URLs exceeding 2,048 characters and sanitizes control characters.
- **Suggested Visual:** Terminal screenshot showing `38/38 tests passing` OK.
- **Speaker Notes:** "Security is built-in: PhishGuard never visits submitted URLs, prevents SSRF attacks, and passes all 38 automated tests."

---

## Slide 15: Performance Benchmarks
- **Feature Extraction + ML Inference:** $\sim 12\text{ ms}$
- **Total API Response (including SQLite storage):** $\sim 35\text{ ms}$
- **Frontend Production Build:** Compiles in `7.14s` via Vite.
- **Suggested Visual:** Latency waterfall chart ($\sim 12\text{ ms}$ ML vs $\sim 35\text{ ms}$ Total API).
- **Speaker Notes:** "Total API processing takes just 35 milliseconds, demonstrating sub-50ms real-time throughput."

---

## Slide 16: Project Limitations
- **Synthetic Development Dataset:** Evaluated on synthetic dataset ($N=1,200$); real-world accuracy was not formally benchmarked.
- **URL String Scope:** Does not inspect rendered DOM HTML or active JavaScript.
- **No SSL/TLS Inspection:** Certificate chain validity is not verified.
- **Suggested Visual:** Academic disclaimers callout box.
- **Speaker Notes:** "As an academic project, evaluation was conducted on our synthetic dataset. Real-world deployment would require live feed validation."

---

## Slide 17: Future Research Scope
- Integration with live real-world threat feeds (PhishTank & OpenPhish APIs).
- Multimodal deep learning incorporating webpage screenshot Computer Vision models (CNNs).
- Packaging as a Manifest V3 browser extension for proactive desktop protection.
- **Suggested Visual:** Roadmap diagram showing Browser Extension -> Live Feeds -> Vision Models.
- **Speaker Notes:** "Future work includes building a browser extension and integrating computer vision models to analyze rendered webpage screenshots."

---

## Slide 18: Conclusion & Q&A
- Developed a lightweight, zero-network phishing detection architecture.
- Achieved sub-50ms execution ($\sim 12\text{ ms}$ ML inference) with 22 URL features.
- Delivered transparent XAI risk scoring, multi-model consensus, and visual SOC UI.
- Validated via 38 automated tests and clean production build.
- **Thank You! Questions & Answers.**
- **Suggested Visual:** Contact info & PhishGuard GitHub repository link.
- **Speaker Notes:** "Thank you for your time. I am now open to your questions."
