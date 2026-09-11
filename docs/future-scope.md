# PhishGuard — Future Scope & Enhancement Roadmap

> [!NOTE]
> The items listed below represent prospective research directions and commercial enhancement opportunities. They are explicitly designated as **FUTURE WORK ONLY** and were not implemented in the current 5th-semester mini project release.

---

## 1. Data Pipeline & Dataset Expansion
- **Empirical Real-World Dataset Evaluation:** Benchmark PhishGuard models on live, multi-thousand URL feeds from PhishTank and OpenPhish.
- **Continuous Dataset Ingestion Pipeline:** Automated daily web crawlers to collect fresh malicious domains and continuously fine-tune classifier weights.

## 2. Multimodal Feature Analysis
- **Webpage Content & HTML DOM Analysis:** Extract structural DOM features (e.g. `<input type="password">` forms, missing action URLs, hidden iframe elements).
- **Computer Vision & Visual Similarity:** Utilize Convolutional Neural Networks (CNN) to compare rendered webpage screenshots against target brand login pages (e.g. PayPal, Microsoft 365).
- **SSL/TLS Certificate Inspection:** Parse SSL certificate validity, issuer trust chains, and expiration windows.

## 3. Threat Intelligence Integration
- **WHOIS & Domain Age Intelligence:** Query domain registration databases to evaluate domain age and registrant anonymity.
- **Active Threat Intelligence Feeds:** Integrate commercial threat intelligence APIs (e.g. VirusTotal, Google Safe Browsing API) for hybrid scoring.

## 4. Model & Deep Learning Architectures
- **Transformer & Character-Level DL Models:** Evaluate character-level Convolutional Neural Networks (Char-CNN) and Transformer encoders (e.g. BERT-based URL models) for contextual sequence learning.
- **Tree-SHAP & Kernel-SHAP Integration:** Compute exact game-theoretic SHAP values using the `shap` Python package.

## 5. Deployment & User Accessibility
- **Browser Extension:** Develop Chrome/Firefox extensions to automatically score clicked URLs in real-time.
- **Enterprise SOC API Gateway:** Containerized Docker deployment with JWT authentication and redis rate-limiting for enterprise security operations centers.
