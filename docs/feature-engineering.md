# PhishGuard — 22-Feature Engineering Specification

This document details the 22 canonical features extracted locally from target URL strings by `backend/app/services/feature_extractor.py` and `ml/features/url_features.py`.

---

## Complete Feature Inventory

| # | Feature Key Name | Type | Value Range | Phishing Risk Indicator & Explanation |
|---|---|---|---|---|
| 1 | `url_length` | Numerical | $0 \dots \infty$ | Phishing URLs are significantly longer on average due to obfuscation, token embedding, and subdomains. |
| 2 | `domain_length` | Numerical | $0 \dots \infty$ | Attackers register long domain strings to mimic legitimate brand names or combine multiple terms. |
| 3 | `path_length` | Numerical | $0 \dots \infty$ | Long, nested path strings frequently conceal fake login directories or session tokens. |
| 4 | `num_dots` | Numerical | $0 \dots \infty$ | Multiple dots indicate excessive subdomains or obfuscated multi-level host addresses. |
| 5 | `num_hyphens` | Numerical | $0 \dots \infty$ | Hyphens are widely used in typosquatting to separate brand names (e.g. `paypal-update-account.com`). |
| 6 | `num_underscores` | Numerical | $0 \dots \infty$ | Rare in legitimate hostnames; often used in obfuscated parameter names or scripts. |
| 7 | `num_slashes` | Numerical | $0 \dots \infty$ | Excessive slashes signal deep directory structure used to evade basic string filters. |
| 8 | `num_query_params` | Numerical | $0 \dots \infty$ | Multiple URL parameters indicate dynamic redirect chains or tracking tokens. |
| 9 | `num_fragments` | Numerical | $0 \dots \infty$ | Hash symbols (`#`) can be used to hide client-side dynamic parameters from server logs. |
| 10 | `num_at_symbols` | Numerical | $0 \dots \infty$ | Presence of `@` causes browsers to ignore preceding credentials and navigate to the trailing host. |
| 11 | `has_ip_address` | Binary | `0` or `1` | Raw IPv4 hostnames (e.g. `http://192.168.1.1/login`) bypass domain registration and DNS lookups. |
| 12 | `has_https` | Binary | `0` or `1` | Absence of HTTPS (`0`) indicates an unencrypted protocol, increasing threat likelihood. |
| 13 | `has_www` | Binary | `0` or `1` | Absence of standard `www.` prefix is slightly more common in cheap disposable phishing domains. |
| 14 | `num_digits_in_domain` | Numerical | $0 \dots \infty$ | Numerical digits inside domain names often indicate automated domain generation algorithms (DGA). |
| 15 | `digit_letter_ratio` | Numerical | $[0.0, 1.0]$ | Ratio of numeric digits to letters; high ratios signal random DGA strings or IP obfuscation. |
| 16 | `url_entropy` | Numerical | $[0.0, 8.0]$ | Shannon entropy measuring character randomness. High entropy ($>4.5$) signals token obfuscation. |
| 17 | `has_suspicious_tld` | Binary | `0` or `1` | Uses commonly abused, free or cheap TLDs (`.tk`, `.xyz`, `.top`, `.ml`, `.ga`, `.cf`, `.gq`). |
| 18 | `num_subdomains` | Numerical | $0 \dots \infty$ | Subdomain stuffing places target brand names into subdomains while keeping a malicious root domain. |
| 19 | `has_shortener` | Binary | `0` or `1` | Known URL shorteners (`bit.ly`, `tinyurl.com`) hide the true destination domain from scrutiny. |
| 20 | `special_char_ratio` | Numerical | $[0.0, 1.0]$ | High proportion of non-alphanumeric characters signals encoding or string obfuscation. |
| 21 | `path_entropy` | Numerical | $[0.0, 8.0]$ | Shannon entropy specifically calculated on the URL path component. |
| 22 | `has_suspicious_keywords` | Numerical | $0 \dots \infty$ | Count of credential harvesting keywords (`login`, `signin`, `verify`, `account`, `bank`, `update`). |

---

## Shannon Entropy Formulation

URL entropy $H(S)$ measures the randomness of character distribution in string $S$:

$$H(S) = -\sum_{i=1}^{K} P(c_i) \log_2 P(c_i)$$

Where $K$ is the set of unique characters in the URL string, and $P(c_i)$ is the probability of occurrence of character $c_i$.
