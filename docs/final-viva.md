# PhishGuard — Comprehensive 50-Question Final Viva Defense Guide

This guide contains **50 technical viva voice questions and precise, implementation-aligned answers** for the final 5th-Semester B.Tech AIML mini-project examination.

---

### 1. What is phishing?
**Answer:** Phishing is a social engineering attack vector where malicious actors construct deceptive websites or hyperlinks masquerading as legitimate entities to trick users into disclosing sensitive credentials, financial data, or personal identifiable information (PII).

### 2. Why is phishing dangerous?
**Answer:** Phishing bypasses traditional network firewalls by targeting human vulnerability rather than software bugs. It accounts for over 80% of reported organizational security breaches and can lead to account takeover, corporate espionage, and financial loss.

### 3. Why use machine learning for phishing detection?
**Answer:** Attackers generate thousands of short-lived zero-day phishing URLs daily using automated domain registration scripts. Machine learning models generalize across underlying structural, lexical, and statistical patterns to detect unseen phishing links that are missing from static blacklists.

### 4. Why analyze URLs rather than downloading webpage content?
**Answer:** URL-based lexical analysis provides zero-latency, privacy-preserving, proactive detection ($\sim 12\text{ ms}$). Webpage downloading introduces heavy network bandwidth overhead, latency ($\sim 2-5\text{ s}$), privacy risks, and exposure to client-side cloaking scripts.

### 5. What are the 22 features extracted by PhishGuard?
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

### 6. Why include Logistic Regression in the pipeline?
**Answer:** Logistic Regression serves as a linear baseline classifier. It models monotonic feature relationships efficiently using standardized feature vectors (`StandardScaler`).

### 7. Why include Decision Tree?
**Answer:** Decision Tree provides a non-linear baseline that captures threshold-based feature splits (e.g., URL length $> 75$ combined with suspicious keyword presence).

### 8. Why include Random Forest?
**Answer:** Random Forest is an ensemble bagging classifier that aggregates decision trees trained on bootstrap samples and random feature subsets, providing high generalization stability and immunity to variance.

### 9. Why include Gradient Boosting?
**Answer:** Gradient Boosting sequentially trains decision trees to fit the pseudo-residuals of preceding trees using gradient descent, optimizing decision boundaries.

### 10. Which model performed best during cross-validation?
**Answer:** Random Forest performed best during 5-fold cross-validation, achieving a mean F1-score of $1.0000 \pm 0.0000$, followed closely by Gradient Boosting ($0.9990 \pm 0.0021$).

### 11. What is Precision?
**Answer:** Precision measures the accuracy of positive phishing predictions:
$$\text{Precision} = \frac{TP}{TP + FP}$$

### 12. What is Recall?
**Answer:** Recall (Sensitivity) measures the proportion of actual phishing URLs correctly identified by the model:
$$\text{Recall} = \frac{TP}{TP + FN}$$

### 13. What is F1-Score?
**Answer:** F1-Score is the harmonic mean of Precision and Recall:
$$\text{F1} = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$$

### 14. What is ROC-AUC?
**Answer:** ROC-AUC measures the Area Under the Receiver Operating Characteristic curve, evaluating classifier performance across all threshold settings.

### 15. Why use 5-Fold Stratified Cross-Validation?
**Answer:** Stratified CV preserves the class distribution (50% legitimate, 50% phishing) across all 5 folds, ensuring model performance metrics are consistent and independent of dataset partitioning.

### 16. What is data leakage in machine learning?
**Answer:** Data leakage occurs when information from the test dataset leaks into the training pipeline during preprocessing or feature selection, causing overly optimistic evaluation metrics.

### 17. How was data leakage prevented in PhishGuard?
**Answer:**
1. `StandardScaler` was fitted strictly on training folds and applied to test folds.
2. 52 duplicate URLs were audited and handled prior to splitting.
3. Train/test splits were fixed using explicit random seeds (`random_state=42`).

### 18. Why is the training dataset synthetic?
**Answer:** The synthetic dataset ($N=1,200$) was generated to simulate clean structural distributions and phishing obfuscation patterns for development and pipeline verification.

### 19. Can you claim 100% real-world accuracy for PhishGuard?
**Answer:** **No.** As stated in our academic disclaimer, $1.000$ metrics reflect performance on the synthetic development dataset. Real-world phishing contains unpredictable domain evasions that will lower accuracy.

### 20. Did you evaluate PhishGuard on live real-world phishing links?
**Answer:** Formal evaluation was conducted on the synthetic development dataset. PhishGuard includes architecture configuration support for loading real-world datasets (PhishTank), but a formal real-world benchmark was not conducted in this phase.

### 21. What are the main technical limitations of PhishGuard?
**Answer:** Analysis is restricted to URL string features without inspecting rendered HTML DOM, active JavaScript scripts, or SSL/TLS certificate chains.

### 22. What is FastAPI and why was it chosen?
**Answer:** FastAPI is an asynchronous Python web framework providing high performance, automatic Pydantic request validation, and built-in OpenAPI/Swagger documentation.

### 23. Why choose React 18 for the frontend?
**Answer:** React 18 provides component-based state management, Virtual DOM rendering, dynamic hooks, and fast UI updates for our SOC dashboard.

### 24. What is SQLite and why use SQLAlchemy ORM?
**Answer:** SQLite is a self-contained serverless SQL database. SQLAlchemy ORM abstracts database queries, prevents SQL injection through parameterized statements, and handles data serialization.

