"""
PhishGuard Feature Extractor
Extracts 22 phishing-related features from a URL string.
All features are extracted purely from the URL — no network requests needed.
"""

import re
import math
from urllib.parse import urlparse, parse_qs
from typing import Dict, List


# Known URL shortening services
SHORTENER_DOMAINS = {
    'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd',
    'buff.ly', 'adf.ly', 'bit.do', 'mcaf.ee', 'su.pr', 'db.tt',
    'qr.ae', 'lnkd.in', 'cutt.ly', 'rb.gy', 'shorturl.at', 'v.gd',
    'tiny.cc', 'bl.ink', 'shorte.st', 'cli.gs', 'x.co', 'prettylinkpro.com',
    'scrnch.me', 'filourl.com', 'vzturl.com', 'qr.net', '1url.com',
    'tweez.me', 'v.gd', 'tr.im', 'link.zip.net'
}

# Suspicious TLDs commonly used in phishing
SUSPICIOUS_TLDS = {
    '.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.work',
    '.click', '.link', '.info', '.online', '.site', '.club',
    '.buzz', '.surf', '.rest', '.fit', '.zip', '.mov', '.review',
    '.country', '.stream', '.download', '.racing', '.bid',
    '.accountant', '.cricket', '.date', '.faith', '.loan',
    '.party', '.science', '.trade', '.win', '.pw', '.cc'
}

# Suspicious keywords often found in phishing URLs
SUSPICIOUS_KEYWORDS = [
    'login', 'signin', 'sign-in', 'verify', 'verification', 'secure',
    'account', 'update', 'bank', 'paypal', 'ebay', 'amazon', 'apple',
    'microsoft', 'google', 'facebook', 'netflix', 'confirm', 'password',
    'credential', 'suspend', 'restrict', 'unlock', 'validate', 'wallet',
    'billing', 'invoice', 'payment', 'transfer', 'alert', 'urgent',
    'expire', 'reactivate', 'recover', 'reset', 'authenticate'
]

# Feature names in order — this must match the training pipeline
FEATURE_NAMES = [
    'url_length',
    'domain_length',
    'path_length',
    'num_dots',
    'num_hyphens',
    'num_underscores',
    'num_slashes',
    'num_query_params',
    'num_fragments',
    'num_at_symbols',
    'has_ip_address',
    'has_https',
    'has_www',
    'num_digits_in_domain',
    'digit_letter_ratio',
    'url_entropy',
    'has_suspicious_tld',
    'num_subdomains',
    'has_shortener',
    'special_char_ratio',
    'path_entropy',
    'has_suspicious_keywords',
]


def calculate_entropy(text: str) -> float:
    """Calculate Shannon entropy of a string."""
    if not text:
        return 0.0
    freq = {}
    for char in text:
        freq[char] = freq.get(char, 0) + 1
    length = len(text)
    entropy = -sum(
        (count / length) * math.log2(count / length)
        for count in freq.values()
    )
    return round(entropy, 4)


def is_ip_address(domain: str) -> bool:
    """Check if the domain is an IP address (IPv4 or IPv6)."""
    # IPv4 pattern
    ipv4_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
    # IPv6 pattern (simplified)
    ipv6_pattern = r'^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$'
    # Hex-encoded IP
    hex_pattern = r'^0x[0-9a-fA-F]+$'

    domain_clean = domain.strip('[]')
    return bool(
        re.match(ipv4_pattern, domain_clean) or
        re.match(ipv6_pattern, domain_clean) or
        re.match(hex_pattern, domain_clean)
    )


