# PhishGuard — System Architecture & Diagrams

## 1. High-Level Architecture Overview

PhishGuard follows a decoupled, three-tier architecture comprising a React Single Page Application (SPA), a FastAPI RESTful Web Server, and an embedded Machine Learning Inference Core backed by SQLite storage.

```mermaid
graph TD
    User([User / Analyst]) <-->|HTTPS / REST API| ReactApp[React 18 SPA Frontend]
    ReactApp <-->|JSON Requests| FastAPI[FastAPI Backend Application]
    
    subgraph Backend Core
        FastAPI --> URLVal[URL Validator & Sanitizer]
        URLVal --> FeatExt[22-Feature Extractor]
        FeatExt --> MLEngine[ML Predictor Singleton]
        MLEngine --> Explainer[SHAP Explainer Matrix]
        Explainer --> DB[SQLAlchemy / SQLite Database]
    end
    
    subgraph Model Artifacts
        MLEngine <--> LR[Logistic Regression]
        MLEngine <--> DT[Decision Tree]
        MLEngine <--> RF[Random Forest]
        MLEngine <--> GB[Gradient Boosting]
        MLEngine <--> Meta[Metadata & Scaler]
    end
```

---

## 2. Data Flow Diagram (DFD)

### DFD Level 0 (Context Diagram)

```mermaid
graph LR
    User([User]) -->|Submits URL String| PhishGuardSystem((PhishGuard System))
    PhishGuardSystem -->|Returns Security Report & Risk Score| User
```

### DFD Level 1 (Process Breakdown)

```mermaid
graph TD
    User([User Input]) --> P1[1.0 Validate & Sanitize Scheme]
    P1 -->|Valid URL String| P2[2.0 Extract 22 Local Features]
    P2 -->|Feature Vector| P3[3.0 Ensemble ML Inference]
    P3 -->|Probabilities & Best Model| P4[4.0 Compute 5-Tier Risk Score]
    P4 -->|Score & Verdict| P5[5.0 Derive SHAP & Threat Profile]
    P5 -->|Security Report| P6[6.0 Store Record in SQLite]
    P6 -->|JSON Response| UI[Render React SOC Experience]
```

---

## 3. Machine Learning Pipeline Diagram

```mermaid
flowchart LR
    RawDataset[(Dataset CSV)] --> QualityAudit[Dataset Validator]
    QualityAudit --> StratifiedSplit[80/20 Stratified Split]
    StratifiedSplit --> Scaler[StandardScaler Fit]
    Scaler --> CV[5-Fold Stratified Cross-Validation]
    CV --> TrainModels[Train Verified Models]
    TrainModels --> Serializer[Joblib Serialization]
    Serializer --> ModelsFolder[(models/ Artifacts)]
```

---

## 4. Phishing URL Detection Flowchart

```mermaid
flowchart TD
    Start([Start URL Scan]) --> Input[User Submits URL]
    Input --> LengthCheck{Length <= 2048?}
    LengthCheck -- No --> RejectLen[Reject: URL Exceeds Limit]
    LengthCheck -- Yes --> SchemeCheck{Valid Scheme?}
    SchemeCheck -- Non-Web --> RejectScheme[Reject: Unsupported Scheme]
    SchemeCheck -- Web Scheme --> Extract[Extract 22 String Features]
    Extract --> Scaler[Scale Input Features]
    Scaler --> Ensemble[Run 4 Model Predictions]
    Ensemble --> WeightedAvg[Compute Weighted Ensemble Probability]
    WeightedAvg --> ScoreCalc[Calculate Risk Score 0-100]
    ScoreCalc --> TierMap{Map 5-Tier Level}
    TierMap -->|0-20| TierLow[LOW]
    TierMap -->|21-40| TierGuarded[GUARDED]
    TierMap -->|41-60| TierMed[MEDIUM]
    TierMap -->|61-80| TierHigh[HIGH]
    TierMap -->|81-100| TierCrit[CRITICAL]
    TierLow & TierGuarded & TierMed & TierHigh & TierCrit --> Save[Save to SQLite DB]
    Save --> End([Return Report Response])
```

---

## 5. Scan Processing Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as React Frontend
    participant API as FastAPI Router
    participant Validator as URL Validator
    participant Extractor as Feature Extractor
    participant ML as ML Predictor
    participant DB as SQLite DB

    User->>Frontend: Enter URL & Click Analyze
    Frontend->>API: POST /api/scan { url }
    API->>Validator: validate_url(url)
    Validator-->>API: Normalized URL string
    API->>Extractor: extract_features(normalized_url)
    Extractor-->>API: 22-Feature Dictionary
    API->>ML: predict(features)
    ML-->>API: Risk Score, Verdict, Probabilities, Best Model
    API->>DB: create_scan_record()
    DB-->>API: Saved Scan ORM Object
    API-->>Frontend: 200 OK JSON Security Report
    Frontend->>User: Render Risk Gauge, DNA, Radar & Report
```

---

## 6. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    SCAN {
        int id PK
        string url
        int risk_score
        string verdict
        float confidence
        json features
        json shap_explanations
        json model_predictions
        json top_reasons
        string best_model_name
        datetime created_at
    }
```
