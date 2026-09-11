/**
 * PhishGuard Nexus — Evidence Fusion Engine (EFE)
 *
 * Deterministically fuses ML model output, 22 URL features, SHAP explanations,
 * and threat profile dimensions into a single structured intelligence object.
 *
 * RULES:
 *   - All values derived ONLY from real scan data passed in.
 *   - No external API calls. No fabricated threat intelligence.
 *   - Model probability is treated as ONE evidence source, not ground truth.
 *   - Evidence strength is derived from feature severity and model agreement.
 */

// ─── Constants ──────────────────────────────────────────────────────────────

const EVIDENCE_WEIGHTS = {
  // Critical binary indicators — highest weight
  has_ip_address:          0.92,
  has_shortener:           0.88,
  num_at_symbols:          0.85,
  has_suspicious_tld:      0.80,
  has_suspicious_keywords: 0.75,
  // Structure complexity
  url_entropy:             0.70,
  path_entropy:            0.65,
  num_subdomains:          0.62,
  special_char_ratio:      0.58,
  // Moderate structural
  url_length:              0.45,
  num_hyphens:             0.42,
  domain_length:           0.38,
  num_slashes:             0.35,
  path_length:             0.32,
  num_dots:                0.28,
  num_query_params:        0.25,
  num_digits_in_domain:    0.22,
  // Protective (lower weight — absence is more indicative than presence)
  has_https:               0.55,  // inversed: missing https is risk
  // Low weight
  has_www:                 0.12,
  num_underscores:         0.18,
  digit_letter_ratio:      0.20,
  num_fragments:           0.15,
};

// Risk thresholds per feature
const FEATURE_RISK_THRESHOLDS = {
  url_length:              { moderate: 60, high: 100 },
  domain_length:           { moderate: 18, high: 28 },
  path_length:             { moderate: 35, high: 65 },
  num_dots:                { moderate: 3,  high: 6  },
  num_hyphens:             { moderate: 1,  high: 3  },
  num_underscores:         { moderate: 1,  high: 3  },
  num_slashes:             { moderate: 4,  high: 8  },
  num_query_params:        { moderate: 2,  high: 5  },
  num_fragments:           { moderate: 0,  high: 1  },
  num_at_symbols:          { moderate: 0,  high: 1  },
  num_digits_in_domain:    { moderate: 2,  high: 5  },
  digit_letter_ratio:      { moderate: 0.2, high: 0.5 },
  url_entropy:             { moderate: 3.8, high: 4.8 },
  num_subdomains:          { moderate: 2,   high: 4  },
  special_char_ratio:      { moderate: 0.12, high: 0.25 },
  path_entropy:            { moderate: 3.0,  high: 4.2 },
};

const BOOLEAN_RISK_FEATURES = {
  has_ip_address:          true,  // true = risk if feature = 1
  has_shortener:           true,
  has_suspicious_tld:      true,
  has_suspicious_keywords: true,  // risk if > 0
  has_https:               false, // false = risk if feature = 0 (missing https)
  has_www:                 false, // neutral; missing is not inherently risky
  num_at_symbols:          true,  // risk if > 0
};

