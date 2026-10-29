import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiSearch, HiShieldCheck, HiShieldExclamation, HiExclamation,
  HiDownload, HiRefresh, HiClock, HiChevronDown, HiChevronUp,
  HiScale, HiBriefcase, HiCheckCircle, HiLockClosed, HiLockOpen,
  HiGlobeAlt, HiChip, HiChartBar, HiX, HiClipboardCopy
} from 'react-icons/hi';
import { scanURL, createCase } from '../services/api';
import { runEvidenceFusion } from '../utils/evidenceFusion';

// Technical Details Visualizations
import ThreatProfileRadar from '../components/threat/ThreatProfileRadar';
import UrlDnaVisualizer from '../components/threat/UrlDnaVisualizer';
import ScanTimeline from '../components/threat/ScanTimeline';
import AttackIndicators from '../components/fusion/AttackIndicators';
import ModelEvidencePanel from '../components/fusion/ModelEvidencePanel';
import ThreatReasoningGraph from '../components/fusion/ThreatReasoningGraph';
import MissingEvidencePanel from '../components/fusion/MissingEvidencePanel';

const SCAN_SEQUENCE = [
  { label: 'URL RECEIVED', icon: '📥' },
  { label: 'VALIDATED', icon: '🔍' },
  { label: 'FEATURES EXTRACTED', icon: '⚡' },
  { label: 'MODEL EVALUATED', icon: '🤖' },
  { label: 'RISK CALCULATED', icon: '⚖️' },
  { label: 'EXPLANATION GENERATED', icon: '🧠' },
];

