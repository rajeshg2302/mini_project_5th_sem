# PhishGuard — Viva Voice & Comprehensive Technical Oral Defense Guide

This guide contains **40 essential viva questions and implementation-grounded answers** designed for project defense, academic evaluations, and external examiner reviews for the **PhishGuard 5th-Semester AIML Mini Project**.

---

## Category A: Project Basics & High-Level Architecture

### Q1: What is PhishGuard and what core problem does it solve?
**Answer:** PhishGuard is an AI-driven, zero-network phishing URL detection system. It analyzes structural, lexical, host, and entropy features of incoming web URLs using machine learning algorithms to compute a real-time risk score ($0-100$) and verdict (`Safe`, `Suspicious`, `Phishing`) without making outbound HTTP requests or fetching remote webpage DOMs.

### Q2: What is the high-level architecture of PhishGuard?
**Answer:** PhishGuard follows a modern decoupled architecture:
1. **Frontend:** React 18 SPA (Vite, Lucide icons, Recharts) providing an interactive Security Operations Center dashboard.
2. **Backend:** FastAPI (Python 3.10+) serving asynchronous REST APIs.
3. **ML Engine:** Scikit-learn models (Logistic Regression, Decision Tree, Random Forest, Gradient Boosting) with a 22-feature URL extractor.
4. **Database:** SQLite ORM (SQLAlchemy) for persistent scan history and analytics aggregation.

### Q3: What happens step-by-step during a single URL scan?
**Answer:**
1. User submits URL in React UI -> Sent via HTTP POST to `/api/scan`.
2. `url_validator.py` validates protocol, sanitizes control characters, checks length, and blocks localhost/private IP targets.
3. `feature_extractor.py` computes 22 numerical/binary features via string manipulation and math (Shannon entropy).
4. `ml_predictor.py` passes the feature vector through trained `StandardScaler` and 4 ML classifiers.
5. Ensemble weighted probability is converted into a $0-100$ Risk Score.
6. `explainer.py` calculates feature contribution score differentials and generates top explanation reasons.
7. Scan record is saved to SQLite DB and returned as JSON to React UI for rendering.

---

## Category B: Phishing & Cyber Threat Domain

### Q4: Why did you focus on URL-based detection rather than HTML content crawling?
**Answer:** URL-based detection provides zero-latency, privacy-preserving, proactive defense. Crawling remote web pages exposes the scanner to malicious payloads, server-side tracking, cloaking mechanisms (where phishing sites display legitimate content to security bots), and heavy network bandwidth overhead. URL-based analysis functions entirely locally before a user clicks.

### Q5: What are the primary obfuscation techniques phishers use in URLs?
**Answer:** Common obfuscation techniques include:
- Typo-squatting / Brand spoofing (e.g., `paypal-security-update.com`).
- Excessive subdomain chaining (`login.account.verify.paypal.com.attacker.site`).
- Special character insertion (`@` symbol to bypass browser hostname parsing).
- URL Shorteners (`bit.ly`, `tinyurl.com`) to mask destination hosts.
- Hexadecimal / IP address representation instead of standard domain names.

### Q6: Can PhishGuard prevent zero-day phishing attacks?
**Answer:** Yes, because PhishGuard relies on structural feature extraction (lexical anomalies, entropy, character distributions) rather than static blacklist lookups. It generalizes across unseen zero-day domain patterns that share structural traits with known phishing tactics.

---

## Category C: Machine Learning Pipeline & Strategy

### Q7: Why use multiple machine learning models instead of a single classifier?
**Answer:** Different classifiers capture different aspects of the decision boundary:
- Linear models (Logistic Regression) handle smooth monotonic feature gradients.
- Tree models (Decision Tree, Random Forest, Gradient Boosting) capture non-linear feature interactions and non-monotonic thresholds (e.g., specific sub-string length boundaries).
Using an ensemble reduces model variance and provides multi-model comparative confidence scoring.