// Attack technique taxonomy
export const ATTACK_TECHNIQUES = {
  IP_HOSTNAME: {
    id: 'T1566.001',
    name: 'Raw IP Hostname',
    tactic: 'Initial Access',
    description: 'Attacker uses bare IP address to bypass domain-based security controls and blocklists.',
    mitre: 'T1566.001 — Spear Phishing Link',
    severity: 'CRITICAL',
  },
  URL_SHORTENER: {
    id: 'T1566.002',
    name: 'URL Shortener Obfuscation',
    tactic: 'Defense Evasion',
    description: 'URL shortener hides the actual destination preventing pre-click inspection.',
    mitre: 'T1566.002 — Destination Concealment',
    severity: 'HIGH',
  },
  AT_SYMBOL_REDIRECT: {
    id: 'T1192',
    name: '@ Symbol Redirection',
    tactic: 'Collection',
    description: 'Browser @ symbol in URL causes redirection to host portion following the @.',
    mitre: 'T1192 — Spear Phishing Link',
    severity: 'CRITICAL',
  },
  SUSPICIOUS_TLD: {
    id: 'T1583.001',
    name: 'Disposable Domain (Suspicious TLD)',
    tactic: 'Resource Development',
    description: 'Attacker registered domain on a low-cost/free TLD frequently used for short-lived phishing infrastructure.',
    mitre: 'T1583.001 — Domain Registration',
    severity: 'HIGH',
  },
  CREDENTIAL_KEYWORDS: {
    id: 'T1598',
    name: 'Credential Trigger Keywords',
    tactic: 'Reconnaissance',
    description: 'URL path contains social-engineering keywords designed to create urgency and harvest credentials.',
    mitre: 'T1598 — Phishing for Information',
    severity: 'HIGH',
  },
  SUBDOMAIN_STUFFING: {
    id: 'T1566.003',
    name: 'Subdomain Brand Spoofing',
    tactic: 'Initial Access',
    description: 'Excessive subdomains embed legitimate brand names to deceive victims on mobile devices.',
    mitre: 'T1566 — Phishing',
    severity: 'MEDIUM',
  },
  HIGH_ENTROPY: {
    id: 'T1027',
    name: 'Obfuscated/Encoded URL',
    tactic: 'Defense Evasion',
    description: 'High character entropy suggests a machine-generated or encoded URL path typical of malware droppers.',
    mitre: 'T1027 — Obfuscated Files or Information',
    severity: 'MEDIUM',
  },
  NO_HTTPS: {
    id: 'T1557',
    name: 'Unencrypted Channel (HTTP)',
    tactic: 'Credential Access',
    description: 'No TLS/SSL encryption allows interception of credentials via MITM attacks.',
    mitre: 'T1557 — Adversary-in-the-Middle',
    severity: 'MEDIUM',
  },
  URL_LENGTH: {
    id: 'T1078',
    name: 'URL Padding / Length Obfuscation',
    tactic: 'Defense Evasion',
    description: 'Abnormally long URL paths are used to hide the true domain and overwhelm URL scanners.',
    mitre: 'T1078 — Valid Accounts',
    severity: 'LOW',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val));
}

function getFeatureRiskLevel(featureName, value) {
  // Boolean-style features
  if (featureName === 'has_ip_address' || featureName === 'has_shortener' || featureName === 'has_suspicious_tld') {
    return value >= 1 ? 'CRITICAL' : 'LOW';
  }
  if (featureName === 'num_at_symbols') {
    return value >= 1 ? 'CRITICAL' : 'LOW';
  }
  if (featureName === 'has_suspicious_keywords') {
    if (value === 0) return 'LOW';
    if (value === 1) return 'HIGH';
    return 'CRITICAL';
  }
  if (featureName === 'has_https') {
    return value === 1 ? 'LOW' : 'MEDIUM'; // missing HTTPS is risk
  }

  const thresholds = FEATURE_RISK_THRESHOLDS[featureName];
  if (!thresholds) return 'LOW';
  if (value >= thresholds.high) return 'HIGH';
  if (value >= thresholds.moderate) return 'MEDIUM';
  return 'LOW';
}

function computeFeatureContribution(featureName, value) {
  const weight = EVIDENCE_WEIGHTS[featureName] || 0.1;
  let normalizedRisk = 0;

  const t = FEATURE_RISK_THRESHOLDS[featureName];
  if (t) {
    normalizedRisk = clamp((value - 0) / (t.high * 1.5), 0, 1);
  } else {
    // Binary
    if (featureName === 'has_https') {
      normalizedRisk = value === 1 ? 0 : 1; // inverse
    } else {
      normalizedRisk = value >= 1 ? 1 : 0;
    }
  }

  return weight * normalizedRisk;
}

// ─── Core Export: runEvidenceFusion ──────────────────────────────────────────

/**
 * Main Evidence Fusion function.
 *
 * @param {object} scanReport — Full scan report from /api/scan or /api/report/:id
 * @returns {object} fusionResult — Structured intelligence object
 */
