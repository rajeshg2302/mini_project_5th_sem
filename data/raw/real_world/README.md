# PhishGuard — Real-World Phishing URL Dataset Support

This directory is designated for real-world phishing URL datasets (e.g., PhishTank feeds, UNB ISCX URL-2016 dataset, Kaggle Phishing Datasets).

## Dataset Placement Instructions

To train or evaluate PhishGuard models on a real-world URL dataset:

1. Obtain a CSV dataset from a reputable cybersecurity research source (see sources below).
2. Ensure the CSV file contains a column for raw URL strings (`url`) and target labels (`label` or `result`).
3. Place the CSV file in this directory:
   `data/raw/real_world/phishing_dataset.csv`
4. Set the environment configuration variable:
   `DATASET_MODE=real_world`
5. Run the validation and training pipeline:
   ```bash
   cd phishguard/ml
   python dataset_validator.py
   python evaluate_phase2.py
   ```

## Recommended Publicly Available Research Datasets

1. **PhishTank Live Feed**
   - **Source:** [PhishTank by Cisco Talos](https://www.phishtank.com/)
   - **License:** Public / Open Threat Data
   - **Description:** Real-time verified phishing URLs updated hourly.

2. **UNB ISCX URL-2016 Dataset**
   - **Source:** [University of New Brunswick Canadian Institute for Cybersecurity](https://www.unb.ca/cic/datasets/url-2016.html)
   - **Description:** Benchmark cybersecurity research dataset comprising benign and phishing URLs.

3. **Kaggle Phishing Websites Dataset**
   - **Source:** [Kaggle Cybersecurity Repository](https://www.kaggle.com/)
   - **Description:** Structured collection of URL features and raw phishing/legitimate website addresses.

## Fallback & Safety Behavior

If `DATASET_MODE=real_world` is set but no real-world dataset file is present in `data/raw/real_world/phishing_dataset.csv`, the pipeline cleanly falls back to `DATASET_MODE=synthetic` and logs a prominent warning. No fake dataset files are generated.
