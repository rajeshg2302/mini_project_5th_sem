# PhishGuard — Academic References & Bibliography

This document lists all **verified academic publications, dataset repositories, software documentation, and cybersecurity standards** referenced throughout the PhishGuard mini-project implementation.

---

## 1. Academic & Research Literature

1. **Ma, J., Saul, L. K., Savage, S., & Voelker, G. M. (2009).**  
   *Beyond Blacklists: Learning to Detect Malicious Web Sites from Suspect URLs.*  
   Proceedings of the 15th ACM SIGKDD International Conference on Knowledge Discovery and Data Mining (KDD '09), pp. 1245–1254.  
   *Relevance:* Established foundational methodology for lexical and host-based URL feature extraction without webpage content crawling.

2. **Sahingoz, O. K., Buber, E., Demir, O., & Diri, B. (2019).**  
   *Machine learning based phishing detection from URLs.*  
   Expert Systems with Applications, Vol. 117, pp. 345–357.  
   *Relevance:* Demonstrates effectiveness of Random Forest and decision tree ensembles on URL feature vectors.

3. **Chiew, K. L., Tan, C. L., Wong, K., Yong, K. S., & Tiong, W. K. (2019).**  
   *A new hybrid ensemble feature selection framework for machine learning-based phishing website detection.*  
   Information Sciences, Vol. 484, pp. 153–166.  
   *Relevance:* Framework for combining lexical tokens, character length, and domain properties into multi-classifier ensembles.

4. **Shannon, C. E. (1948).**  
   *A Mathematical Theory of Communication.*  
   Bell System Technical Journal, Vol. 27, No. 3, pp. 379–423.  
   *Relevance:* Mathematical foundation for Shannon Entropy ($H(X) = -\sum P(x_i) \log_2 P(x_i)$) used in `url_entropy` and `path_entropy`.

---

## 2. Dataset & Threat Intelligence Sources

5. **PhishTank Threat Feed (OpenDNS / Cisco).**  
   *PhishTank Developer Clearinghouse & Phishing URL Database.*  
   URL: `https://phishtank.org/`  
   *Relevance:* Configured as real-world dataset support source (`DATASET_MODE=real_world`).

6. **UNB ISCX URL-2016 Dataset.**  
   *University of New Brunswick Canadian Institute for Cybersecurity.*  
   URL: `https://www.unb.ca/cic/datasets/url-2016.html`  
   *Relevance:* Reference dataset benchmark for legitimate vs phishing URL structure distributions.

---

## 3. Technology & Framework Documentation

7. **Scikit-Learn Documentation (v1.0+).**  
   *Machine Learning in Python — Supervised Learning & Ensemble Algorithms.*  
   URL: `https://scikit-learn.org/stable/`  
   *Relevance:* Core algorithms (`RandomForestClassifier`, `GradientBoostingClassifier`, `LogisticRegression`, `DecisionTreeClassifier`, `StandardScaler`).

8. **FastAPI Documentation (v0.90+).**  
   *FastAPI Framework, high performance, easy to learn, fast to code, ready for production.*  
   URL: `https://fastapi.tiangolo.com/`  
   *Relevance:* Backend REST API framework, Pydantic data validation, OpenAPI specification.

9. **React 18 Documentation.**  
   *A JavaScript library for building user interfaces.*  
   URL: `https://react.dev/`  
   *Relevance:* Frontend Single Page Application framework, hooks, component lifecycle.

10. **Recharts Documentation.**  
    *A Redefined Chart Library Built with React and D3.*  
    URL: `https://recharts.org/`  
    *Relevance:* Threat Profile Radar chart and Analytics histogram components.

11. **OWASP (Open Web Application Security Project).**  
    *Server-Side Request Forgery (SSRF) Prevention Cheat Sheet.*  
    URL: `https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html`  
    *Relevance:* Input validation rules blocking internal IP addresses (`127.0.0.1`, private subnets) and non-HTTP schemes.
