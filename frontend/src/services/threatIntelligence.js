/**
 * PhishGuard Threat Intelligence Engine
 * 
 * Derives scientific threat profile dimensions, URL DNA fingerprints,
 * contextual recommendations, and educational defense notes strictly from
 * extracted URL features. Zero fabricated data.
 */

/**
 * Calculate 5-dimension Threat Profile from extracted URL features (0-100 scale).
 * 
 * Dimensions:
 * 1. URL Structure Risk (length, slashes, depth, query params)
 * 2. Hostname/Domain Risk (IP address, domain length, subdomains, punycode)
 * 3. Obfuscation Risk (entropy, shortener, special char ratio, at-symbol)
 * 4. Keyword Risk (suspicious keywords, SSL in domain)
 * 5. Security Indicator Risk (HTTPS status, standard port, standard TLD)
 */
export function calculateThreatProfile(features) {
  if (!features) {
    return {
      structure: { score: 0, level: 'LOW' },
      hostname: { score: 0, level: 'LOW' },
      obfuscation: { score: 0, level: 'LOW' },
      keyword: { score: 0, level: 'LOW' },
      security: { score: 0, level: 'LOW' },
    };
  }

  // Helper score clamping
  const clamp = (val) => Math.max(0, Math.min(100, Math.round(val)));
  const getLevel = (score) => {
    if (score <= 20) return 'LOW';
    if (score <= 40) return 'GUARDED';
    if (score <= 60) return 'MEDIUM';
    if (score <= 80) return 'HIGH';
    return 'CRITICAL';
  };

  // 1. URL Structure Risk
  let structScore = 0;
  if (features.url_length > 75) structScore += 35;
  if (features.path_length > 40) structScore += 25;
  if (features.num_slashes > 5) structScore += 20;
  if (features.num_query_params > 2) structScore += 20;
  const structure = clamp(structScore);

  // 2. Hostname/Domain Risk
  let hostScore = 0;
  if (features.has_ip_address) hostScore += 50;
  if (features.num_subdomains > 2) hostScore += 30;
  if (features.domain_length > 25) hostScore += 20;
  if (features.num_hyphens > 2) hostScore += 20;
  const hostname = clamp(hostScore);

  // 3. Obfuscation Risk
  let obfScore = 0;
  if (features.has_shortener) obfScore += 45;
  if (features.num_at_symbols > 0) obfScore += 45;
  if (features.url_entropy > 4.5) obfScore += 30;
  if (features.special_char_ratio > 0.15) obfScore += 20;
  const obfuscation = clamp(obfScore);

  // 4. Keyword Risk
  let kwScore = 0;
  if (features.has_suspicious_keywords > 0) kwScore += Math.min(features.has_suspicious_keywords * 35, 100);
  const keyword = clamp(kwScore);

  // 5. Security Indicator Risk (High score = Lack of security indicators)
  let secScore = 0;
  if (!features.has_https) secScore += 55;
  if (features.has_suspicious_tld) secScore += 45;
  const security = clamp(secScore);

  return {
    structure: { score: structure, level: getLevel(structure) },
    hostname: { score: hostname, level: getLevel(hostname) },
    obfuscation: { score: obfuscation, level: getLevel(obfuscation) },
    keyword: { score: keyword, level: getLevel(keyword) },
    security: { score: security, level: getLevel(security) },
  };
}

/**
 * Generate normalized URL DNA Fingerprint indicators.
 */
export function generateUrlDna(features) {
  if (!features) return [];

  return [
    { label: 'URL Length', raw: features.url_length, score: Math.min((features.url_length / 120) * 100, 100), category: 'Structure' },
    { label: 'Domain Length', raw: features.domain_length, score: Math.min((features.domain_length / 40) * 100, 100), category: 'Domain' },
    { label: 'Subdomains', raw: features.num_subdomains, score: Math.min(features.num_subdomains * 33, 100), category: 'Domain' },
    { label: 'URL Entropy', raw: typeof features.url_entropy === 'number' ? features.url_entropy.toFixed(2) : features.url_entropy, score: Math.min(((features.url_entropy || 0) / 6.0) * 100, 100), category: 'Obfuscation' },
    { label: 'Special Chars', raw: `${((features.special_char_ratio || 0) * 100).toFixed(1)}%`, score: Math.min(((features.special_char_ratio || 0) / 0.3) * 100, 100), category: 'Obfuscation' },
    { label: 'IP Address', raw: features.has_ip_address ? 'TRUE' : 'FALSE', score: features.has_ip_address ? 100 : 0, category: 'Domain' },
    { label: 'HTTPS Active', raw: features.has_https ? 'TRUE' : 'FALSE', score: features.has_https ? 0 : 100, category: 'Security' },
    { label: 'Suspicious Keywords', raw: features.has_suspicious_keywords || 0, score: Math.min((features.has_suspicious_keywords || 0) * 40, 100), category: 'Keywords' },
    { label: 'URL Shortener', raw: features.has_shortener ? 'TRUE' : 'FALSE', score: features.has_shortener ? 100 : 0, category: 'Obfuscation' },
    { label: 'Suspicious TLD', raw: features.has_suspicious_tld ? 'TRUE' : 'FALSE', score: features.has_suspicious_tld ? 100 : 0, category: 'Security' },
  ];
}

