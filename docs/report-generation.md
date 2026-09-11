# PhishGuard X — Report Generation Subsystem Documentation

## Overview
The Report Generation subsystem creates official, publication-ready PDF threat investigation reports and evidence export bundles from persistent case data.

## PDF Report Structure (18 Mandatory Audit Sections)

1. **Case Information**: Case Number (PG-XXXXX), Status, Created/Updated At, Assigned Analyst
2. **Target URL**: Full analyzed URL string
3. **Timestamp**: Scan and case creation timestamps
4. **Verdict**: Primary classification verdict (`Safe`, `Suspicious`, `Phishing`)
5. **Risk Score**: Score out of 100
6. **Risk Level**: Severity level (`CRITICAL`, `HIGH`, `MEDIUM`, `GUARDED`, `LOW`)
7. **ML Prediction**: Primary ML verdict
8. **Probability**: Model ensemble confidence percentage
9. **Model Information**: Selected primary model & verified model list
10. **22 Feature Analysis**: Snapshot grid of all 22 extracted features
11. **Threat Dimensions**: 5 structural threat dimension summaries
12. **Severity Matrix**: Key indicator detection status
13. **Risk Factors**: Primary observed risk indicators
14. **Recommendations**: Dynamic action guidelines
15. **Analyst Notes**: Investigator notes recorded in database
16. **Investigation Status**: Workflow state (`NEW`, `INVESTIGATING`, `CONFIRMED THREAT`, `FALSE POSITIVE`, `RESOLVED`)
17. **Analyst Assessment**: Synthesized analytical assessment text
18. **Resolution**: Final disposition and resolution notes

## Security & Sanitization Controls
- **Secrets Sanitization**: Reports explicitly sanitize passwords, API keys, database credentials, environment variables, stack traces, and internal server paths.
- **Forensic Integrity**: Generated directly from stored database records without mock values.
