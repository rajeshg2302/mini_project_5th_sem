# PhishGuard Nexus — Security Audit Logging & Event Architecture

## Overview
PhishGuard Nexus includes a persistent database-backed Security Audit Log (`audit_logs` table) that records all critical security, investigation, and configuration events.

## Database Schema (`audit_logs` table)
- `id`: Integer primary key, autoincrement
- `event_type`: String(50), indexed (`SCAN_CREATED`, `CASE_CREATED`, `STATUS_CHANGED`, `SCAN_DELETED`, `HISTORY_CLEARED`, `CASE_DELETED`, `REPORT_GENERATED`, `SETTINGS_CHANGED`)
- `action_details`: Text, human-readable action description
- `severity`: String(20), `INFO`, `WARN`, `ERROR`
- `timestamp`: DateTime, server default UTC timestamp

## API Endpoints & Components
- `GET /api/audit-logs`: Paginated audit event retrieval with search, event_type filter, and sorting.
- `POST /api/audit-logs`: Log security audit event.
- `AuditLogViewer.jsx`: Embedded React component with real-time filtering, search, and severity badge rendering.
