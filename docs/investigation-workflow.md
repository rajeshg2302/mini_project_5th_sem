# PhishGuard X — Analyst Investigation Workflow

## Workflow Architecture
```
URL SCAN
   ↓
SCAN RESULT
   ↓
CREATE INVESTIGATION (PG-XXXXX)
   ↓
CASE CREATED
   ↓
EVIDENCE REVIEW (22 Features, Model Decision, Threat Matrix)
   ↓
ANALYST NOTES & ASSESSMENT (Character-limit protected text areas)
   ↓
STATUS MANAGEMENT (NEW → INVESTIGATING → CONFIRMED THREAT / FALSE POSITIVE / RESOLVED)
   ↓
RESOLUTION (Disposition rationale & mitigation notes)
   ↓
SECURITY REPORT (PDF / JSON Export)
```

## Step-by-Step Investigation Guide

1. **Initiate Investigation**:
   - Perform a URL scan or navigate to Scan History.
   - Click **[ INVESTIGATE ]** or **[ CREATE CASE ]**.
   - A persistent case record `PG-XXXXX` is created automatically.

2. **Analyze Forensic Evidence**:
   - Review top threat factors and model probability.
   - Expand the **Forensic Evidence Chain** to audit 22 extracted URL features, threat severity matrix, and security scorecard.
   - Examine individual model predictions in the **Model Decision Center**.

3. **Formulate Analyst Assessment & Notes**:
   - Record technical findings in the **Analyst Assessment** field.
   - Record WHOIS details, IP geolocation, or registrar notes in **Analyst Notes**.
   - Form fields include live character counting and instant validation feedback.

4. **Manage Case Status & Disposition**:
   - Select status: `NEW`, `INVESTIGATING`, `CONFIRMED THREAT`, `FALSE POSITIVE`, or `RESOLVED`.
   - Select resolution disposition and add mitigation action notes.
   - Save updates to persist directly to SQLite.

5. **Generate Threat Report & Export**:
   - Click **[ GENERATE SECURITY REPORT (PDF) ]** to download an official ReportLab PDF report containing all 18 audit sections.
   - Click **[ EXPORT CASE (JSON) ]** to export evidence JSON blob.