export function runEvidenceFusion(scanReport) {
  if (!scanReport) return null;

  const features = scanReport.features || {};
  const modelPredictions = scanReport.model_predictions || [];
  const shapExplanations = scanReport.shap_explanations || [];
  const riskScore = scanReport.risk_score ?? 50;
  const verdict = scanReport.verdict || 'Unknown';
  const confidence = scanReport.confidence ?? 0.5;

  // ── 1. Active Attack Indicators ──────────────────────────────────────────
  const activeAttackIndicators = detectAttackIndicators(features);

  // ── 2. Evidence Chain ────────────────────────────────────────────────────
  const evidenceChain = buildEvidenceChain(features, shapExplanations);

  // ── 3. Model Agreement Analysis ──────────────────────────────────────────
  const modelAgreement = analyzeModelAgreement(modelPredictions);

  // ── 4. Evidence Strength Score ───────────────────────────────────────────
  const evidenceStrength = computeEvidenceStrength(features, evidenceChain, activeAttackIndicators);

  // ── 5. Intelligence Score ────────────────────────────────────────────────
  const intelligenceScore = computeIntelligenceScore(
    riskScore, evidenceStrength, modelAgreement, activeAttackIndicators
  );

  // ── 6. Fusion Verdict (evidence-weighted, distinct from ML verdict) ───────
  const fusionVerdict = computeFusionVerdict(intelligenceScore, activeAttackIndicators);

  // ── 7. Missing Evidence (what we cannot determine) ───────────────────────
  const missingEvidence = identifyMissingEvidence(features, verdict);

  // ── 8. Analyst Decision Support ──────────────────────────────────────────
  const analystDecision = generateAnalystDecision(
    verdict, fusionVerdict, evidenceStrength, modelAgreement, activeAttackIndicators, riskScore
  );

  // ── 9. Threat Reasoning Graph nodes + edges ───────────────────────────────
  const reasoningGraph = buildReasoningGraph(
    features, activeAttackIndicators, evidenceChain, modelAgreement, fusionVerdict
  );

  return {
    // Input summary
    url: scanReport.url,
    scanId: scanReport.id,
    mlVerdict: verdict,
    mlRiskScore: riskScore,
    mlConfidence: confidence,
    mlModelAgreement: modelAgreement,

    // Fusion outputs
    fusionVerdict,
    evidenceStrength,
    intelligenceScore,
    activeAttackIndicators,
    evidenceChain,
    missingEvidence,
    analystDecision,
    reasoningGraph,

    // Metadata
    fusedAt: new Date().toISOString(),
    featureCount: Object.keys(features).length,
    indicatorCount: activeAttackIndicators.length,
  };
}

// ─── Attack Indicator Detection ──────────────────────────────────────────────

function detectAttackIndicators(features) {
  const indicators = [];

  if (features.has_ip_address >= 1) {
    indicators.push({ ...ATTACK_TECHNIQUES.IP_HOSTNAME, detected: true, featureValue: features.has_ip_address });
  }
  if (features.has_shortener >= 1) {
    indicators.push({ ...ATTACK_TECHNIQUES.URL_SHORTENER, detected: true, featureValue: features.has_shortener });
  }
  if (features.num_at_symbols >= 1) {
    indicators.push({ ...ATTACK_TECHNIQUES.AT_SYMBOL_REDIRECT, detected: true, featureValue: features.num_at_symbols });
  }
  if (features.has_suspicious_tld >= 1) {
    indicators.push({ ...ATTACK_TECHNIQUES.SUSPICIOUS_TLD, detected: true, featureValue: features.has_suspicious_tld });
  }
  if (features.has_suspicious_keywords > 0) {
    indicators.push({ ...ATTACK_TECHNIQUES.CREDENTIAL_KEYWORDS, detected: true, featureValue: features.has_suspicious_keywords });
  }
  if (features.num_subdomains > 2) {
    indicators.push({ ...ATTACK_TECHNIQUES.SUBDOMAIN_STUFFING, detected: true, featureValue: features.num_subdomains });
  }
  if (features.url_entropy > 4.5) {
    indicators.push({ ...ATTACK_TECHNIQUES.HIGH_ENTROPY, detected: true, featureValue: features.url_entropy });
  }
  if (!features.has_https || features.has_https === 0) {
    indicators.push({ ...ATTACK_TECHNIQUES.NO_HTTPS, detected: true, featureValue: 0 });
  }
  if (features.url_length > 100) {
    indicators.push({ ...ATTACK_TECHNIQUES.URL_LENGTH, detected: true, featureValue: features.url_length });
  }

  return indicators;
}

