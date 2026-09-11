# PhishGuard — Threat Analysis & Risk Scoring

## 1. 5-Tier Risk Level Classification

PhishGuard converts ML ensemble probabilities $P_{\text{phish}} \in [0.0, 1.0]$ into a 0–100 risk score and maps them to five boundary levels:

$$\text{Risk Score} = \max\left(0, \min\left(100, \text{round}(P_{\text{phish}} \times 100)\right)\right)$$

| Score Interval | Risk Level Tier | Verdict Label | Operational Meaning |
|---|---|---|---|
| `0 – 20` | **`LOW`** | `Safe` | Minimal threat indicators; standard web safety applies. |
| `21 – 40` | **`GUARDED`** | `Safe` / `Suspicious` | Minor anomalies detected; exercise standard caution. |
| `41 – 60` | **`MEDIUM`** | `Suspicious` | Moderate structural or keyword indicators present. |
| `61 – 80` | **`HIGH`** | `Phishing` / `Suspicious` | Elevated phishing indicators; avoid entering credentials. |
| `81 – 100` | **`CRITICAL`** | `Phishing` | Severe malicious threat detected; high probability of phishing. |

---

## 2. Derived 5-Dimension Threat Profile

To make model output interpretable, PhishGuard derives five threat profile dimensions directly from extracted features:

1. **URL Structure Risk:** Measures structural anomalies based on `url_length`, `path_length`, `num_slashes`, and `num_query_params`.
2. **Hostname/IP Risk:** Evaluates host-level threats including `has_ip_address`, `num_subdomains`, `domain_length`, and `num_hyphens`.
3. **Obfuscation Risk:** Measures character randomness and obfuscation techniques via `has_shortener`, `num_at_symbols`, `url_entropy`, and `special_char_ratio`.
4. **Suspicious Keyword Risk:** Evaluates the presence of social engineering terminology (`has_suspicious_keywords`).
5. **Security Indicator Risk:** Measures protocol and TLD vulnerabilities (`has_https`, `has_suspicious_tld`).

---

## 3. Advanced Threat Intelligence Visualizations

- **Threat Profile Radar:** Interactive Recharts radar overlay rendering the 5 risk dimensions.
- **URL DNA Fingerprint:** 10-indicator feature intensity fingerprint comparing raw values against baseline safety thresholds.
- **Security Pipeline Timeline:** Displays real backend execution stages (`URL RECEIVED` ➔ `VALIDATED` ➔ `FEATURES EXTRACTED` ➔ `MODEL EVALUATED` ➔ `RISK CALCULATED` ➔ `EXPLANATION GENERATED`).
- **Dynamic Contextual Recommendations:** Triggered by specific feature flags (e.g. IP hostname, HTTP protocol, keyword triggers, shortener domain).
- **Security Education Panel:** Explains defensive rationale for detected attack techniques.
- **Scan Comparison Tool:** Side-by-side matrix comparison between two historical scan records (`/compare`).
- **Model Simulator:** Interactive feature modifier testing tool demonstrating real-time score shifts without mutating database records.
