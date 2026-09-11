# PhishGuard — Synthetic Development Dataset

This directory contains the synthetic training dataset used for development, testing, and initial model verification of the PhishGuard URL classification engine.

## Dataset Summary

- **File Name:** `phishing_dataset.csv`
- **Dataset Mode:** `synthetic`
- **Total Samples:** 1,200 URLs
- **Class Distribution:**
  - **Legitimate (0):** 600 samples (50.0%)
  - **Phishing (1):** 600 samples (50.0%)
- **Feature Columns:** 22 extracted URL string features + 1 target column (`label`)
- **Generator Script:** `phishguard/ml/generate_dataset.py`

## Features Included (22)

1. `url_length`
2. `domain_length`
3. `path_length`
4. `num_dots`
5. `num_hyphens`
6. `num_underscores`
7. `num_slashes`
8. `num_query_params`
9. `num_fragments`
10. `num_at_symbols`
11. `has_ip_address`
12. `has_https`
13. `has_www`
14. `num_digits_in_domain`
15. `digit_letter_ratio`
16. `url_entropy`
17. `has_suspicious_tld`
18. `num_subdomains`
19. `has_shortener`
20. `special_char_ratio`
21. `path_entropy`
22. `has_suspicious_keywords`

## Label Definition

- `0` = **Legitimate / Benign**: URLs resembling standard web domains (e.g. `https://www.google.com/search?q=query`)
- `1` = **Phishing / Malicious**: URLs demonstrating phishing patterns (e.g. IP hostname, typosquatting, credential harvesting keywords, obfuscated parameters)

## Limitations & Purpose

- **Purpose:** Used for rapid local development, CI unit testing, and model architecture validation.
- **Limitations:** Synthetic URL samples do not capture the full diversity or noise of real-world internet traffic. Model evaluation metrics on this dataset reflect performance against synthetic patterns and should not be interpreted as real-world accuracy guarantees.