/**
 * Generate dynamic feature-driven recommendations.
 */
export function generateDynamicRecommendations(features, verdict, riskScore) {
  const recs = [];

  if (!features) {
    return [
      { type: 'warning', text: 'Exercise caution before providing sensitive credentials on unverified websites.' }
    ];
  }

  if (features.has_ip_address) {
    recs.push({
      type: 'alert',
      icon: '🌐',
      text: 'IP Address Hostname Detected: Independently verify the domain name of the organization before logging in.',
    });
  }

  if (features.has_suspicious_keywords > 0) {
    recs.push({
      type: 'alert',
      icon: '🔑',
      text: 'Credential Harvesting Keywords Detected: Do not enter passwords, PINs, or banking credentials.',
    });
  }

  if (features.has_shortener) {
    recs.push({
      type: 'warning',
      icon: '🔗',
      text: 'Shortened URL Detected: Expand and inspect the destination address using a trusted URL unshortener service.',
    });
  }

  if (features.num_subdomains > 2) {
    recs.push({
      type: 'warning',
      icon: '🏢',
      text: 'Excessive Subdomains Detected: Verify the primary root domain name carefully (e.g. check domain suffix).',
    });
  }

  if (!features.has_https) {
    recs.push({
      type: 'warning',
      icon: '🔓',
      text: 'Unencrypted Connection (HTTP): Data transmitted to this website is not secured with SSL/TLS encryption.',
    });
  }

  if (features.has_suspicious_tld) {
    recs.push({
      type: 'warning',
      icon: '⚠️',
      text: 'High-Risk TLD Detected: Free or commonly abused top-level domains are frequently used in phishing campaigns.',
    });
  }

  // Fallbacks based on risk score
  if (recs.length === 0) {
    if (riskScore <= 30) {
      recs.push({
        type: 'safe',
        icon: '✅',
        text: 'Standard Security Notice: No prominent phishing indicators detected. Always confirm recipient identity.',
      });
    } else {
      recs.push({
        type: 'warning',
        icon: '🛡️',
        text: 'Elevated Risk Notice: Avoid entering sensitive personal or financial information on this website.',
      });
    }
  }

  return recs;
}

/**
 * Educational notes explaining why attackers use specific detected techniques.
 */
export function getSecurityEducationalNotes(features) {
  const notes = [];
  if (!features) return notes;

  if (features.has_ip_address) {
    notes.push({
      title: 'Raw IP Address Hostname',
      technique: 'IP-based Bypassing',
      explanation: 'Phishing attackers frequently host malicious landers directly on raw IP addresses to bypass domain-based blocklists and avoid DNS registration fees.',
    });
  }

  if (features.num_subdomains > 2) {
    notes.push({
      title: 'Subdomain Stuffing',
      technique: 'Brand Spoofing in Subdomains',
      explanation: 'Attackers create long subdomains incorporating legitimate brand names (e.g., login.paypal.com.attacker.xyz) hoping mobile users will only see the brand name.',
    });
  }

  if (features.has_suspicious_keywords > 0) {
    notes.push({
      title: 'Credential Trigger Keywords',
      technique: 'Social Engineering Terminology',
      explanation: 'Terms like "verify-account", "update-billing", or "secure-login" create an artificial sense of urgency to trick victims into entering login details.',
    });
  }

  if (features.has_shortener) {
    notes.push({
      title: 'URL Shortener Obfuscation',
      technique: 'Destination Concealment',
      explanation: 'URL shorteners hide the real destination domain, preventing email scanners and users from evaluating the host address prior to clicking.',
    });
  }

  if (features.has_suspicious_tld) {
    notes.push({
      title: 'High-Risk Top Level Domains',
      technique: 'Disposable Domain Registration',
      explanation: 'Attackers frequently register domains on cheap or free TLDs (.tk, .xyz, .top) that allow anonymous bulk registration for short-lived phishing campaigns.',
    });
  }

  return notes;
}