// ─── Evidence Chain Builder ───────────────────────────────────────────────────

function buildEvidenceChain(features, shapExplanations) {
  const chain = [];

  const featureNames = Object.keys(features);
  featureNames.forEach((name) => {
    const value = features[name];
    const weight = EVIDENCE_WEIGHTS[name] || 0.1;
    const riskLevel = getFeatureRiskLevel(name, value);
    const contribution = computeFeatureContribution(name, value);
    const shapEntry = shapExplanations.find((e) => e.feature === name);

    chain.push({
      feature: name,
      value,
      weight,
      riskLevel,
      contribution: round2(contribution),
      impact: shapEntry?.impact || (riskLevel !== 'LOW' ? 'increases_risk' : 'decreases_risk'),
      shapValue: shapEntry?.shap_value ?? null,
      description: shapEntry?.description || `${name}: ${value}`,
    });
  });

  // Sort by contribution (highest impact first)
  chain.sort((a, b) => b.contribution - a.contribution);
  return chain;
}

// ─── Model Agreement Analysis ─────────────────────────────────────────────────

function analyzeModelAgreement(modelPredictions) {
  if (!modelPredictions || modelPredictions.length === 0) {
    return {
      consensusVerdict: 'Unknown',
      agreementLevel: 'UNKNOWN',
      agreementScore: 0,
      phishingVotes: 0,
      safeVotes: 0,
      totalModels: 0,
      modelDetails: [],
      dissent: false,
    };
  }

  const phishingVotes = modelPredictions.filter((m) => m.prediction === 1).length;
  const safeVotes = modelPredictions.filter((m) => m.prediction === 0).length;
  const totalModels = modelPredictions.length;

  const agreementScore = clamp(
    ((Math.max(phishingVotes, safeVotes) / totalModels) * 100),
    0,
    100
  );

  let agreementLevel;
  if (agreementScore === 100) agreementLevel = 'UNANIMOUS';
  else if (agreementScore >= 75) agreementLevel = 'STRONG';
  else if (agreementScore >= 50) agreementLevel = 'PARTIAL';
  else agreementLevel = 'SPLIT';

  const consensusVerdict = phishingVotes > safeVotes ? 'Phishing' : 'Safe';
  const dissent = phishingVotes > 0 && safeVotes > 0;

  return {
    consensusVerdict,
    agreementLevel,
    agreementScore: round2(agreementScore),
    phishingVotes,
    safeVotes,
    totalModels,
    modelDetails: modelPredictions.map((m) => ({
      name: m.model_name,
      prediction: m.prediction === 1 ? 'Phishing' : 'Safe',
      probability: m.probability,
      confidence: m.confidence,
    })),
    dissent,
  };
}

// ─── Evidence Strength Score ──────────────────────────────────────────────────

function computeEvidenceStrength(features, evidenceChain, activeIndicators) {
  // Sum weighted contributions from all features
  let rawScore = evidenceChain.reduce((sum, item) => sum + item.contribution, 0);

  // Boost for critical indicators
  const criticalCount = activeIndicators.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = activeIndicators.filter((i) => i.severity === 'HIGH').length;
  rawScore += criticalCount * 0.3 + highCount * 0.15;

  // Normalize to 0–100
  const normalized = clamp(rawScore * 100 / 4.5); // 4.5 is approx max raw score

  let level;
  if (normalized <= 15) level = 'WEAK';
  else if (normalized <= 35) level = 'LOW';
  else if (normalized <= 55) level = 'MODERATE';
  else if (normalized <= 75) level = 'STRONG';
  else level = 'OVERWHELMING';

  return {
    score: Math.round(normalized),
    level,
    criticalIndicators: criticalCount,
    highIndicators: highCount,
    totalEvidencePoints: evidenceChain.length,
  };
}