### 25. What is joblib used for?
**Answer:** `joblib` serializes trained Scikit-learn model objects and `StandardScaler` instances into binary `.joblib` files on disk for fast startup loading.

### 26. What happens step-by-step when a user submits a URL?
**Answer:**
1. React submits URL via `POST /api/scan`.
2. `url_validator.py` validates length, scheme, and IP safety.
3. `feature_extractor.py` computes 22 URL features.
4. `ml_predictor.py` passes features to 4 ML models and computes ensemble probability.
5. Ensemble probability maps to a $0-100$ Risk Score and 5-tier level.
6. `explainer.py` generates top risk factors.
7. Record is saved to SQLite DB and returned as JSON to React UI.

### 27. How is the 0–100 Risk Score calculated?
**Answer:** Ensemble probability ($0.0-1.0$) is multiplied by 100 and adjusted using heuristic risk rule offsets (e.g., IPv4 host $+15$, suspicious TLD $+10$), clamped between $0$ and $100$.

### 28. How does Risk Score differ from raw ML probability?
**Answer:** Raw ML probability outputs continuous model likelihood ($0.0-1.0$), while Risk Score ($0-100$) incorporates heuristic risk offsets and maps into 5 human-understandable risk tiers (`LOW` to `CRITICAL`).

### 29. What is Explainable AI (XAI) in PhishGuard?
**Answer:** XAI compares a scanned URL's feature values against normalized baseline standard deviations, converting top negative feature deltas into human-readable plain-language explanations.

### 30. How is the Threat Profile Radar constructed?
**Answer:** It aggregates 22 extracted URL features into 5 derived dimensions: URL Structure, Hostname/IP, Obfuscation, Suspicious Keywords, and Security Indicators.

### 31. What is the URL DNA Fingerprint?
**Answer:** The URL DNA Fingerprint is a visual matrix grid mapping extracted numerical URL characteristics into a standardized visual signature.

### 32. Why doesn't PhishGuard fetch remote websites?
**Answer:** To eliminate remote malware execution risks, avoid server-side cloaking traps, preserve user privacy, and ensure sub-50ms execution speeds.

### 33. How does PhishGuard defend against malicious submitted URLs?
**Answer:** Input string processing is non-executable and sandboxed locally, preventing socket connections to malicious targets.

### 34. What is SSRF (Server-Side Request Forgery)?
**Answer:** SSRF is an attack where an attacker forces a server to issue HTTP requests to internal private infrastructure (`127.0.0.1`, `10.0.0.1`). PhishGuard prevents SSRF by explicitly blocking internal target addresses.

### 35. Does PhishGuard visit target URLs during a scan?
**Answer:** **No.** It performs string manipulation and mathematical entropy calculations locally without issuing network packets.

### 36. Can PhishGuard detect zero-day phishing links?
**Answer:** Yes, because it analyzes structural and entropy properties shared by phishing campaigns rather than matching static domain blacklists.

### 37. How are shortened URLs (`bit.ly`, `tinyurl.com`) handled?
**Answer:** `feature_extractor.py` checks host domains against a known shortener registry, setting `has_shortener = 1` to flag obfuscation attempts.

### 38. How are IP-based URLs (`http://192.168.1.1/login`) handled?
**Answer:** A regex pattern detects IPv4 strings in the host segment, setting `has_ip_address = 1` and triggering high-risk score offsets.

### 39. What is model persistence?
**Answer:** Model persistence saves trained ML objects to disk so they can be loaded instantly into memory when the server starts without retraining.

### 40. Why combine multiple ML models in an ensemble?
**Answer:** Ensembling combines predictions from diverse classifiers, reducing variance, smoothing individual model errors, and improving overall prediction stability.

### 41. What is class imbalance?
**Answer:** Class imbalance occurs when one class (e.g., legitimate URLs) vastly outnumbers another (phishing URLs), biasing model predictions toward the majority class.

### 42. How was class balance handled in PhishGuard?
**Answer:** The training dataset was constructed with an exact 1:1 balance (600 legitimate, 600 phishing samples).

### 43. What is a False Positive in phishing detection?
**Answer:** A False Positive occurs when a legitimate website is incorrectly flagged as phishing.

### 44. What is a False Negative?
**Answer:** A False Negative occurs when a malicious phishing site is incorrectly classified as safe.

### 45. Which error type is more dangerous in cybersecurity?
**Answer:** **False Negatives** are far more dangerous because a user trusting a malicious link risks credential theft or system compromise.

### 46. What would you improve in PhishGuard in the future?
**Answer:** Integrating real-world live threat feeds (PhishTank API), computer vision models for webpage screenshots, and browser extension packaging.

### 47. How would you evaluate PhishGuard on real-world datasets?
**Answer:** Set `DATASET_MODE=real_world` in configuration, load verified PhishTank/UNB ISCX CSV files, re-train models, and measure holdout metrics.

### 48. How could deep learning enhance URL analysis?
**Answer:** Character-level Convolutional Neural Networks (Char-CNNs) or Transformer models (RoBERTa) could learn sequential character embeddings without manual feature engineering.

### 49. How could PhishGuard become a browser extension?
**Answer:** Package the React frontend and background feature extractor using Manifest V3 APIs (`chrome.webNavigation`) to inspect link URLs prior to navigation.

### 50. What is the primary academic contribution of your mini project?
**Answer:** Demonstrating that zero-network local feature extraction combined with multi-model machine learning and XAI explainability can deliver fast ($\sim 12\text{ ms}$), privacy-preserving phishing detection in a visual SOC dashboard.
