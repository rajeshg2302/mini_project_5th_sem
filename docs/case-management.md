# PhishGuard X — SOC Case Management Architecture

## Overview
The PhishGuard X SOC Case Management system elevates PhishGuard from a single URL scanner into a persistent security operations center (SOC) threat investigation platform.

## Key Features
1. **Persistent Database Storage**: Threat investigation cases are backed by the SQLite database `cases` table.
2. **Sequential Case Numbering**: Cases follow the official SOC case identifier standard `PG-XXXXX` (`PG-00001`, `PG-00002`).
3. **Forensic Integrity**: Modifying a case status, analyst notes, or assessment does **NOT** alter the underlying `scans` table.
4. **Scan History Survival**: Deleting an investigation case record removes the entry from the `cases` table but leaves the original `scans` record intact.
5. **High-Risk Case Queue**: Active cases (`NEW`, `INVESTIGATING`) with a risk score ≥ 70 are highlighted in the SOC queue.

## API Endpoints
- `POST /api/cases`: Create a new case or retrieve an existing case for the same `scan_id`.
- `GET /api/cases`: Retrieve paginated cases with filtering by status, severity, search, and sorting (`newest`, `oldest`, `highest_risk`, `lowest_risk`).
- `GET /api/cases/stats`: Aggregate SOC case statistics.
- `GET /api/cases/{case_id}`: Retrieve case details by ID.
- `PUT /api/cases/{case_id}`: Update case status, analyst notes, assessment, and resolution disposition.
- `POST /api/cases/{case_id}/reopen`: Reopen resolved cases back to `INVESTIGATING`.
- `DELETE /api/cases/{case_id}`: Delete case record without affecting original scan history.
- `GET /api/cases/{case_id}/report`: Download PDF security report or JSON report audit structure.
