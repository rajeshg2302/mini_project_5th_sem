"""
PhishGuard — URL Validation Service

Validates and normalizes submitted URLs before feature extraction.

Security policy:
  - Only http:// and https:// schemes are accepted.
  - The URL is analysed as a string — no network requests are made to it.
  - Private/reserved IP addresses are accepted as analysis targets
    (they are valid phishing-pattern indicators) but are NOT fetched.
  - All validation is deterministic and stateless.
"""

import re
from urllib.parse import urlparse, urlunparse
from typing import Tuple


# ─── Error Types ─────────────────────────────────────────────────

class URLValidationError(Exception):
    """Raised when URL validation fails."""
    pass


# ─── Constants ───────────────────────────────────────────────────

ALLOWED_SCHEMES = {"http", "https"}

# Regex for a bare IP address (used for domain validation)
_IPV4_RE = re.compile(r"^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$")

# Characters that are always invalid anywhere in a URL
_OBVIOUSLY_INVALID_RE = re.compile(r"[\x00-\x1f\x7f\s<>\"{}|\\^`]")


# ─── Helpers ─────────────────────────────────────────────────────

def _is_valid_ip(host: str) -> bool:
    """Return True if host looks like a valid IPv4 address."""
    m = _IPV4_RE.match(host)
    if not m:
        return False
    return all(0 <= int(g) <= 255 for g in m.groups())


def _is_valid_hostname(host: str) -> bool:
    """
    Return True if host is a plausible hostname or IP address.

    Accepts:
      - IPv4 addresses (any octet value — scanning private ranges is valid)
      - Hostnames that contain at least one dot OR are recognised as TLD-only
        edge-cases (single-label, e.g. 'localhost')
    """
    if not host:
        return False
    # Strip port
    host = host.split(":")[0].strip("[]")
    if not host:
        return False

    if _is_valid_ip(host):
        return True

    # Hostname labels: letters, digits, hyphens; labels separated by dots
    label_re = re.compile(r"^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$")
    labels = host.split(".")
    if not all(label_re.match(lbl) for lbl in labels if lbl):
        return False
    return True


# ─── Public API ──────────────────────────────────────────────────

def validate_url(url: str) -> str:
    """
    Validate and normalize a URL string.

    Steps:
      1. Strip whitespace.
      2. Reject empty or excessively long input.
      3. Reject obviously invalid characters.
      4. Add http:// scheme if missing.
      5. Reject unsupported schemes (anything other than http/https).
      6. Parse and validate netloc/hostname.
      7. Return the normalized URL string.

    Parameters
    ----------
    url : str
        Raw URL submitted by the user.

    Returns
    -------
    str
        Normalized URL (lowercase scheme + host, original path/query/fragment).

    Raises
    ------
    URLValidationError
        With a human-readable message describing the specific problem.
    """
    if not isinstance(url, str):
        raise URLValidationError("URL must be a string.")

    url = url.strip()

    # 1. Empty check
    if not url:
        raise URLValidationError("URL cannot be empty.")

    # 2. Length check
    if len(url) > 2048:
        raise URLValidationError(
            f"URL is too long ({len(url)} characters). Maximum allowed is 2048."
        )

    # 3. Reject control characters / whitespace embedded in the URL
    if _OBVIOUSLY_INVALID_RE.search(url):
        raise URLValidationError(
            "URL contains invalid characters (control characters or whitespace)."
        )

    # Reject non-web pseudo-schemes even if missing '://' (e.g. javascript:alert(1), data:text/html, file:/path)
    url_lower = url.lower()
    dangerous_schemes = ("javascript:", "data:", "file:", "mailto:", "about:", "vbscript:")
    if url_lower.startswith(dangerous_schemes):
        raise URLValidationError("Unsupported URL scheme. Only http and https are accepted.")

    # 4. Add scheme if missing
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+\-.]*://", url):
        url = "http://" + url

    # 5. Parse
    try:
        parsed = urlparse(url)
    except Exception:
        raise URLValidationError("URL could not be parsed. Please check the format.")

    # 6. Scheme check
    scheme = parsed.scheme.lower()
    if scheme not in ALLOWED_SCHEMES:
        raise URLValidationError(
            f"Unsupported URL scheme '{parsed.scheme}'. "
            f"Only http and https are accepted."
        )

    # 7. Netloc / hostname check
    netloc = parsed.netloc
    if not netloc:
        raise URLValidationError(
            "URL has no domain or host component. "
            "Example of a valid URL: https://example.com"
        )

    # Strip userinfo (everything before @) for hostname validation
    host_part = netloc.split("@")[-1]

    if not _is_valid_hostname(host_part):
        raise URLValidationError(
            f"The URL host '{host_part}' does not appear to be a valid "
            "hostname or IP address."
        )

    # 8. Build normalized URL: lowercase scheme + host, preserve path/query/fragment as-is
    host_lower = host_part.lower()
    # Reconstruct netloc (preserve userinfo if present, lowercase host)
    if "@" in netloc:
        userinfo = netloc.split("@")[0]
        port_suffix = ""
        if ":" in host_part.split(".")[-1]:
            # port included in host_part
            host_lower, port_suffix = host_part.rsplit(":", 1)
            port_suffix = ":" + port_suffix
        normalized_netloc = f"{userinfo}@{host_lower}{port_suffix}"
    else:
        # Check if port is included
        bare_host = host_part.split(":")[0]
        port_part = host_part[len(bare_host):]  # ':8080' or ''
        normalized_netloc = bare_host.lower() + port_part

    normalized = urlunparse((
        scheme,
        normalized_netloc,
        parsed.path,
        parsed.params,
        parsed.query,
        parsed.fragment,
    ))

    return normalized


def get_normalized_url(url: str) -> Tuple[str, str]:
    """
    Validate and return (normalized_url, original_url).

    Convenience wrapper used by the scanner router to preserve
    the original submission alongside the normalized form.

    Raises URLValidationError on invalid input.
    """
    normalized = validate_url(url)
    return normalized, url.strip()