def extract_features(url: str) -> Dict[str, float]:
    """
    Extract 22 phishing-detection features from a URL string.
    
    Returns a dictionary mapping feature names to their values.
    All features are numerical (int or float).
    """
    # Ensure URL has a scheme for proper parsing
    url_lower = url.lower().strip()
    if not url_lower.startswith(('http://', 'https://', 'ftp://')):
        url_for_parse = 'http://' + url_lower
    else:
        url_for_parse = url_lower

    try:
        parsed = urlparse(url_for_parse)
    except Exception:
        parsed = urlparse('http://invalid.url')

    domain = parsed.netloc or ''
    path = parsed.path or ''
    query = parsed.query or ''
    fragment = parsed.fragment or ''
    scheme = parsed.scheme or ''

    # Remove port from domain if present
    domain_no_port = domain.split(':')[0] if ':' in domain and not domain.startswith('[') else domain

    # --- Feature 1: url_length ---
    url_length = len(url)

    # --- Feature 2: domain_length ---
    domain_length = len(domain_no_port)

    # --- Feature 3: path_length ---
    path_length = len(path)

    # --- Feature 4: num_dots ---
    num_dots = url.count('.')

    # --- Feature 5: num_hyphens ---
    num_hyphens = domain_no_port.count('-')

    # --- Feature 6: num_underscores ---
    num_underscores = url.count('_')

    # --- Feature 7: num_slashes ---
    num_slashes = path.count('/')

    # --- Feature 8: num_query_params ---
    try:
        num_query_params = len(parse_qs(query))
    except Exception:
        num_query_params = 0

    # --- Feature 9: num_fragments ---
    num_fragments = 1 if fragment else 0

    # --- Feature 10: num_at_symbols ---
    num_at_symbols = url.count('@')

    # --- Feature 11: has_ip_address ---
    has_ip = 1 if is_ip_address(domain_no_port) else 0

    # --- Feature 12: has_https ---
    has_https = 1 if scheme == 'https' else 0

    # --- Feature 13: has_www ---
    has_www = 1 if domain_no_port.startswith('www.') else 0

    # --- Feature 14: num_digits_in_domain ---
    num_digits_in_domain = sum(1 for c in domain_no_port if c.isdigit())

    # --- Feature 15: digit_letter_ratio ---
    letters = sum(1 for c in url if c.isalpha())
    digits = sum(1 for c in url if c.isdigit())
    digit_letter_ratio = round(digits / max(letters, 1), 4)

    # --- Feature 16: url_entropy ---
    url_entropy = calculate_entropy(url)

    # --- Feature 17: has_suspicious_tld ---
    tld_match = re.search(r'\.[a-z]{2,}$', domain_no_port)
    tld = tld_match.group(0) if tld_match else ''
    has_suspicious_tld = 1 if tld in SUSPICIOUS_TLDS else 0

    # --- Feature 18: num_subdomains ---
    parts = domain_no_port.split('.')
    # Subtract 2 for the domain and TLD (e.g., "www.sub.example.com" -> 2 subdomains)
    num_subdomains = max(len(parts) - 2, 0)

    # --- Feature 19: has_shortener ---
    has_shortener = 1 if domain_no_port in SHORTENER_DOMAINS else 0

    # --- Feature 20: special_char_ratio ---
    special_chars = sum(1 for c in url if not c.isalnum() and c not in '.:/')
    special_char_ratio = round(special_chars / max(len(url), 1), 4)

    # --- Feature 21: path_entropy ---
    path_entropy = calculate_entropy(path)

    # --- Feature 22: has_suspicious_keywords ---
    url_text = url_lower.replace('-', ' ').replace('_', ' ').replace('/', ' ').replace('.', ' ')
    has_suspicious_keywords = 1 if any(kw in url_text for kw in SUSPICIOUS_KEYWORDS) else 0

    features = {
        'url_length': url_length,
        'domain_length': domain_length,
        'path_length': path_length,
        'num_dots': num_dots,
        'num_hyphens': num_hyphens,
        'num_underscores': num_underscores,
        'num_slashes': num_slashes,
        'num_query_params': num_query_params,
        'num_fragments': num_fragments,
        'num_at_symbols': num_at_symbols,
        'has_ip_address': has_ip,
        'has_https': has_https,
        'has_www': has_www,
        'num_digits_in_domain': num_digits_in_domain,
        'digit_letter_ratio': digit_letter_ratio,
        'url_entropy': url_entropy,
        'has_suspicious_tld': has_suspicious_tld,
        'num_subdomains': num_subdomains,
        'has_shortener': has_shortener,
        'special_char_ratio': special_char_ratio,
        'path_entropy': path_entropy,
        'has_suspicious_keywords': has_suspicious_keywords,
    }

    return features


def get_feature_names() -> List[str]:
    """Return the ordered list of feature names."""
    return FEATURE_NAMES.copy()


def features_to_vector(features: Dict[str, float]) -> List[float]:
    """Convert feature dict to ordered vector for model input."""
    return [features[name] for name in FEATURE_NAMES]


def get_feature_descriptions() -> Dict[str, str]:
    """Return human-readable descriptions for each feature."""
    return {
        'url_length': 'Total character count of the URL',
        'domain_length': 'Character count of the domain name',
        'path_length': 'Character count of the URL path',
        'num_dots': 'Number of dots (.) in the URL',
        'num_hyphens': 'Number of hyphens (-) in the domain',
        'num_underscores': 'Number of underscores (_) in the URL',
        'num_slashes': 'Number of forward slashes in the path',
        'num_query_params': 'Number of query parameters',
        'num_fragments': 'Presence of URL fragments (#)',
        'num_at_symbols': 'Number of @ symbols in the URL',
        'has_ip_address': 'Domain uses an IP address instead of hostname',
        'has_https': 'URL uses HTTPS protocol',
        'has_www': 'URL starts with www prefix',
        'num_digits_in_domain': 'Count of digits in the domain name',
        'digit_letter_ratio': 'Ratio of digits to letters in URL',
        'url_entropy': 'Shannon entropy (randomness) of the URL',
        'has_suspicious_tld': 'Uses a commonly abused top-level domain',
        'num_subdomains': 'Number of subdomains in the domain',
        'has_shortener': 'Uses a known URL shortening service',
        'special_char_ratio': 'Ratio of special characters in URL',
        'path_entropy': 'Shannon entropy of the URL path',
        'has_suspicious_keywords': 'Contains phishing-related keywords',
    }
