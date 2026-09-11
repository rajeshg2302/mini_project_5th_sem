# PhishGuard Dataset Guide & Quality Audit

## Supported Dataset Modes

PhishGuard supports two dataset modes via configuration:

```bash
# Enable synthetic development dataset (default)
DATASET_MODE=synthetic

# Enable real-world research dataset
DATASET_MODE=real_world
```

## Synthetic Development Dataset (`data/raw/synthetic/`)

- **File Path:** `data/raw/synthetic/phishing_dataset.csv`
- **Total Samples:** 1,200
- **Class Balance:** 600 Legitimate (50.0%), 600 Phishing (50.0%)
- **Purpose:** Fast offline development, CI integration testing, and initial model verification.

## Real-World Dataset Integration (`data/raw/real_world/`)

To evaluate PhishGuard on a real-world phishing dataset:

1. Obtain a CSV dataset from PhishTank, UNB ISCX URL-2016, or Kaggle Cybersecurity Repositories.
2. Place the CSV file in:
   `data/raw/real_world/phishing_dataset.csv`
3. Execute the automated validator and evaluation script:
   ```bash
   python ml/dataset_validator.py
   python ml/evaluate_phase2.py
   ```

## Dataset Quality Audit (`ml/dataset_validator.py`)

Automated data quality checks inspect:
- Missing value counts per column
- Duplicate URL occurrences
- Duplicate feature vector occurrences
- Invalid/unknown label string representations
- Class imbalance ratios
- Malformed URL syntax errors

Audit reports are logged to [data/dataset_quality_report.json](file:///d:/mini%20project%205th%20sem/phishguard/data/dataset_quality_report.json).
