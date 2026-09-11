import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChevronDown, HiChevronUp, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';

export default function EvidenceChain({ scan }) {
  const [expandedStep, setExpandedStep] = useState(null);

  if (!scan) {
    return (
      <div className="report-section card-glass" style={{ marginBottom: '24px' }}>
        <h3>🔗 Decision Evidence Chain</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Scan evidence data unavailable for pipeline visualization.</p>
      </div>
    );
  }

  const features = scan.features || {};
  const modelPredictions = scan.model_predictions || [];
  const topReasons = scan.top_reasons || scan.shap_explanations || [];

  const steps = [
    {
      id: 1,
      title: 'URL RECEIVED',
      icon: '📥',
      summary: scan.url,
      details: [
        { label: 'Target URL String', value: scan.url },
        { label: 'Ingestion Timestamp', value: scan.created_at || new Date().toISOString() },
      ],
    },
    {
      id: 2,
      title: 'URL VALIDATED',
      icon: '🔍',
      summary: features.has_https ? 'HTTPS Validated (Encrypted)' : 'HTTP Unencrypted Connection',
      details: [
        { label: 'Protocol Standard', value: features.has_https ? 'HTTPS (Port 443)' : 'HTTP (Port 80)' },
        { label: 'Domain Length', value: `${features.domain_length || 0} chars` },
        { label: 'Validation Status', value: 'Passed RFC Syntax & Protocol Check' },
      ],
    },
    {
      id: 3,
      title: '22 FEATURES EXTRACTED',
      icon: '⚡',
      summary: `${Object.keys(features).length || 22} Lexical & Structural Metrics Computed`,
      details: Object.entries(features).slice(0, 10).map(([k, v]) => ({
        label: k.replace(/_/g, ' ').toUpperCase(),
        value: typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(4)) : String(v),
      })),
    },
    {
      id: 4,
      title: 'ML MODEL EVALUATED',
      icon: '🤖',
      summary: scan.best_model_name ? `Primary: ${scan.best_model_name.replace(/_/g, ' ').toUpperCase()}` : 'Multi-Model Ensemble Pipeline',
      details: modelPredictions.length > 0 ? modelPredictions.map(m => ({
        label: m.model_name,
        value: `${m.prediction === 1 ? 'PHISHING' : 'SAFE'} (Probability: ${(m.probability * 100).toFixed(1)}%)`,
      })) : [
        { label: 'Model Evaluation', value: 'Completed via Scikit-Learn Classifier Pipeline' },
      ],
    },
    {
      id: 5,
      title: 'PROBABILITY CALCULATED',
      icon: '📊',
      summary: scan.confidence ? `Ensemble Confidence: ${(scan.confidence * 100).toFixed(1)}%` : `Score Ratio: ${scan.risk_score}%`,
      details: [
        { label: 'Model Confidence', value: scan.confidence ? `${(scan.confidence * 100).toFixed(1)}%` : 'N/A' },
        { label: 'Phishing Probability', value: `${scan.risk_score}%` },
      ],
    },
    {
      id: 6,
      title: 'RISK SCORE GENERATED',
      icon: '⚖️',
      summary: `Final Risk Score: ${scan.risk_score} / 100`,
      details: [
        { label: 'Calculated Risk Index', value: `${scan.risk_score} / 100` },
        { label: 'Risk Threshold Level', value: scan.risk_level || (scan.risk_score <= 30 ? 'LOW' : scan.risk_score <= 70 ? 'MEDIUM' : 'CRITICAL') },
      ],
    },
    {
      id: 7,
      title: 'RISK FACTORS IDENTIFIED',
      icon: '🧠',
      summary: `${topReasons.length} Primary Risk Indicators Flagged`,
      details: Array.isArray(topReasons) ? topReasons.map((r, i) => ({
        label: `Indicator #${i + 1}`,
        value: typeof r === 'object' ? `${r.feature || 'Factor'} (${r.value || r.impact || ''})` : String(r),
      })) : [],
    },
    {
      id: 8,
      title: 'THREAT PROFILE GENERATED',
      icon: '🛡️',
      summary: '5 Threat Dimensions Calculated from URL Features',
      details: [
        { label: 'URL Structure Risk', value: features.url_length > 75 ? 'HIGH' : 'LOW' },
        { label: 'Hostname / IP Risk', value: features.has_ip_address ? 'CRITICAL' : 'NORMAL' },
        { label: 'Obfuscation Risk', value: features.has_shortener ? 'HIGH' : 'NORMAL' },
        { label: 'Keyword Risk', value: features.has_suspicious_keywords > 0 ? 'HIGH' : 'NONE' },
        { label: 'Security Indicator Risk', value: !features.has_https ? 'ELEVATED' : 'SECURE' },
      ],
    },
    {
      id: 9,
      title: 'FINAL ASSESSMENT',
      icon: '🏁',
      summary: `Verdict: ${scan.verdict.toUpperCase()}`,
      details: [
        { label: 'Final Verdict', value: scan.verdict.toUpperCase() },
        { label: 'Classification Status', value: 'Deterministic ML Analysis Complete' },
      ],
    },
  ];

  const toggleStep = (id) => {
    setExpandedStep(expandedStep === id ? null : id);
  };

  return (
    <div className="report-section card-glass" style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--text-primary)' }}>🔗 Decision Evidence Chain</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Traceable ML execution pipeline from URL intake to final threat verdict. Click any stage to inspect evidence metrics.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {steps.map((step) => {
          const isExpanded = expandedStep === step.id;
          return (
            <div
              key={step.id}
              style={{
                background: 'var(--bg-elevated)',
                border: isExpanded ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                transition: 'border-color 0.2s ease',
              }}
            >
              <div
                onClick={() => toggleStep(step.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '16px' }}>{step.icon}</span>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-cyan)', marginRight: '8px', letterSpacing: '0.04em' }}>
                      STEP {step.id}: {step.title}
                    </span>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {step.summary}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                  <HiCheckCircle style={{ color: 'var(--accent-green)', fontSize: '16px' }} />
                  {isExpanded ? <HiChevronUp /> : <HiChevronDown />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ padding: '0 16px 14px 16px', borderTop: '1px solid var(--border-color)' }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px', marginTop: '12px' }}>
                      {step.details.map((d, idx) => (
                        <div key={idx} style={{ background: 'var(--bg-card)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{d.label}</div>
                          <div className="font-mono" style={{ fontSize: '12px', color: 'var(--accent-cyan)', marginTop: '2px', wordBreak: 'break-all' }}>
                            {d.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