export default function ScannerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [report, setReport] = useState(location.state?.report || null);
  const [error, setError] = useState(null);

  // Technical details collapse & tab state
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [activeTechTab, setActiveTechTab] = useState('models');

  useEffect(() => {
    if (location.state?.autoScanUrl) {
      const autoUrl = location.state.autoScanUrl;
      setUrl(autoUrl);
      executeScan(autoUrl);
    } else if (location.state?.report) {
      setReport(location.state.report);
    }
  }, [location.state]);

  const executeScan = async (targetUrl) => {
    const inputUrl = targetUrl || url;
    if (!inputUrl.trim()) {
      setError('Please enter a website URL');
      return;
    }

    setError(null);
    setScanning(true);
    setReport(null);
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < SCAN_SEQUENCE.length - 1 ? prev + 1 : prev));
    }, 350);

    try {
      const result = await scanURL(inputUrl.trim());
      clearInterval(stepInterval);
      setCurrentStep(SCAN_SEQUENCE.length);
      setTimeout(() => {
        setReport(result);
        setScanning(false);
      }, 250);
    } catch (err) {
      clearInterval(stepInterval);
      const detail = err.response?.data?.detail || err.message || 'Analysis unavailable. Make sure backend is running.';
      setError(detail);
      setScanning(false);
    }
  };

  const handleDownloadReport = () => {
    if (!report) return;
    const dataStr = JSON.stringify(report, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `phishguard-scan-${report.id || 'report'}.json`;
    link.click();
    URL.revokeObjectURL(blobUrl);
  };

  const handleStartInvestigation = async () => {
    if (!report) return;
    try {
      const caseData = await createCase({
        url: report.url,
        verdict: report.verdict,
        risk_score: report.risk_score,
        severity: report.risk_level || (report.risk_score <= 30 ? 'LOW' : report.risk_score <= 70 ? 'MEDIUM' : 'CRITICAL'),
        scan_id: report.id,
        status: 'NEW',
        analyst_notes: `Investigation initiated from Scanner result #${report.id}.`,
        evidence_summary: report.features,
      });
      navigate(`/cases/${caseData.id}`);
    } catch (err) {
      console.error('Failed to create investigation case:', err);
      alert('Could not start investigation case.');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      // Fallback: focus the input so user can paste manually
      document.getElementById('scanner-url-input')?.focus();
    }
  };

  // Helper to extract domain from URL
  const getDomainFromUrl = (rawUrl) => {
    if (!rawUrl) return 'N/A';
    try {
      const formatted = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
        ? rawUrl
        : `http://${rawUrl}`;
      return new URL(formatted).hostname || rawUrl;
    } catch {
      return rawUrl;
    }
  };

  // Compute evidence fusion data deterministically from scan report
  const fusion = useMemo(() => {
    if (!report) return null;
    return runEvidenceFusion(report);
  }, [report]);

  // Handle Conflicting Results (Requirement 5)
  // Check if ML prediction and evidence-based assessment disagree
  const hasDisagreement = useMemo(() => {
    if (!fusion || !report) return false;
    const mlV = (report.verdict || '').toLowerCase();
    const fusionV = (fusion.fusionVerdict || '').toLowerCase();
    return mlV !== fusionV;
  }, [fusion, report]);

  // Categorize 22 extracted features for technical details
  const categorizeFeatures = (features) => {
    if (!features) return {};
    const categories = {
      'URL Structure & Length': [
        'url_length', 'domain_length', 'path_length', 'num_dots',
        'num_hyphens', 'num_underscores', 'num_slashes', 'num_query_params', 'num_fragments'
      ],
      'Security & Protocol Indicators': [
        'has_https', 'has_ip_address', 'has_shortener', 'has_suspicious_tld', 'has_www', 'num_at_symbols'
      ],
      'Lexical & Entropy Metrics': [
        'num_subdomains', 'num_digits_in_domain', 'digit_letter_ratio',
        'url_entropy', 'path_entropy', 'special_char_ratio', 'has_suspicious_keywords'
      ]
    };
    const categorized = {};
    Object.entries(categories).forEach(([catName, keys]) => {
      categorized[catName] = keys.map(key => ({
        key,
        value: features[key] !== undefined ? features[key] : 'N/A'
      }));
    });
    return categorized;
  };

  // Main Risk Factors: Top 3 most relevant risk factors actually detected (Requirement 1.C)
  const topRiskFactors = useMemo(() => {
    if (!report) return [];
    const factors = [];

    // 1. From activeAttackIndicators (high-level threat techniques actually detected)
    if (fusion?.activeAttackIndicators?.length > 0) {
      fusion.activeAttackIndicators.forEach((ind) => {
        factors.push({
          id: ind.id || ind.name,
          title: ind.name,
          description: ind.description,
          severity: ind.severity || 'HIGH',
        });
      });
    }

    // 2. From shap_explanations that increase risk (if fewer than 3 factors found)
    if (factors.length < 3 && report.shap_explanations?.length > 0) {
      const riskExplanations = report.shap_explanations.filter(
        (e) => e.impact === 'increases_risk' || (e.shap_value && e.shap_value > 0.04)
      );
      riskExplanations.forEach((exp) => {
        const cleanTitle = exp.feature.replace(/_/g, ' ').toUpperCase();
        if (!factors.some((f) => f.title.toUpperCase() === cleanTitle)) {
          factors.push({
            id: exp.feature,
            title: cleanTitle,
            description: exp.description,
            severity: (exp.shap_value && exp.shap_value > 0.15) ? 'CRITICAL' : 'HIGH',
          });
        }
      });
    }

    // 3. Fallback to top_reasons from existing backend analysis
    if (factors.length < 3 && report.top_reasons?.length > 0) {
      report.top_reasons
        .filter((r) => r.includes('🚨') || r.includes('⚠️'))
        .forEach((r, idx) => {
          const cleanDesc = r.replace(/^[🚨⚠️✅]\s*/, '');
          if (!factors.some((f) => f.description === cleanDesc)) {
            factors.push({
              id: `top-reason-${idx}`,
              title: r.includes('🚨') ? 'Threat Indicator' : 'Security Anomaly',
              description: cleanDesc,
              severity: r.includes('🚨') ? 'HIGH' : 'MEDIUM',
            });
          }
        });
    }

    return factors.slice(0, 3);
  }, [report, fusion]);

  // URL Security Details: 6 essential attributes (Requirement 1.D)
  const urlSecurityDetails = useMemo(() => {
    if (!report || !report.features) return [];
    const feat = report.features;
    const domain = getDomainFromUrl(report.url);
    const urlLength = feat.url_length ?? (report.url?.length || 0);

    return [
      {
        id: 'https',
        label: 'HTTPS Encryption',
        icon: feat.has_https === 1 ? '🔒' : '🔓',
        value: feat.has_https === 1 ? 'Enabled (HTTPS)' : 'Disabled (HTTP)',
        status: feat.has_https === 1 ? 'safe' : 'risk',
        statusText: feat.has_https === 1 ? 'Encrypted' : 'Unencrypted',
      },
      {
        id: 'domain',
        label: 'Domain Name',
        icon: '🌐',
        value: domain,
        status: 'safe',
        statusText: `${feat.domain_length || domain.length} characters`,
      },
      {
        id: 'length',
        label: 'URL Length',
        icon: '📏',
        value: `${urlLength} characters`,
        status: urlLength > 75 ? 'warning' : 'safe',
        statusText: urlLength > 75 ? 'Unusually Long' : 'Standard Length',
      },
      {
        id: 'tld',
        label: 'Top-Level Domain (TLD)',
        icon: '🏷️',
        value: feat.has_suspicious_tld ? 'Suspicious TLD' : 'Standard TLD',
        status: feat.has_suspicious_tld ? 'risk' : 'safe',
        statusText: feat.has_suspicious_tld ? 'Abuse Prone' : 'Standard Registry',
      },
      {
        id: 'ip',
        label: 'IP Address Usage',
        icon: '💻',
        value: feat.has_ip_address ? 'Raw IP Hostname' : 'Standard Hostname',
        status: feat.has_ip_address ? 'risk' : 'safe',
        statusText: feat.has_ip_address ? 'Evasion Indicator' : 'Domain Resolution',
      },
      {
        id: 'shortener',
        label: 'URL Shortener',
        icon: '🔗',
        value: feat.has_shortener ? 'Shortened Service' : 'Direct Address',
        status: feat.has_shortener ? 'risk' : 'safe',
        statusText: feat.has_shortener ? 'Hidden Target' : 'Direct Link',
      },
    ];
  }, [report]);

  // Recommended Action Guidance (Requirement 1.E)
  const recommendation = useMemo(() => {
    if (!report) return null;
    const verdict = (report.verdict || '').toLowerCase();
    const risk = report.risk_score || 0;

    if (verdict === 'phishing' || risk > 70) {
      return {
        type: 'phishing',
        title: 'DO NOT OPEN OR PROVIDE SENSITIVE INFORMATION',
        badge: 'HIGH THREAT',
        guidelines: [
          'Do not open this website, click internal links, or download files.',
          'Never enter passwords, banking details, or confidential information.',
          'Block this domain on network routers and firewalls.',
          'If credentials were typed, change them immediately on the authentic service.'
        ],
      };
    }
    if (verdict === 'suspicious' || risk > 30) {
      return {
        type: 'suspicious',
        title: 'AVOID ENTERING PASSWORDS OR PERSONAL INFORMATION',
        badge: 'SUSPICIOUS INDICATORS',
        guidelines: [
          'Avoid entering credentials, PINs, or sensitive information until verified.',
          'Carefully check the domain spelling for deceptive brand imitation.',
          'Confirm authenticity through official channels before proceeding.',
          'Exercise high caution with login forms and unexpected prompts.'
        ],
      };
    }
    return {
      type: 'safe',
      title: 'SAFE TO BROWSE - EXERCISE NORMAL DILIGENCE',
      badge: 'LOW RISK',
      guidelines: [
        'No significant phishing indicators were detected in this URL.',
        'Always verify unfamiliar links before entering credentials.',
        'Ensure the browser address bar matches the expected organization.'
      ],
    };
  }, [report]);

  // Machine Learning essential metrics (Requirement 1.B)
  const mlMetrics = useMemo(() => {
    if (!report) return null;
    const phishingProb = report.phishing_probability !== undefined
      ? report.phishing_probability
      : (report.risk_score / 100);
    const phishingPct = (phishingProb * 100).toFixed(1);
    const legitPct = ((1 - phishingProb) * 100).toFixed(1);
    const confidencePct = report.confidence != null ? `${(report.confidence * 100).toFixed(1)}%` : 'N/A';

    const agreement = fusion?.mlModelAgreement;
    let agreementDisplay = 'Consensus Validated';
    let agreementSub = 'Models agree on prediction';

    if (agreement) {
      const { agreementLevel, phishingVotes, totalModels, dissent } = agreement;
      agreementDisplay = `${agreementLevel} (${phishingVotes}/${totalModels} Phishing Votes)`;
      agreementSub = dissent
        ? 'Dissenting model prediction observed'
        : 'All evaluated models in agreement';
    }

    return {
      phishingPct,
      legitPct,
      confidencePct,
      agreementDisplay,
      agreementSub,
    };
  }, [report, fusion]);

  // Final verdict text & explanation (Requirement 1.A)
  const verdictExplanation = useMemo(() => {
    if (!report) return '';
    const verdict = (report.verdict || '').toLowerCase();
    if (verdict === 'phishing') {
      return 'Multiple critical threat indicators and machine learning analysis identify this URL as high-risk phishing designed to mislead users or harvest credentials.';
    }
    if (verdict === 'suspicious') {
      return 'This URL contains suspicious patterns or anomalies that deviate from typical trusted websites. Manual caution is advised.';
    }
    return 'No significant phishing indicators were detected. The URL structure, protocol, and domain characteristics are consistent with standard legitimate websites.';
  }, [report]);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Scanner Header Hero */}
      <div className="scanner-hero" style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ fontSize: '32px', marginBottom: '6px' }}>
          PhishGuard Scanner
        </h1>
        <p className="page-subtitle" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Real-time AI URL threat detection & explainable security analysis
        </p>
      </div>

      {/* URL Input Box */}
      <div className="scanner-container" style={{ marginBottom: '24px' }}>
        <div className="url-input-wrapper">
          <div className="url-input-group">
            <input
              id="scanner-url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL to analyze (e.g., https://example.com)"
              onKeyDown={(e) => e.key === 'Enter' && executeScan()}
              disabled={scanning}
            />

            {/* Paste button — visible only when input is empty */}
            {!url && !scanning && (
              <button
                id="scanner-paste-button"
                className="input-action-btn paste-btn"
                onClick={handlePaste}
                title="Paste URL from clipboard"
              >
                <HiClipboardCopy /> Paste
              </button>
            )}

            {/* Clear button — visible only when input has text */}
            {url && !scanning && (
              <button
                id="scanner-clear-button"
                className="input-action-btn clear-btn"
                onClick={() => setUrl('')}
                title="Clear URL"
              >
                <HiX />
              </button>
            )}

            <button
              id="scanner-scan-button"
              className={`scan-button ${scanning ? 'scanning' : ''}`}
              onClick={() => executeScan()}
              disabled={scanning}
            >
              {scanning ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Analyzing...
                </>
              ) : (
                <>
                  <HiSearch /> SCAN URL
                </>
              )}
            </button>
          </div>
        </div>

        {/* Visual Scanning Sequence */}
        <AnimatePresence>
          {scanning && (
            <motion.div
              className="scan-progress"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: '16px' }}
            >
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${((currentStep + 1) / SCAN_SEQUENCE.length) * 100}%` }}
                />
              </div>
              <div className="progress-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: '12px' }}>
                {SCAN_SEQUENCE.map((seq, i) => (
                  <div
                    key={i}
                    className={`progress-step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}
                    style={{
                      padding: '8px 12px',
                      background: i === currentStep ? 'rgba(6, 182, 212, 0.1)' : 'var(--bg-card)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      textAlign: 'center'
                    }}
                  >
                    <span className="step-icon" style={{ marginRight: '6px' }}>{i < currentStep ? '✓' : seq.icon}</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.04em' }}>{seq.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            className="disagreement-banner"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: '16px', borderLeftColor: 'var(--accent-red)' }}
          >
            <HiExclamation className="banner-icon" style={{ color: 'var(--accent-red)' }} />
            <div>
              <div className="banner-title" style={{ color: 'var(--accent-red)' }}>ANALYSIS UNAVAILABLE</div>
              <div className="banner-desc">{error}</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SIMPLIFIED SCAN RESULTS VIEW
      ════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {report && (
          <motion.div
            className="report-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* ── 1.A FINAL VERDICT & RISK SCORE ───────────────────────── */}
            <div className={`report-header ${report.verdict?.toLowerCase()}`}>
              <div className="verdict-section">
                <div className={`verdict-icon ${report.verdict?.toLowerCase()}`}>
                  {report.verdict === 'Phishing' ? <HiShieldExclamation /> :
                   report.verdict === 'Suspicious' ? <HiExclamation /> : <HiShieldCheck />}
                </div>

                <div className="verdict-text">
                  <div className="verdict-level-pill" style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                    color: report.verdict === 'Phishing' ? 'var(--accent-red)' :
                           report.verdict === 'Suspicious' ? 'var(--accent-yellow)' : 'var(--accent-green)'
                  }}>
                    {report.verdict?.toUpperCase()} VERDICT
                  </div>

                  <h2 className={report.verdict?.toLowerCase()} style={{ margin: '0 0 6px 0', fontSize: '26px' }}>
                    {report.verdict === 'Phishing' ? 'PHISHING DETECTED' :
                     report.verdict === 'Suspicious' ? 'SUSPICIOUS URL' :
                     'SAFE - LEGITIMATE URL'}
                  </h2>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.45', maxWidth: '520px' }}>
                    {verdictExplanation}
                  </p>

                  <div className="verdict-url" title={report.url}>
                    {report.url}
                  </div>
                </div>
              </div>

              {/* Semicircular Risk Gauge */}
              <div className="risk-gauge">
                <div className="gauge-container" style={{ width: '130px', height: '70px', position: 'relative' }}>
                  <svg viewBox="0 0 120 70" style={{ width: '130px', height: '70px' }}>
                    <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="var(--bg-elevated)" strokeWidth="10" strokeLinecap="round" />
                    <path
                      d="M 10 60 A 50 50 0 0 1 110 60"
                      fill="none"
                      stroke={report.risk_score <= 30 ? 'var(--accent-green)' : report.risk_score <= 70 ? 'var(--accent-yellow)' : 'var(--accent-red)'}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(report.risk_score / 100) * 157} 157`}
                      style={{ transition: 'stroke-dasharray 1.2s ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                    <span className="gauge-score" style={{
                      color: report.risk_score <= 30 ? 'var(--accent-green)' : report.risk_score <= 70 ? 'var(--accent-yellow)' : 'var(--accent-red)'
                    }}>
                      {report.risk_score}
                    </span>
                  </div>
                </div>
                <div className="gauge-label">RISK SCORE (/100)</div>
              </div>
            </div>

            {/* ── REQUIREMENT 5: CONFLICTING RESULTS WARNING ──────────── */}
            {hasDisagreement && (
              <div className="disagreement-banner">
                <HiExclamation className="banner-icon" />
                <div>
                  <div className="banner-title">
                    The ML prediction and evidence-based assessment disagree. Manual verification is recommended.
                  </div>
                  <div className="banner-desc">
                    Machine Learning ensemble classified this URL as <strong>{report.verdict}</strong>, 
                    while evidence-based feature analysis evaluated to <strong>{fusion.fusionVerdict}</strong>. 
                    Exercise additional caution before proceeding.
                  </div>
                </div>
              </div>
            )}

            {/* ── 1.B MACHINE LEARNING PREDICTION ──────────────────────── */}
            <div className="scan-result-card">
              <div className="scan-section-header">
                <div>
                  <div className="scan-section-title">
                    <HiChip style={{ color: 'var(--accent-cyan)' }} /> Machine Learning Prediction
                  </div>
                  <div className="scan-section-subtitle">
                    Core probabilistic classification from the 4-model ensemble pipeline
                  </div>
                </div>
              </div>

              {mlMetrics && (
                <>
                  <div className="ml-metrics-grid">
                    {/* Phishing Probability */}
                    <div className="ml-metric-box">
                      <span className="metric-label">Phishing Probability</span>
                      <span className="metric-value" style={{ color: 'var(--accent-red)' }}>
                        {mlMetrics.phishingPct}%
                      </span>
                      <span className="metric-subtext">Likelihood of malicious intent</span>
                    </div>

                    {/* Legitimate Probability */}
                    <div className="ml-metric-box">
                      <span className="metric-label">Legitimate Probability</span>
                      <span className="metric-value" style={{ color: 'var(--accent-green)' }}>
                        {mlMetrics.legitPct}%
                      </span>
                      <span className="metric-subtext">Likelihood of safe destination</span>
                    </div>

                    {/* Model Confidence */}
                    <div className="ml-metric-box">
                      <span className="metric-label">Model Confidence</span>
                      <span className="metric-value" style={{ color: 'var(--accent-cyan)' }}>
                        {mlMetrics.confidencePct}
                      </span>
                      <span className="metric-subtext">Ensemble certainty score</span>
                    </div>

                    {/* Model Agreement */}
                    <div className="ml-metric-box">
                      <span className="metric-label">Model Agreement</span>
                      <span className="metric-value" style={{
                        fontSize: '18px',
                        color: fusion?.mlModelAgreement?.dissent ? 'var(--accent-yellow)' : 'var(--text-primary)'
                      }}>
                        {fusion?.mlModelAgreement?.agreementLevel || 'Consensus'}
                      </span>
                      <span className="metric-subtext">{mlMetrics.agreementDisplay}</span>
                    </div>
                  </div>

                  <div className="ml-agreement-note">
                    <HiChartBar style={{ color: 'var(--accent-cyan)', fontSize: '16px', flexShrink: 0 }} />
                    <span>
                      Ensemble evaluated across 4 verified classifiers (Random Forest, Gradient Boosting, Logistic Regression, Decision Tree). Individual model breakdowns are available in <strong>Technical Details</strong> below.
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* ── 1.C MAIN RISK FACTORS ────────────────────────────────── */}
            <div className="scan-result-card">
              <div className="scan-section-header">
                <div>
                  <div className="scan-section-title">
                    <HiExclamation style={{ color: 'var(--accent-yellow)' }} /> Main Risk Factors
                  </div>
                  <div className="scan-section-subtitle">
                    Top detected indicators identified by feature extraction & threat analysis
                  </div>
                </div>
                <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  {topRiskFactors.length} Flagged
                </span>
              </div>

              <div className="risk-factors-list">
                {topRiskFactors.length > 0 ? (
                  topRiskFactors.map((factor, idx) => (
                    <div
                      key={factor.id || idx}
                      className={`risk-factor-card ${
                        factor.severity === 'CRITICAL' ? '' :
                        factor.severity === 'HIGH' ? '' :
                        factor.severity === 'MEDIUM' ? 'medium-severity' : 'low-severity'
                      }`}
                    >
                      <div className="risk-factor-info">
                        <div className="risk-factor-title">
                          <span>{factor.severity === 'CRITICAL' ? '🚨' : factor.severity === 'HIGH' ? '⚠️' : '🔍'}</span>
                          <span>{factor.title}</span>
                        </div>
                        <div className="risk-factor-desc">
                          {factor.description}
                        </div>
                      </div>
                      <span className={`risk-severity-badge ${factor.severity?.toLowerCase() || 'high'}`}>
                        {factor.severity}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="risk-factor-card safe-state">
                    <div className="risk-factor-info">
                      <div className="risk-factor-title">
                        <span>✅</span>
                        <span>No Significant Threat Factors Detected</span>
                      </div>
                      <div className="risk-factor-desc">
                        No anomalous URL lengths, suspicious keywords, excessive subdomains, or high-risk domain patterns were detected.
                      </div>
                    </div>
                    <span className="risk-severity-badge safe">
                      CLEAR
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── 1.D URL SECURITY DETAILS ─────────────────────────────── */}
            <div className="scan-result-card">
              <div className="scan-section-header">
                <div>
                  <div className="scan-section-title">
                    <HiLockClosed style={{ color: 'var(--accent-cyan)' }} /> URL Security Details
                  </div>
                  <div className="scan-section-subtitle">
                    Structural and security protocol attributes extracted from the URL
                  </div>
                </div>
              </div>

              <div className="url-security-grid">
                {urlSecurityDetails.map((detail) => (
                  <div key={detail.id} className="security-detail-item">
                    <div className="detail-label">
                      <span>{detail.icon}</span>
                      <span>{detail.label}</span>
                    </div>
                    <div className="detail-value" title={detail.value}>
                      {detail.value}
                    </div>
                    <div className={`detail-status ${detail.status}`}>
                      <span>{detail.status === 'safe' ? '✓' : detail.status === 'risk' ? '✗' : '•'}</span>
                      <span>{detail.statusText}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 1.E RECOMMENDED ACTION ───────────────────────────────── */}
            {recommendation && (
              <div className={`recommendation-action-card ${recommendation.type}`}>
                <div className="action-card-header">
                  <div className="action-card-title">
                    <span>{recommendation.type === 'phishing' ? '🛑' : recommendation.type === 'suspicious' ? '⚠️' : '🛡️'}</span>
                    <span>{recommendation.title}</span>
                  </div>
                  <span className={`risk-severity-badge ${recommendation.type === 'phishing' ? 'critical' : recommendation.type === 'suspicious' ? 'medium' : 'safe'}`}>
                    {recommendation.badge}
                  </span>
                </div>

                <div className="action-guidance-list">
                  {recommendation.guidelines.map((guide, idx) => (
                    <div key={idx} className="action-guidance-item">
                      <span className="bullet">›</span>
                      <span>{guide}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ACTION BUTTONS ───────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
              <button
                className="btn btn-primary"
                style={{ background: 'var(--accent-cyan)', color: '#000', fontWeight: '800' }}
                onClick={handleStartInvestigation}
              >
                <HiBriefcase /> START INVESTIGATION
              </button>
              <button className="btn btn-primary" onClick={() => { setReport(null); setUrl(''); }}>
                <HiRefresh /> NEW SCAN
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/history')}>
                <HiClock /> VIEW HISTORY
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/compare', { state: { scanA: report } })}>
                <HiScale /> COMPARE SCAN
              </button>
              <button className="btn btn-outline" onClick={handleDownloadReport}>
                <HiDownload /> DOWNLOAD REPORT (JSON)
              </button>
            </div>

            {/* ── 2. COLLAPSIBLE TECHNICAL DETAILS SECTION ────────────── */}
            <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
              <button
                id="technical-details-toggle"
                className="technical-details-toggle"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>🔬</span>
                  <span>Technical Details & Advanced Threat Analysis</span>
                  <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--accent-cyan)', fontSize: '11px' }}>
                    22 Features · ML Models · Threat Graph
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <span>{showTechnicalDetails ? 'Collapse' : 'Expand'}</span>
                  {showTechnicalDetails ? <HiChevronUp /> : <HiChevronDown />}
                </div>
              </button>

              <AnimatePresence>
                {showTechnicalDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden' }}
                  >
                    {/* Sub-tabs for clean technical exploration */}
                    <div className="tech-tabs-nav">
                      <button
                        className={`tech-tab-btn ${activeTechTab === 'models' ? 'active' : ''}`}
                        onClick={() => setActiveTechTab('models')}
                      >
                        🤖 Model Ensemble ({report.model_predictions?.length || 4})
                      </button>
                      <button
                        className={`tech-tab-btn ${activeTechTab === 'features' ? 'active' : ''}`}
                        onClick={() => setActiveTechTab('features')}
                      >
                        ⚡ 22 Features & DNA
                      </button>
                      <button
                        className={`tech-tab-btn ${activeTechTab === 'threat' ? 'active' : ''}`}
                        onClick={() => setActiveTechTab('threat')}
                      >
                        📊 Threat Radar & Graph
                      </button>
                      <button
                        className={`tech-tab-btn ${activeTechTab === 'timeline' ? 'active' : ''}`}
                        onClick={() => setActiveTechTab('timeline')}
                      >
                        🕒 Limitations & Timeline
                      </button>
                    </div>

                    {/* Tab 1: Model Ensemble Details */}
                    {activeTechTab === 'models' && (
                      <div>
                        {/* Per-model predictions */}
                        {report.model_predictions && (
                          <div className="scan-result-card" style={{ marginBottom: '20px' }}>
                            <div className="scan-section-title" style={{ marginBottom: '14px' }}>
                              Individual Model Predictions
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {report.model_predictions.map((m, idx) => {
                                const phishPct = (m.probability * 100).toFixed(1);
                                const legitPct = ((1 - m.probability) * 100).toFixed(1);
                                return (
                                  <div key={idx} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                                      <span style={{ fontWeight: '700' }}>{m.model_name}</span>
                                      <span className={`badge ${m.prediction === 1 ? 'phishing' : 'safe'}`}>
                                        {m.prediction === 1 ? `Phishing (${phishPct}%)` : `Safe (${legitPct}%)`}
                                      </span>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                                      <div style={{ width: `${phishPct}%`, background: 'var(--accent-red)' }} title={`Phishing: ${phishPct}%`} />
                                      <div style={{ width: `${legitPct}%`, background: 'var(--accent-green)' }} title={`Legitimate: ${legitPct}%`} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Model vs Evidence Separation Panel */}
                        <ModelEvidencePanel scanReport={report} />
                      </div>
                    )}

                    {/* Tab 2: 22 Features & DNA */}
                    {activeTechTab === 'features' && (
                      <div>
                        {/* URL DNA Visualizer */}
                        <UrlDnaVisualizer features={report.features} />

                        {/* 22 Extracted Features List */}
                        <div className="scan-result-card" style={{ marginBottom: '20px' }}>
                          <div className="scan-section-title" style={{ marginBottom: '14px' }}>
                            Extracted URL Feature Set (22 Attributes)
                          </div>
                          {Object.entries(categorizeFeatures(report.features)).map(([catName, featList]) => (
                            <div key={catName} style={{ marginBottom: '16px' }}>
                              <h4 style={{ fontSize: '12px', color: 'var(--accent-cyan)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {catName}
                              </h4>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                                {featList.map(({ key, value }) => (
                                  <div key={key} className="feature-item" style={{ fontSize: '12px', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>{key}</span>
                                    <span style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                                      {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(4)) : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* SHAP Feature Explanations */}
                        {report.shap_explanations?.length > 0 && (
                          <div className="scan-result-card">
                            <div className="scan-section-title" style={{ marginBottom: '14px' }}>
                              Feature-Based Model Explanation (SHAP Impacts)
                            </div>
                            <div className="reasons-list">
                              {report.shap_explanations.slice(0, 8).map((exp, idx) => {
                                const isRisk = exp.impact === 'increases_risk' || exp.shap_value > 0.05;
                                return (
                                  <div key={idx} className={`reason-item ${isRisk ? 'risk' : 'safe'}`}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                      <div>
                                        <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                                          {exp.feature.replace(/_/g, ' ').toUpperCase()}
                                        </strong>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                          {exp.description}
                                        </div>
                                      </div>
                                      <span className="badge" style={{
                                        background: isRisk ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                        color: isRisk ? 'var(--accent-red)' : 'var(--accent-green)'
                                      }}>
                                        {isRisk ? 'Increases Risk' : 'Protective Factor'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Threat Radar & Graph */}
                    {activeTechTab === 'threat' && (
                      <div>
                        {/* Threat Profile Radar */}
                        <ThreatProfileRadar features={report.features} />

                        {/* Attack Indicators */}
                        <AttackIndicators scanReport={report} />

                        {/* Threat Reasoning Graph */}
                        <ThreatReasoningGraph scanReport={report} />
                      </div>
                    )}

                    {/* Tab 4: Limitations & Timeline */}
                    {activeTechTab === 'timeline' && (
                      <div>
                        {/* Missing Evidence & Scope */}
                        <MissingEvidencePanel scanReport={report} />

                        {/* Scan Timeline */}
                        <ScanTimeline />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
