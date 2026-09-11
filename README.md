# PhishGuard — AI-Based Phishing Website Detection Using Machine Learning

> **Academic Mini Project — B.Tech AIML 5th Semester**  
> *A Zero-Network, Explainable AI Cyber Threat Analysis System*

---

> [!IMPORTANT]  
> **Scientific Academic Disclaimer:**  
> The reported machine learning model metrics in this documentation are evaluated on the project's synthetic development dataset ($N=1,200$) and **should not be interpreted as real-world phishing detection accuracy**. While PhishGuard includes architecture configuration support for real-world datasets (e.g., PhishTank, UNB ISCX URL-2016), formal real-world model evaluation was not conducted in this implementation.

---

## Overview

**PhishGuard** is an advanced, privacy-preserving phishing website detection system and Security Operations Center (SOC) visual dashboard. It analyzes structural, lexical, host, and entropy features of incoming web URLs using a 22-feature local feature extraction engine and a weighted multi-model machine learning ensemble (Logistic Regression, Decision Tree, Random Forest, Gradient Boosting).

PhishGuard calculates real-time threat risk scores ($0-100$), maps targets into 5 risk tiers (`LOW`, `GUARDED`, `MEDIUM`, `HIGH`, `CRITICAL`), and generates explainable AI (XAI) risk factors without making outbound HTTP requests or crawling remote web content.

---

## Key Features

- 🔍 **Zero-Network 22-Feature URL Scanner** — Local structural, lexical, host, and Shannon entropy calculations in $\sim 12\text{ ms}$.
- 🤖 **Multi-Model Weighted Ensemble** — Evaluates predictions across 4 scikit-learn models (Logistic Regression, Decision Tree, Random Forest, Gradient Boosting).
- 🎯 **5-Tier Dynamic Risk Score ($0-100$)** — Risk boundary classification (`LOW`, `GUARDED`, `MEDIUM`, `HIGH`, `CRITICAL`).
- 🧠 **Explainable AI (XAI)** — Plain-language reason strings and feature deviation scoring explaining why a URL is flagged.
- 🛡️ **Derived Threat Profile Radar** — Visual 5-dimension threat breakdown (URL Structure, Hostname/IP, Obfuscation, Keywords, Security Indicators).
- 🧬 **URL DNA Fingerprint** — Matrix visualization of extracted URL characteristics.
- ⏱️ **Interactive Pipeline Timeline** — Step-by-step visual scan execution sequence.
- 💡 **Dynamic Security Guidance** — Context-aware, risk-tiered actionable mitigation recommendations.
- 📚 **Security Education Panel** — Interactive learning module on common phishing tactics and social engineering.
- ⚖️ **Dual Scan Comparison Tool** — Side-by-side URL feature and metric differential analysis (`/compare`).
- 🎮 **Model Simulator & Weight Adjuster** — Interactive ML ensemble weight tweaking and hypothesis testing.
- 📊 **Executive Analytics & History** — SQLite-backed historical scan log search, filtering, and threat distribution analytics.

---

## System Architecture

```
User (Browser)
  │
  ▼
React 18 Frontend SPA (Vite + Recharts)
  │ (HTTP REST / JSON)
  ▼
FastAPI Backend API (Python 3.10+)
  │
  ├─► URL Sanitization & SSRF Safety (url_validator.py)
  ├─► 22-Feature Extractor (feature_extractor.py)
  ├─► ML Ensemble Predictor (ml_predictor.py: LR, DT, RF, GB)
  ├─► XAI Explainer Engine (explainer.py)
  └─► Database ORM Storage (SQLAlchemy + SQLite)
```

For complete architectural diagrams (DFD Level 0/1, Sequence, Flowchart, ERD), see [docs/system-architecture.md](docs/system-architecture.md).

---

## Technology Stack

| Layer | Technologies & Libraries Used |
|---|---|
| **Frontend** | React 18, Vite, Recharts, Lucide React, Framer Motion, Vanilla CSS |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Pydantic, SQLAlchemy |
| **Machine Learning** | Scikit-Learn, Pandas, NumPy, Joblib |
| **Database** | SQLite3 |
| **Testing** | Python `unittest`, Automated API & Feature Parity Tests (38/38 Passing) |

---

## Machine Learning Models & Ensemble Strategy

PhishGuard employs 4 supervised classification models trained on normalized 22-feature URL vectors:

1. **Random Forest Classifier** (Weight: `0.35`) — Bagging ensemble of decision trees.
2. **Gradient Boosting Classifier** (Weight: `0.30`) — Sequential boosting over pseudo-residuals.
3. **Logistic Regression** (Weight: `0.20`) — Linear probability baseline using `StandardScaler`.
4. **Decision Tree Classifier** (Weight: `0.15`) — Non-linear decision boundary model.

$$\text{Probability}_{\text{ensemble}} = 0.35 \cdot P_{\text{RF}} + 0.30 \cdot P_{\text{GB}} + 0.20 \cdot P_{\text{LR}} + 0.15 \cdot P_{\text{DT}}$$

---

## Dataset & Evaluation Results

### Dataset Configuration
- **Development Dataset:** 1,200 synthetic balanced samples (600 Legitimate, 600 Phishing).
- **Audit & Validation:** 0 malformed URLs, 0 invalid labels, 0 missing values, 52 audited duplicates.
- **Real-World Data Support:** Pipeline architecture supports loading PhishTank / UNB ISCX datasets via `DATASET_MODE=real_world`.

