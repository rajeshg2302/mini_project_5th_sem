import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiSearch, HiShieldCheck, HiShieldExclamation, HiExclamation,
  HiDownload, HiRefresh, HiClock, HiChevronDown, HiChevronUp,
  HiScale, HiInformationCircle
} from 'react-icons/hi';
import { scanURL } from '../services/api';
import { generateDynamicRecommendations } from '../services/threatIntelligence';

import ThreatProfileRadar from '../components/threat/ThreatProfileRadar';
import UrlDnaVisualizer from '../components/threat/UrlDnaVisualizer';
import ScanTimeline from '../components/threat/ScanTimeline';
import SecurityEducationPanel from '../components/threat/SecurityEducationPanel';

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
  const [showTechnicalFeatures, setShowTechnicalFeatures] = useState(false);

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

  const categorizeFeatures = (features) => {
    if (!features) return {};
    const categories = {
      'URL Structure': ['url_length', 'domain_length', 'path_length', 'subdomain_count', 'url_depth', 'query_param_count'],
      'Security & Protocol': ['has_https', 'has_ip_address', 'has_port', 'is_shortened', 'has_ssl_in_domain', 'has_punycode'],
      'Suspicious Indicators': ['has_suspicious_tld', 'has_suspicious_keywords', 'has_at_symbol', 'has_hyphen_in_domain', 'double_slash_redirect', 'url_entropy'],
      'Lexical Ratios': ['digit_ratio', 'letter_ratio', 'special_char_ratio', 'num_digits_in_domain']
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

  const dynamicRecommendations = report ? generateDynamicRecommendations(report.features, report.verdict, report.risk_score) : [];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="scanner-hero">
        <h1 className="page-title" style={{ fontSize: '36px', marginBottom: '8px' }}>
          Analyze a Website
        </h1>
        <p className="page-subtitle">
          Submit any website URL for real-time machine learning analysis & explainable threat inspection
        </p>
      </div>

      <div className="scanner-container">
        <div className="url-input-wrapper">
          <div className="url-input-group">
            <input
              id="scanner-url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={(e) => e.key === 'Enter' && executeScan()}
              disabled={scanning}
            />
            <button
              id="scanner-scan-button"
              className={`scan-button ${scanning ? 'scanning' : ''}`}
              onClick={() => executeScan()}
              disabled={scanning}
            >
              {scanning ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Analyzing...
                </>
              ) : (
                <>
                  <HiSearch /> ANALYZE WEBSITE
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
            >
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${((currentStep + 1) / SCAN_SEQUENCE.length) * 100}%` }}
                />
              </div>
              <div className="progress-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {SCAN_SEQUENCE.map((seq, i) => (
                  <div
                    key={i}
                    className={`progress-step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}
                    style={{
                      padding: '8px 12px',
                      background: i === currentStep ? 'rgba(6, 182, 212, 0.1)' : 'var(--bg-card)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <span className="step-icon">{i < currentStep ? '✓' : seq.icon}</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.04em' }}>{seq.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            className="disclaimer-banner alert-banner"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '24px' }}
          >
            <HiExclamation className="disclaimer-icon" style={{ color: 'var(--accent-red)' }} />
            <div>
              <strong className="disclaimer-title">⚠️ ANALYSIS UNAVAILABLE</strong>
              <p className="disclaimer-text">
                PhishGuard could not complete the analysis. Details: <span className="font-mono">{error}</span>
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Security Report & Advanced Threat Intelligence */}
      <AnimatePresence>
        {report && (
          <motion.div
            className="report-container"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header Verdict Card */}
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
                    {report.risk_level ? `${report.risk_level} RISK LEVEL` : (report.verdict === 'Phishing' ? 'CRITICAL THREAT' : report.verdict === 'Suspicious' ? 'ELEVATED RISK' : 'LOW RISK')}
                  </div>
                  <h2 className={report.verdict?.toLowerCase()}>
                    {report.verdict === 'Phishing' ? 'PHISHING DETECTED' :
                     report.verdict === 'Suspicious' ? 'SUSPICIOUS INDICATORS DETECTED' :
                     'NO SIGNIFICANT PHISHING INDICATORS DETECTED'}
                  </h2>
                  <div className="verdict-url">{report.url}</div>
                </div>
              </div>

              {/* Risk Gauge */}
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

            {/* 8. Security Timeline */}
            <ScanTimeline />

            {/* 6. AI Assessment Panel */}
            <div className="report-section" style={{ marginBottom: '24px' }}>
              <h3>🤖 AI Model Assessment & Ensemble Probability</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                The model's prediction is based on the URL features extracted during this scan. Predictions are probabilistic and should not be treated as a security guarantee.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div className="card-glass" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Primary Verified Model</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                    {report.best_model_name ? report.best_model_name.replace(/_/g, ' ').toUpperCase() : 'ENSEMBLE PIPELINE'}
                  </div>
                </div>

                <div className="card-glass" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Model Confidence</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {(report.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="card-glass" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phishing Probability</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-red)', marginTop: '4px' }}>
                    {( (report.phishing_probability !== undefined ? report.phishing_probability : (report.risk_score / 100)) * 100 ).toFixed(1)}%
                  </div>
                </div>

                <div className="card-glass" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Legitimate Probability</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-green)', marginTop: '4px' }}>
                    {( (1 - (report.phishing_probability !== undefined ? report.phishing_probability : (report.risk_score / 100))) * 100 ).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Model Predictions Progress Bars */}
              {report.model_predictions && (
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
              )}
            </div>

            {/* 1. Threat Profile & 3. Threat Radar */}
            <ThreatProfileRadar features={report.features} />

            {/* 2. PhishGuard URL DNA Fingerprint */}
            <UrlDnaVisualizer features={report.features} />

            {/* 4. Advanced Risk Factors (SHAP Feature Explanations) */}
            <div className="report-section" style={{ marginBottom: '24px' }}>
              <h3>🧠 Feature-Based Model Explanation (Risk Factors)</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Key observed features influencing this classification decision:
              </p>

              <div className="reasons-list">
                {report.shap_explanations?.slice(0, 8).map((exp, idx) => {
                  const isHighImpact = exp.impact === 'increases_risk' || exp.shap_value > 0.05;
                  const observedVal = report.features ? report.features[exp.feature] : exp.value;

                  return (
                    <div
                      key={idx}
                      className={`reason-item ${isHighImpact ? 'risk' : 'safe'}`}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>
                          {exp.feature.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Observed Value: <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>{String(observedVal)}</span>
                        </div>
                      </div>
                      <span className="badge" style={{
                        background: 'var(--bg-card)',
                        color: isHighImpact ? 'var(--accent-red)' : 'var(--accent-green)'
                      }}>
                        {isHighImpact ? 'HIGH IMPACT (RISK)' : 'NEUTRAL / SAFE'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Dynamic Recommendation Engine */}
            <div className="report-section" style={{ marginBottom: '24px' }}>
              <h3>🛡️ Dynamic Security Recommendations</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Actionable guidelines triggered by specific detected URL features:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {dynamicRecommendations.map((rec, i) => (
                  <div key={i} className={`recommendation-card ${rec.type}`}>
                    <span className="icon">{rec.icon}</span>
                    <span>{rec.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 10. Security Education Panel */}
            <SecurityEducationPanel features={report.features} />

            {/* 22-Feature Analysis */}
            <div className="report-section" style={{ marginBottom: '24px' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setShowTechnicalFeatures(!showTechnicalFeatures)}
              >
                <h3>🔬 Technical 22-Feature Analysis</h3>
                <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  {showTechnicalFeatures ? <><HiChevronUp /> Hide Features</> : <><HiChevronDown /> Expand 22 Features</>}
                </button>
              </div>

              <AnimatePresence>
                {showTechnicalFeatures && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ marginTop: '16px' }}
                  >
                    {Object.entries(categorizeFeatures(report.features)).map(([catName, featList]) => (
                      <div key={catName} style={{ marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '12px', color: 'var(--accent-cyan)', marginBottom: '8px', textTransform: 'uppercase' }}>
                          {catName}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                          {featList.map(({ key, value }) => (
                            <div key={key} className="feature-item" style={{ fontSize: '12px' }}>
                              <span className="feature-name">{key}</span>
                              <span className="feature-value">
                                {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(4)) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Result Actions */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
                <HiDownload /> GENERATE REPORT (JSON)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
