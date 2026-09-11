# PhishGuard Security Audit

## Zero-Network Local Feature Extraction (SSRF Prevention)

PhishGuard analyzes submitted website addresses strictly as static URL character strings. 

- **No HTTP/HTTPS Fetching:** The backend **never** connects to target URLs or downloads remote HTML, JavaScript, or resource files.
- **SSRF Prevention:** Because zero outbound sockets are opened during extraction, malicious users cannot exploit PhishGuard to probe internal networks, metadata services (`169.254.169.254`), or loopback interfaces.

## Input Validation & Sanitization (`url_validator.py`)

1. **Scheme Validation:** Only `http://` and `https://` schemes are accepted. Non-web schemes (`javascript:`, `data:`, `file:`, `mailto:`, `about:`, `gopher:`) are rejected immediately with a `400 Bad Request` validation error.
2. **Length Clamping:** Maximum allowable URL string length is strictly enforced at 2048 characters.
3. **Control Characters:** Embedded control characters (`\x00` - `\x1f`, `\x7f`) and whitespace characters are sanitized and rejected.
4. **Error Masking:** Internal stack traces and file paths are stripped from API exception responses in production mode to prevent information disclosure.

## Rate Limiting & Abuse Protection

- The API uses lightweight in-memory request validation.
- SQL query parameters are bound safely through SQLAlchemy ORM to prevent SQL injection.
- CORS origins are restricted to configured development origins (`localhost:5173`, `127.0.0.1:5173`).
