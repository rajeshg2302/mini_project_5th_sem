# PhishGuard Automated Testing Guide

## Test Suite Structure

PhishGuard maintains automated unit and integration tests under `phishguard/tests/`:

- **`tests/test_pipeline.py`** (21 tests): Integration tests covering feature parity, model registry safety, prediction schemas, non-retraining guarantees, and singleton loading.
- **`tests/test_phase5.py`** (13 tests): Security audit tests covering scheme validation, length limits, control character filtering, 5-tier risk boundaries (0–20 LOW to 81–100 CRITICAL), SQLite transaction safety, dataset quality auditing, model metadata validation, and zero-network isolation.

## Running Tests

```bash
# Run complete test suite (34 tests)
python -m unittest discover -s tests
```

## Coverage Highlights

1. **Feature Extractor Parity:** Verifies identical 22-feature vector outputs between ML module and FastAPI backend.
2. **SSRF & Network Isolation:** Simulates network blocking (`socket.getaddrinfo`) during feature extraction to guarantee zero network traffic.
3. **Risk Boundary Coverage:** Tests boundary values `0, 20, 21, 40, 41, 60, 61, 80, 81, 100` to verify boundary level mapping.
4. **Database & API Integration:** Verifies SQLite ORM record creation and cleanup.