### Q8: What are the ensemble weights used in PhishGuard?
**Answer:** The weighted ensemble calculates final probability using verified weights:
$$\text{Probability}_{\text{ensemble}} = 0.35 \cdot P_{\text{RF}} + 0.30 \cdot P_{\text{GB}} + 0.20 \cdot P_{\text{LR}} + 0.15 \cdot P_{\text{DT}}$$
Random Forest receives highest weight ($0.35$) due to its superior generalization during cross-validation.

### Q9: Why not use Deep Learning or Large Language Models (LLMs) for this task?
**Answer:** Tabular structural feature vectors from URLs do not require deep neural network architectures. Traditional tree ensembles achieve near-instant inference ($\sim 12\text{ ms}$), minimal memory overhead, zero GPU dependency, and superior local explainability compared to black-box neural networks.

---

## Category D: Dataset & Scientific Validation

### Q10: What dataset was used to train and evaluate the verified PhishGuard models?
**Answer:** The models were trained and validated on a balanced synthetic development dataset of 1,200 samples (600 legitimate URLs, 600 phishing URLs) designed to simulate clean structural distributions and phishing obfuscation patterns.

### Q11: Did you test on real-world phishing websites?
**Answer:** In this project implementation, formal evaluation was conducted exclusively on the synthetic development dataset. While PhishGuard includes architecture support for ingesting real-world datasets (such as PhishTank and UNB ISCX URL-2016), a formal real-world dataset benchmark was not conducted.

### Q12: Why did Logistic Regression and Random Forest achieve 100% (1.0) metric scores on the test set?
**Answer:** On the synthetic development dataset ($N=1,200$), the synthetic feature generation rules produced linearly separable structural boundaries between legitimate and phishing samples. In machine learning, synthetic data with clear class separators often yields $100\%$ accuracy during holdout and 5-fold cross-validation.

### Q13: Is your model really 100% accurate in real-world deployment?
**Answer:** **No.** As documented in our scientific disclaimer, the $1.0$ metric scores reflect performance on the synthetic development dataset only. Real-world phishing contains unpredictable domain variations, adversarial evasion, and brand spoofing that will reduce real-world accuracy.

---

## Category E: Feature Engineering

### Q14: What are the 22 features extracted from URLs in PhishGuard?
**Answer:**
1. `url_length` (Int)
2. `domain_length` (Int)
3. `path_length` (Int)
4. `num_dots` (Int)
5. `num_hyphens` (Int)
6. `num_underscores` (Int)
7. `num_slashes` (Int)
8. `num_query_params` (Int)
9. `num_fragments` (Int)
10. `num_at_symbols` (Binary)
11. `has_ip_address` (Binary)
12. `has_https` (Binary)
13. `has_www` (Binary)
14. `num_digits_in_domain` (Int)
15. `digit_letter_ratio` (Float)
16. `url_entropy` (Float)
17. `has_suspicious_tld` (Binary)
18. `num_subdomains` (Int)
19. `has_shortener` (Binary)
20. `special_char_ratio` (Float)
21. `path_entropy` (Float)
22. `has_suspicious_keywords` (Binary)

### Q15: What is Shannon Entropy and how is it used in URL analysis?
**Answer:** Shannon Entropy measures the randomness/information entropy of characters in a string:
$$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
Phishing URLs and randomly generated domain names (algorithmic DGA domains) exhibit significantly higher entropy ($H > 4.5$) than human-readable legitimate domain names.

### Q16: How is `has_suspicious_keywords` detected?
**Answer:** It performs case-insensitive token search against a dictionary of high-risk keywords (e.g., `login`, `verify`, `account`, `banking`, `paypal`, `secure`, `update`, `signin`, `credential`) inside the hostname and path segments.

---

## Category F: Logistic Regression

### Q17: How does Logistic Regression work for binary phishing classification?
**Answer:** Logistic Regression applies the Sigmoid (logistic) function to a linear combination of normalized input features:
$$\sigma(z) = \frac{1}{1 + e^{-z}}, \quad z = w_0 + \sum_{i=1}^{22} w_i x_i$$
It outputs a continuous probability between $0.0$ and $1.0$.