// ─── Intelligence Score ────────────────────────────────────────────────────────

function computeIntelligenceScore(riskScore, evidenceStrength, modelAgreement, activeIndicators) {
  // Weighted composite:
  //   40% ML Risk Score
  //   35% Evidence Strength
  //   15% Model Agreement
  //   10% Active Indicator Count

  const mlComponent = riskScore * 0.40;
  const evidenceComponent = evidenceStrength.score * 0.35;
  const agreementComponent = modelAgreement.agreementScore * 0.15;

  // Indicator bonus: up to 10 points
  const indicatorBonus = clamp(
    (activeIndicators.filter((i) => i.severity === 'CRITICAL').length * 3 +
     activeIndicators.filter((i) => i.severity === 'HIGH').length * 1.5),
    0, 10
  );

  const total = clamp(mlComponent + evidenceComponent + agreementComponent + indicatorBonus);

  let tier;
  if (total <= 20) tier = 'MINIMAL';
  else if (total <= 40) tier = 'LOW';
  else if (total <= 60) tier = 'ELEVATED';
  else if (total <= 80) tier = 'HIGH';
  else tier = 'CRITICAL';

  return {
    score: Math.round(total),
    tier,
    breakdown: {
      mlContribution: round2(mlComponent),
      evidenceContribution: round2(evidenceComponent),
      agreementContribution: round2(agreementComponent),
      indicatorBonus: round2(indicatorBonus),
    },
  };
}

// ─── Fusion Verdict ───────────────────────────────────────────────────────────

function computeFusionVerdict(intelligenceScore, activeIndicators) {
  const criticalCount = activeIndicators.filter((i) => i.severity === 'CRITICAL').length;

  // Override to Phishing if critical indicators are present regardless of score
  if (criticalCount >= 2) return 'Phishing';
  if (criticalCount >= 1 && intelligenceScore.score >= 50) return 'Phishing';

  const score = intelligenceScore.score;
  if (score >= 70) return 'Phishing';
  if (score >= 40) return 'Suspicious';
  return 'Safe';
}

// ─── Missing Evidence ─────────────────────────────────────────────────────────

function identifyMissingEvidence(features, mlVerdict) {
  const gaps = [];

  // Things we cannot determine from URL features alone
  gaps.push({
    category: 'Content Analysis',
    gap: 'Page Content Inspection',
    reason: 'URL-only analysis cannot inspect page HTML, login form presence, or JavaScript behavior.',
    impact: 'Cannot confirm credential harvesting forms or drive-by download scripts.',
    severity: 'HIGH',
  });

  gaps.push({
    category: 'Infrastructure',
    gap: 'Hosting Provider & Geolocation',
    reason: 'IP geolocation and hosting provider reputation are not extracted from the URL alone.',
    impact: 'Cannot identify hosting in known bulletproof hosting or TOR exit nodes.',
    severity: 'MEDIUM',
  });

  gaps.push({
    category: 'Temporal Intelligence',
    gap: 'Domain Registration Age',
    reason: 'WHOIS data is not queried — domain creation date is unknown.',
    impact: 'Newly registered domains (< 30 days) are a strong phishing indicator this analysis cannot confirm.',
    severity: 'HIGH',
  });

  if (features.has_https === 1) {
    gaps.push({
      category: 'Certificate Intelligence',
      gap: 'TLS Certificate Validity',
      reason: 'HTTPS is detected but the certificate issuer, expiry, and validity are not verified.',
      impact: 'Phishing sites often use free Let\'s Encrypt certificates to appear legitimate.',
      severity: 'MEDIUM',
    });
  }

  if (mlVerdict === 'Suspicious') {
    gaps.push({
      category: 'Analyst Review',
      gap: 'Human Analyst Assessment Required',
      reason: 'This URL is classified as Suspicious — not definitively phishing or safe.',
      impact: 'Manual review of the actual page content and context is recommended.',
      severity: 'HIGH',
    });
  }

  return gaps;
}

