# PhishGuard — Dataset Directory

## Directory Structure

```
data/
├── raw/           # Place your raw dataset CSV files here
├── processed/     # Auto-generated: preprocessed train/test splits
└── README.md      # This file
```

## Expected Dataset Format

The pipeline expects a **CSV file** with at minimum two columns:

| Column | Type   | Description                                       |
|--------|--------|---------------------------------------------------|
| `url`  | string | The full URL (e.g., `https://www.google.com`)     |
| `label`| string or int | `legitimate` / `phishing`, OR `0` / `1`   |

### Example

```csv
url,label
https://www.google.com/search?q=python,legitimate
http://192.168.1.1/login/verify.html,phishing
https://github.com/user/repo,legitimate
http://paypa1-secure.tk/account,phishing
```

### Label Encoding

The pipeline automatically converts labels:
- `legitimate`, `benign`, `good`, `safe`, `0` → **0** (legitimate)
- `phishing`, `malicious`, `bad`, `1` → **1** (phishing)

## Recommended Datasets

### Option 1: Kaggle — Phishing Site URLs (Recommended for beginners)

- **Name**: *Phishing Site URLs*
- **URL**: https://www.kaggle.com/datasets/taruntiwarihp/phishing-site-urls
- **Format**: CSV with columns `URL`, `Label` (values: `good`, `bad`)
- **Size**: ~550K URLs
- **How to use**:
  1. Download `phishing_site_urls.csv`
  2. Place it in `data/raw/phishing_site_urls.csv`
  3. Run the pipeline — it will auto-detect the column names

### Option 2: UCI — Phishing Websites Dataset

- **Name**: *Phishing Websites Dataset*
- **URL**: https://archive.ics.uci.edu/dataset/327/phishing+websites
- **Note**: This dataset contains pre-extracted features, NOT raw URLs.
  It is **not suitable** for this pipeline, which extracts features itself.

### Option 3: PhiUSIIL Phishing URL Dataset

- **Name**: *PhiUSIIL Phishing URL Dataset*
- **URL**: https://www.kaggle.com/datasets/mohamedhanyyy/phiusiil-phishing-url-dataset
- **Size**: ~235K URLs
- **How to use**: Similar to Option 1

### Option 4: Provided Sample Dataset

A small sample dataset (`sample_urls.csv`, ~100 URLs) is included in
`data/raw/` for pipeline validation and testing. This sample is NOT
sufficient for production-quality model training — use one of the
datasets above for real training.

## After Placing the Dataset

Run the training pipeline:

```bash
cd phishguard
python train_pipeline.py --data data/raw/YOUR_FILE.csv
```

Or use the sample dataset:

```bash
python train_pipeline.py --data data/raw/sample_urls.csv
```