### Q18: Why is feature scaling (`StandardScaler`) essential for Logistic Regression?
**Answer:** Logistic Regression uses gradient-based optimization. Features with large numerical ranges (e.g., `url_length` ranging from $15$ to $250$) would dominate the gradient steps over binary features ($0$ or $1$) without standardization ($z = (x - \mu)/\sigma$).

---

## Category G: Decision Tree

### Q19: How does the Decision Tree model split nodes?
**Answer:** It uses Gini Impurity (or Information Gain via Entropy) to select optimal feature thresholds that maximize class purity at each split:
$$\text{Gini} = 1 - \sum_{i=1}^{C} p_i^2$$

### Q20: What is a major disadvantage of a single Decision Tree?
**Answer:** Decision Trees are prone to overfitting to training noise and creating overly complex decision boundaries. That is why ensemble methods like Random Forest and Gradient Boosting are preferred.

---

## Category H: Random Forest

### Q21: What is Random Forest and why does it perform well?
**Answer:** Random Forest is an ensemble bagging classifier that trains multiple independent decision trees on bootstrap samples of the dataset and random feature subsets. It aggregates predictions via majority voting, dramatically reducing variance without increasing bias.

---

## Category I: Gradient Boosting

### Q22: How does Gradient Boosting differ from Random Forest?
**Answer:**
- **Random Forest** builds independent trees in parallel using bagging.
- **Gradient Boosting** builds trees sequentially using boosting, where each consecutive tree is trained to fit the pseudo-residuals (errors) of the preceding trees using gradient descent.

---

## Category J: Evaluation Metrics

### Q23: Define Accuracy, Precision, Recall, F1-Score, and ROC-AUC.
**Answer:**
- **Accuracy:** $\frac{TP + TN}{TP + TN + FP + FN}$ (Overall correct percentage).
- **Precision:** $\frac{TP}{TP + FP}$ (Proportion of predicted phishing URLs that are truly phishing).
- **Recall:** $\frac{TP}{TP + FN}$ (Proportion of actual phishing URLs correctly identified).
- **F1-Score:** $2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$ (Harmonic mean of precision and recall).
- **ROC-AUC:** Area under the True Positive Rate vs False Positive Rate curve across all classification thresholds.

### Q24: In cybersecurity phishing detection, which is more critical: Precision or Recall?
**Answer:** **Recall** is generally more critical because a False Negative (classifying a malicious phishing link as "Safe") compromises user credentials. However, extremely low Precision (high False Positives) causes user security fatigue. F1-Score balances both.

---

## Category K: Cross-Validation & Data Leakage

### Q25: What is 5-Fold Stratified Cross-Validation and why was it used?
**Answer:** It splits the dataset into 5 equal folds while preserving class balance ($50\%$ legitimate, $50\%$ phishing) in every fold. The model is trained on 4 folds and tested on the 5th, repeated 5 times. It ensures the performance metrics are stable across different dataset partitions.

### Q26: How did you prevent data leakage in PhishGuard?
**Answer:**
1. Feature extraction scaling (`StandardScaler`) was fitted ONLY on training folds, never on test folds.
2. Identical duplicate URLs were audited and removed before splitting.
3. Train/test splits ($80/20$) were locked with fixed random seeds (`random_state=42`).

---

## Category L: Backend Framework (FastAPI)

### Q27: Why did you choose FastAPI over Flask or Django?
**Answer:** FastAPI provides native asynchronous request handling (`asyncio`), automatic Pydantic request/response schema validation, OpenAPI/Swagger documentation generation, and high performance comparable to Node.js and Go.

### Q28: How does FastAPI handle CORS in PhishGuard?
**Answer:** It uses `CORSMiddleware` configured to explicitly allow origins `http://localhost:3000` and `http://localhost:5173`, allowing browser requests while blocking unauthorized cross-origin requests.

