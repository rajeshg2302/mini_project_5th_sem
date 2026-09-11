# PhishGuard Nexus — Threat Indicators Reference

## Observed Indicator Categories

All indicators are derived **only** from extracted URL features.
They represent observations, not confirmed attack classifications.

---

## Indicator Definitions

### IP Hostname (CRITICAL)
- **Feature**: `has_ip_address ≥ 1`
- **ATT&CK**: T1566.001
- **Tactic**: Initial Access
- **Description**: Attacker uses bare IP address to bypass domain-based security controls and blocklists.

### URL Shortener Obfuscation (HIGH)
- **Feature**: `has_shortener ≥ 1`
- **ATT&CK**: T1566.002
- **Tactic**: Defense Evasion
- **Description**: URL shortener hides the actual destination preventing pre-click inspection.

### @ Symbol Redirection (CRITICAL)
- **Feature**: `num_at_symbols ≥ 1`
- **ATT&CK**: T1192
- **Tactic**: Collection
- **Description**: Browser @ symbol causes redirection to host portion following the @.

### Disposable Domain / Suspicious TLD (HIGH)
- **Feature**: `has_suspicious_tld ≥ 1`
- **ATT&CK**: T1583.001
- **Tactic**: Resource Development
- **Description**: Domain registered on low-cost/free TLD frequently used for phishing.

### Credential Trigger Keywords (HIGH)
- **Feature**: `has_suspicious_keywords > 0`
- **ATT&CK**: T1598
- **Tactic**: Reconnaissance
- **Description**: URL path contains social-engineering keywords designed to harvest credentials.

### Subdomain Brand Spoofing (MEDIUM)
- **Feature**: `num_subdomains > 2`
- **ATT&CK**: T1566.003
- **Tactic**: Initial Access
- **Description**: Excessive subdomains embed legitimate brand names to deceive mobile users.

### Obfuscated/Encoded URL (MEDIUM)
- **Feature**: `url_entropy > 4.5`
- **ATT&CK**: T1027
- **Tactic**: Defense Evasion
- **Description**: High entropy suggests machine-generated or encoded URL path.

### Unencrypted Channel (MEDIUM)
- **Feature**: `has_https = 0`
- **ATT&CK**: T1557
- **Tactic**: Credential Access
- **Description**: No TLS/SSL allows interception via MITM attacks.

### URL Length Obfuscation (LOW)
- **Feature**: `url_length > 100`
- **ATT&CK**: T1078
- **Tactic**: Defense Evasion
- **Description**: Abnormally long URLs hide the true domain and overwhelm URL scanners.

---

## Display Language

Per Phase 13 specification, indicators always use:
- ✅ "**Observed Indicator**" — correct
- ❌ ~~"Confirmed Attack Technique"~~ — not used
- ❌ ~~"Detected Malware"~~ — not used
- ❌ ~~"Confirmed Phishing"~~ — not used

All indicators expand to show: ATT&CK ID, tactic, observed feature value, 
and a disclaimer noting this is a structural observation not a confirmed attack.
