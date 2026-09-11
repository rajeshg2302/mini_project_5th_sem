# PhishGuard ML Methodology

## Feature Extraction Pipeline (22 Features)

PhishGuard extracts 22 structural, lexical, and protocol features directly from URL strings without requesting external DNS or network responses:

1. `url_length` — Total character count of full URL.
2. `domain_length` — Character length of hostname.
3. `path_length` — Length of URL path component.
4. `num_dots` — Number of dot characters in URL.
5. `num_hyphens` — Number of hyphens in URL.
6. `num_underscores` — Number of underscores.
7. `num_slashes` — Count of forward slash characters.
8. `num_query_params` — Count of URL query parameters.
9. `num_fragments` — Count of fragment markers (`#`).
10. `num_at_symbols` — Count of `@` symbols (credential/redirect spoofing).
11. `has_ip_address` — Boolean indicating raw IPv4 hostname.
12. `has_https` — Boolean indicating secure HTTPS protocol.
13. `has_www` — Presence of `www.` subdomain prefix.
14. `num_digits_in_domain` — Count of numeric characters in domain.
15. `digit_letter_ratio` — Ratio of numerical digits to alphabetic letters.
16. `url_entropy` — Shannon entropy of full URL character string.
17. `has_suspicious_tld` — Usage of high-risk top-level domains (`.tk`, `.xyz`, `.top`, `.ml`, `.ga`, `.cf`, `.gq`).
18. `num_subdomains` — Count of subdomain labels.
19. `has_shortener` — Presence of known URL shortener domains (e.g. `bit.ly`, `tinyurl.com`).
20. `special_char_ratio` — Proportion of non-alphanumeric special characters.
21. `path_entropy` — Shannon entropy of URL path string.
22. `has_suspicious_keywords` — Count of credential harvesting keywords (`login`, `signin`, `verify`, `account`, `bank`, `update`).

## Model Ensemble Strategy

PhishGuard combines 4 verified scikit-learn models:

| Model | Weight | Scaled Input Required |
|---|---|---|
| Random Forest Classifier | `0.35` | No |
| Gradient Boosting Classifier | `0.30` | No |
| Logistic Regression | `0.20` | Yes (`StandardScaler`) |
| Decision Tree Classifier | `0.15` | No |

## Risk Score & 5-Tier Boundary Classification

Risk score is computed via weighted probability ensemble:

$$\text{Risk Score} = \text{clamp}\left(0, 100, \text{round}\left(100 \times \sum w_i p_i \right)\right)$$

| Score Range | Risk Level Tier | Actionable Guidance |
|---|---|---|
| `0 – 20` | `LOW` | Safe prediction, standard web precautions. |
| `21 – 40` | `GUARDED` | Low-to-moderate indicators detected. |
| `41 – 60` | `MEDIUM` | Suspicious structural features present. |
| `61 – 80` | `HIGH` | Elevated phishing probability. |
| `81 – 100` | `CRITICAL` | High-confidence malicious threat. |

## Data Leakage Prevention & Cross-Validation

- **Split Strategy:** 80/20 Stratified Train-Test split (`random_state=42`).
- **Feature Scaling:** `StandardScaler` fitted strictly on `X_train` and applied to `X_test` / live predictions.
- **Cross-Validation:** 5-Fold Stratified K-Fold cross validation (`StratifiedKFold(n_splits=5, shuffle=True, random_state=42)`).