---

## Category M: Frontend Architecture (React 18)

### Q29: How is state managed in the React frontend?
**Answer:** State is managed using React Hooks (`useState`, `useEffect`, `useCallback`) for dynamic component updates, combined with modular view rendering (`ScannerView`, `HistoryView`, `AnalyticsView`, `ModelLabView`, `ComparisonView`).

### Q30: How does the frontend handle API loading and error states?
**Answer:** Components maintain dynamic loading states, displaying pulsing glowing skeletons and real-time status banners during HTTP fetches, and gracefully rendering alert banners if backend connection fails.

---

## Category N: Database Operations (SQLite + SQLAlchemy)

### Q31: What is stored in the SQLite database?
**Answer:** The database stores historical scan records: URL string, risk score ($0-100$), verdict string, confidence score, raw extracted features JSON, model probabilities JSON, top explanation reasons JSON, and timestamp.

### Q32: Why use an ORM (SQLAlchemy) instead of raw SQL queries?
**Answer:** SQLAlchemy provides object-relational mapping, automatic schema migrations, protection against SQL injection through parameterized queries, and abstraction over underlying SQL dialects.

---

## Category O: Security Protections

### Q33: How does PhishGuard defend against SSRF (Server-Side Request Forgery)?
**Answer:** PhishGuard NEVER connects to submitted target URLs. Furthermore, `url_validator.py` explicitly rejects `localhost`, `127.0.0.1`, private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and non-HTTP/HTTPS pseudo-schemes (`file://`, `ftp://`, `javascript:`).

### Q34: How does PhishGuard protect against Denial of Service (DoS) via huge URLs?
**Answer:** `url_validator.py` enforces a maximum URL length limit ($2,048$ characters) and strips non-printable ASCII/control characters before processing.

---

## Category P: Risk Scoring & Explainability

### Q35: How is Risk Score calculated from ML probabilities?
**Answer:** The ensemble probability ($0.0 - 1.0$) is multiplied by 100 to yield a baseline score, then adjusted using heuristic risk rule offsets (e.g., IP address in host $+15$, suspicious TLD $+10$), clamped strictly between $0$ and $100$.

### Q36: What are the 5 Risk Score tiers in PhishGuard?
**Answer:**
- **0–20:** `LOW` (Green)
- **21–40:** `GUARDED` (Blue/Teal)
- **41–60:** `MEDIUM` (Yellow)
- **61–80:** `HIGH` (Orange)
- **81–100:** `CRITICAL` (Red)

### Q37: How does PhishGuard provide explainable AI (XAI) outputs?
**Answer:** It compares the scanned URL's feature values against normalized baseline standard deviations, computing directional feature contribution deltas. The top negative feature deviations are converted into human-readable plain language explanations (e.g., "URL uses IP address instead of domain name").

---

## Category Q: System Limitations

### Q38: What are the primary limitations of PhishGuard?
**Answer:**
1. Evaluation was conducted on a synthetic development dataset ($N=1,200$).
2. Analysis is restricted to URL strings without examining rendered DOM, JavaScript, or SSL certificate chains.
3. Sophisticated brand spoofing that uses low-entropy legitimate-looking domains without keywords may bypass URL-only detection.

---

## Category R: Future Research Scope

### Q39: What are the planned future extensions for PhishGuard?
**Answer:**
1. Integration of real-world datasets (PhishTank live API feeds).
2. Multi-modal analysis combining URL features with web-page screenshot computer vision models (CNNs).
3. Browser extension integration (Chrome/Firefox MV3) for active browsing protection.
4. Domain age and WHOIS lookup integration.

### Q40: What is your primary takeaway from building PhishGuard?
**Answer:** PhishGuard demonstrates that lightweight local machine learning models combined with lexical and entropy feature engineering can deliver fast, privacy-preserving phishing threat detection. Rigorous validation, explainability, and secure coding practices are critical when translating ML research into production cybersecurity systems.
