# PhishGuard Nexus — Analyst Decision Engine

## Overview

The Analyst Decision Engine generates structured, contextual guidance for security analysts
from existing scan evidence. It operates entirely within the browser — no external AI API,
no LLM, no remote calls.

## Decision Logic

```
Input: Scan Report + Evidence Fusion Result
Output: Recommended Action + Rationale + Priority Steps
```

### Recommended Actions

| Condition | Action |
|-----------|--------|
| ML Phishing + Fusion Phishing | BLOCK & REPORT |
| ML Safe + Fusion Safe | ALLOW (MONITOR) |
| Either verdict Suspicious | INVESTIGATE |
| ML ≠ Fusion verdict | ANALYST REVIEW REQUIRED |

### Urgency Levels

| Condition | Urgency |
|-----------|---------|
| Both agree Phishing | IMMEDIATE |
| Suspicious disagreement | ELEVATED |
| Both agree Safe | LOW |

## Content Sections

1. **WHY IS THIS URL FLAGGED?** — Attack indicators mapped to feature values
2. **SUPPORTING EVIDENCE** — Top risk and protective features
3. **WHAT SHOULD BE INVESTIGATED NEXT?** — Priority-ordered action items
4. **CONTEXTUAL RECOMMENDATIONS** — Feature-triggered security guidance
5. **MISSING EVIDENCE** — Transparent gaps in analysis scope
6. **LIMITATIONS** — Honest documentation of analysis boundaries

## Security Constraints

- No LLM calls — content generated from deterministic rules
- No external API calls — all data from scan response
- No credentials or user data collection
- All recommendations traceable to specific features