// ─── Analyst Decision Support ─────────────────────────────────────────────────

function generateAnalystDecision(
  mlVerdict, fusionVerdict, evidenceStrength, modelAgreement, activeIndicators, riskScore
) {
  const agreements = mlVerdict === fusionVerdict;
  const criticalCount = activeIndicators.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = activeIndicators.filter((i) => i.severity === 'HIGH').length;

  let recommendedAction;
  let confidence;
  let rationale;
  let urgency;

  // Agreement between ML and Evidence Fusion
  if (agreements && fusionVerdict === 'Phishing') {
    recommendedAction = 'BLOCK & REPORT';
    confidence = 'HIGH';
    urgency = 'IMMEDIATE';
    rationale = `ML model (${mlVerdict}) and Evidence Fusion Engine both independently classify this URL as phishing. ` +
      `${criticalCount} critical attack indicator(s) detected. Risk score: ${riskScore}/100.`;
  } else if (agreements && fusionVerdict === 'Safe') {
    recommendedAction = 'ALLOW (MONITOR)';
    confidence = 'HIGH';
    urgency = 'LOW';
    rationale = `Both ML model and Evidence Fusion agree this URL shows ${evidenceStrength.level} evidence of phishing activity. ` +
      `No critical indicators detected. Risk score: ${riskScore}/100.`;
  } else if (fusionVerdict === 'Suspicious' || mlVerdict === 'Suspicious') {
    recommendedAction = 'INVESTIGATE';
    confidence = 'MEDIUM';
    urgency = 'ELEVATED';
    rationale = `ML verdict (${mlVerdict}) and Evidence Fusion verdict (${fusionVerdict}) indicate uncertainty. ` +
      `${highCount} high-severity indicator(s) require manual analyst review.`;
  } else if (!agreements) {
    // Divergence — interesting case
    recommendedAction = 'ANALYST REVIEW REQUIRED';
    confidence = 'LOW';
    urgency = 'ELEVATED';
    rationale = `ML model verdict (${mlVerdict}) diverges from Evidence Fusion verdict (${fusionVerdict}). ` +
      `This divergence may indicate edge-case patterns not captured in training data. Manual review advised.`;
  } else {
    recommendedAction = 'MONITOR';
    confidence = 'MEDIUM';
    urgency = 'LOW';
    rationale = `Evidence strength is ${evidenceStrength.level} and model agreement is ${modelAgreement.agreementLevel}.`;
  }

  return {
    recommendedAction,
    confidence,
    urgency,
    rationale,
    mlVsEvidenceAgreement: agreements,
    mlVerdictLabel: mlVerdict,
    fusionVerdictLabel: fusionVerdict,
    divergence: !agreements,
    evidenceStrengthLevel: evidenceStrength.level,
    modelAgreementLevel: modelAgreement.agreementLevel,
    keyIndicators: activeIndicators.slice(0, 3).map((i) => i.name),
  };
}

// ─── Threat Reasoning Graph ───────────────────────────────────────────────────

