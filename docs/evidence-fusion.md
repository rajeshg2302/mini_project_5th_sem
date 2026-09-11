# PhishGuard Nexus — Evidence Fusion Engine

## Overview

The Evidence Fusion Engine (EFE) is a deterministic, frontend-only intelligence layer
introduced in Phase 13. It fuses existing scan data — ML output, 22 URL features,
SHAP explanations, and Threat Profile dimensions — into a coherent multi-signal
threat intelligence object.

**Key Principle:** All fusion calculations are traceable to actual extracted feature values.
Zero fabricated intelligence. Zero external API calls.

---

## Evidence Sources

| Source | Data Used |
|--------|-----------|
| ML Ensemble | `risk_score`, `confidence`, `model_predictions`, `ensemble_probability` |
| Feature Extractor | All 22 URL features (`url_length`, `has_ip_address`, `url_entropy`, etc.) |
| SHAP Explainer | `shap_explanations` per feature (feature importance × deviation) |
| Threat Profile | 5-axis profile: Structure, Hostname, Obfuscation, Keyword, Security |
| Attack Indicators | Derived from feature values against known phishing technique patterns |

---

## Fusion Output Structure

```json
{
  "mlVerdict": "Phishing",
  "mlRiskScore": 87,
  "mlConfidence": 0.92,
  "mlModelAgreement": {
    "agreementLevel": "UNANIMOUS",
    "phishingVotes": 4,
    "safeVotes": 0,
    "totalModels": 4
  },
  "fusionVerdict": "Phishing",
  "evidenceStrength": {
    "score": 74,
    "level": "STRONG",
    "criticalIndicators": 2,
    "highIndicators": 1
  },
  "intelligenceScore": {
    "score": 83,
    "tier": "HIGH",
    "breakdown": { ... }
  },
  "activeAttackIndicators": [ ... ],
  "evidenceChain": [ ... ],
  "missingEvidence": [ ... ],
  "analystDecision": { ... },
  "reasoningGraph": { "nodes": [...], "edges": [...] }
}
```

---

## Evidence Strength Calculation

Evidence Strength is **independent of ML probability**. It measures how many
independent URL feature signals support the verdict.

```
evidenceStrength = normalize(
    Σ (featureWeight[i] × normalizedRisk[i])  for all 22 features
    + criticalIndicatorCount × 0.30
    + highIndicatorCount × 0.15
)
× 100 / 4.5
```

### Feature Weights (selected)

| Feature | Weight | Rationale |
|---------|--------|-----------|
| `has_ip_address` | 0.92 | Critical phishing signal |
| `has_shortener` | 0.88 | Destination concealment |
| `num_at_symbols` | 0.85 | Browser redirect attack |
| `has_suspicious_tld` | 0.80 | Disposable domain registration |
| `has_suspicious_keywords` | 0.75 | Social engineering |
| `url_entropy` | 0.70 | Machine-generated URL indicator |
| `has_https` | 0.55 | Missing HTTPS = risk |

### Evidence Strength Levels

| Score Range | Level |
|-------------|-------|
| 0–15 | WEAK |
| 16–35 | LOW |
| 36–55 | MODERATE |
| 56–75 | STRONG |
| 76–100 | OVERWHELMING |

---

## Intelligence Score

Composite of all signals:

```
intelligenceScore = (mlRiskScore × 0.40)
                  + (evidenceStrength.score × 0.35)
                  + (modelAgreementScore × 0.15)
                  + (indicatorBonus, max 10)
```

---

## Security

The EFE is a pure frontend JavaScript module:
- No external HTTP calls
- No subprocess execution
- No SSRF vectors
- All calculations are deterministic from data already present in the scan response