### Holdout & Cross-Validation Metrics (Phase 5 Verification)

| Model | Holdout Acc | Precision | Recall | F1-Score | ROC-AUC | 5-Fold CV F1 |
|---|---|---|---|---|---|---|
| **Logistic Regression** | `1.000` | `1.0000` | `1.0000` | `1.0000` | `1.0000` | `1.0000 ± 0.0000` |
| **Random Forest** | `1.000` | `1.0000` | `1.0000` | `1.0000` | `1.0000` | `1.0000 ± 0.0000` |
| **Gradient Boosting** | `0.850` | `0.8043` | `0.9250` | `0.8605` | `0.8868` | `0.9990 ± 0.0021` |
| **Decision Tree** | `0.850` | `0.8043` | `0.9250` | `0.8605` | `0.8500` | `0.9979 ± 0.0026` |

*Note: Holdout splits evaluate $N=240$ samples ($80/20$ stratified split). For detailed analysis, see [docs/results.md](docs/results.md).*

---

## Screenshots Placeholder

Visual artifacts and screenshots captured from the live application are indexed in [docs/screenshot-checklist.md](docs/screenshot-checklist.md).

```
[ Dashboard Screenshots Placeholder ]
[ Threat Profile Radar & URL DNA Matrix Placeholder ]
[ Scan Comparison & Model Simulator Placeholder ]
```

---

## Installation & Quick Start

### Prerequisites
- Python 3.10+ installed
- Node.js 18+ and `npm` installed

### 1. Setup Backend & Train Models
```bash
# Navigate to backend directory
cd backend

# Create & activate virtual environment (optional)
python -m venv venv
# Windows: venv\Scripts\activate | Unix: source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Generate synthetic dataset & train ML models
cd ../ml
python generate_dataset.py
python train.py
cd ../backend

# Launch FastAPI backend server
python run.py
```
*Backend runs at `http://localhost:8000`. OpenAPI Swagger docs available at `http://localhost:8000/docs`.*

### 2. Setup & Launch Frontend
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend runs at `http://localhost:5173`.*

---

## Usage Guide

1. Open `http://localhost:5173` in your web browser.
2. Enter target URL into the **Smart Scanner** input (e.g., `http://paypal-security-update.account-verification-login.com/auth`).
3. Click **Scan URL**.
4. View the real-time **Risk Score** ($0-100$), **Threat Verdict**, **Top Risk Factors**, **Threat Profile Radar**, and **URL DNA**.
5. Explore the **Scan Comparison** (`/compare`), **AI Model Lab**, **Enhanced Simulator**, **History**, and **Analytics** views.

For full usage instructions, see [docs/user-guide.md](docs/user-guide.md).

---

## API Reference Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server and ML model status |
| `POST` | `/api/scan` | Execute 22-feature ML scan & threat analysis |
| `GET` | `/api/history` | Paginated scan history with filtering & search |
| `GET` | `/api/report/{id}` | Complete scan report by ID |
| `DELETE` | `/api/history/{id}` | Delete scan record |
| `GET` | `/api/analytics` | Cumulative threat analytics & risk distribution |
| `GET` | `/api/models/compare` | Multi-model evaluation metrics & metadata |

For complete JSON schemas and parameters, see [docs/api-reference.md](docs/api-reference.md).

---

## Security Protections

- **Zero Remote Network Fetching:** PhishGuard never makes HTTP requests to submitted URLs, eliminating malware execution risks.
- **SSRF Prevention:** Rejects `localhost`, `127.0.0.1`, private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and non-HTTP pseudo-schemes (`file://`, `javascript:`).
- **DoS Protection:** Enforces a 2,048-character length boundary and strips non-printable control characters.
- **Database Safety:** SQL injection protected via SQLAlchemy parameterized queries.

---

## Automated Testing

Run the full automated backend test suite (38 unit and integration tests):

```bash
python -m unittest discover -s tests
```

To run frontend build validation:
```bash
cd frontend && npm run build
```

---

## Documentation Index

The complete academic documentation suite is available in `docs/`:

- 📋 [Project Overview](docs/project-overview.md)
- 🏗️ [System Architecture](docs/system-architecture.md)
- 🔬 [Methodology](docs/methodology.md)
- 🤖 [Machine Learning Pipeline](docs/machine-learning.md)
- 📊 [Dataset Documentation](docs/dataset.md)
- ⚙️ [Feature Engineering (22 Features)](docs/feature-engineering.md)
- 🛡️ [Threat Analysis & Risk Scoring](docs/threat-analysis.md)
- 🧪 [Testing & Quality Audit](docs/testing.md)
- 🔒 [Security Safeguards](docs/security.md)
- 📈 [Results Documentation](docs/results.md)
- ⚠️ [System Limitations](docs/limitations.md)
- 🔮 [Future Scope](docs/future-scope.md)
- 💻 [Installation Guide](docs/installation.md)
- 📖 [User Guide](docs/user-guide.md)
- 📡 [API Reference](docs/api-reference.md)
- 🎓 [Viva Defense Preparation (40 Q&A)](docs/viva-preparation.md)
- 📄 [Final Report Outline](docs/final-report-outline.md)
- 📸 [Screenshot Checklist](docs/screenshot-checklist.md)

---

## Academic Disclaimer

This project is created for educational and academic purposes as part of the 5th-Semester B.Tech AIML Mini Project. Model performance metrics reflect evaluation on a synthetic development dataset ($N=1,200$).