function buildReasoningGraph(features, activeIndicators, evidenceChain, modelAgreement, fusionVerdict) {
  const nodes = [];
  const edges = [];

  // Root node
  nodes.push({ id: 'url', type: 'root', label: 'URL INPUT', level: 0 });

  // Feature layer
  const topFeatures = evidenceChain.slice(0, 6);
  topFeatures.forEach((f, i) => {
    const nodeId = `feat_${i}`;
    nodes.push({
      id: nodeId,
      type: 'feature',
      label: f.feature.replace(/_/g, ' ').toUpperCase(),
      value: f.value,
      riskLevel: f.riskLevel,
      level: 1,
    });
    edges.push({ from: 'url', to: nodeId, type: 'extracts' });
  });

  // ML Engine node
  nodes.push({
    id: 'ml_engine',
    type: 'model',
    label: 'ML ENGINE',
    detail: `${modelAgreement.totalModels} Models · ${modelAgreement.agreementLevel} Agreement`,
    level: 2,
  });
  topFeatures.forEach((_, i) => {
    edges.push({ from: `feat_${i}`, to: 'ml_engine', type: 'feeds' });
  });

  // Active indicators
  const topIndicators = activeIndicators.slice(0, 4);
  topIndicators.forEach((ind, i) => {
    const nodeId = `ind_${i}`;
    nodes.push({
      id: nodeId,
      type: 'indicator',
      label: ind.name,
      severity: ind.severity,
      tactic: ind.tactic,
      level: 2,
    });
    edges.push({ from: 'url', to: nodeId, type: 'triggers' });
  });

  // Evidence Fusion node
  nodes.push({
    id: 'evidence_fusion',
    type: 'fusion',
    label: 'EVIDENCE FUSION',
    level: 3,
  });
  nodes.push({ id: 'ml_engine', type: 'model', label: 'ML ENGINE', level: 2 }); // reference existing
  edges.push({ from: 'ml_engine', to: 'evidence_fusion', type: 'contributes' });
  topIndicators.forEach((_, i) => {
    edges.push({ from: `ind_${i}`, to: 'evidence_fusion', type: 'contributes' });
  });

  // Verdict node
  nodes.push({
    id: 'verdict',
    type: 'verdict',
    label: fusionVerdict.toUpperCase(),
    verdict: fusionVerdict,
    level: 4,
  });
  edges.push({ from: 'evidence_fusion', to: 'verdict', type: 'determines' });

  // Deduplicate nodes by id
  const seen = new Set();
  const uniqueNodes = nodes.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });

  return { nodes: uniqueNodes, edges };
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function round2(val) {
  return Math.round(val * 100) / 100;
}

/**
 * Get a color for a severity/verdict level.
 */
export function getSeverityColor(level) {
  switch (level) {
    case 'CRITICAL': return 'var(--accent-red)';
    case 'HIGH':     return 'var(--accent-orange, #f97316)';
    case 'MEDIUM':   return 'var(--accent-yellow)';
    case 'LOW':      return 'var(--accent-cyan)';
    case 'MINIMAL':  return 'var(--accent-green)';
    case 'Phishing': return 'var(--accent-red)';
    case 'Suspicious': return 'var(--accent-yellow)';
    case 'Safe':     return 'var(--accent-green)';
    default:         return 'var(--text-muted)';
  }
}

/**
 * Returns a badge color class (string) for a threat level.
 */
export function getTierBadgeStyle(tier) {
  const map = {
    CRITICAL:     { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', border: 'rgba(239,68,68,0.4)' },
    HIGH:         { bg: 'rgba(249,115,22,0.15)', color: '#f97316', border: 'rgba(249,115,22,0.4)' },
    ELEVATED:     { bg: 'rgba(234,179,8,0.15)',  color: '#eab308', border: 'rgba(234,179,8,0.4)' },
    MEDIUM:       { bg: 'rgba(234,179,8,0.15)',  color: '#eab308', border: 'rgba(234,179,8,0.4)' },
    LOW:          { bg: 'rgba(6,182,212,0.12)',  color: '#06b6d4', border: 'rgba(6,182,212,0.3)' },
    MINIMAL:      { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
    OVERWHELMING: { bg: 'rgba(239,68,68,0.2)',   color: '#ef4444', border: 'rgba(239,68,68,0.5)' },
    STRONG:       { bg: 'rgba(249,115,22,0.15)', color: '#f97316', border: 'rgba(249,115,22,0.4)' },
    MODERATE:     { bg: 'rgba(234,179,8,0.15)',  color: '#eab308', border: 'rgba(234,179,8,0.4)' },
    WEAK:         { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
    UNANIMOUS:    { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', border: 'rgba(239,68,68,0.4)' },
    SPLIT:        { bg: 'rgba(234,179,8,0.15)',  color: '#eab308', border: 'rgba(234,179,8,0.4)' },
    PARTIAL:      { bg: 'rgba(6,182,212,0.12)',  color: '#06b6d4', border: 'rgba(6,182,212,0.3)' },
  };
  return map[tier] || { bg: 'rgba(100,100,100,0.1)', color: 'var(--text-muted)', border: 'rgba(100,100,100,0.2)' };
}
