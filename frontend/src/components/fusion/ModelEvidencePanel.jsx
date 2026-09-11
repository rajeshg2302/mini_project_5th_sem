import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { runEvidenceFusion, getTierBadgeStyle } from '../../utils/evidenceFusion';

/**
 * Model vs Evidence Separation Panel — Phase 13
 *
 * Explicitly displays ML probability and Evidence Strength as SEPARATE
 * independent measurements to prevent conflation.
 *
 * Per spec: Never combine these into a fake "accuracy" value.
 */
export default function ModelEvidencePanel({ scanReport }) {
  const fusion = useMemo(() => runEvidenceFusion(scanReport), [scanReport]);

  if (!scanReport || !fusion) return null;

  const {
    mlRiskScore, mlConfidence, mlVerdict, mlModelAgreement,
    evidenceStrength, intelligenceScore, fusionVerdict,
    activeAttackIndicators,
  } = fusion;

  const phishingProbability = scanReport.phishing_probability != null
    ? scanReport.phishing_probability
    : mlRiskScore / 100;

  const legitimateProbability = 1 - phishingProbability;

  const mlStyle = getTierBadgeStyle(
    mlRiskScore >= 70 ? 'CRITICAL' : mlRiskScore >= 40 ? 'ELEVATED' : 'MINIMAL'
  );
  const evStyle = getTierBadgeStyle(evidenceStrength.level);
  const intStyle = getTierBadgeStyle(intelligenceScore.tier);

  const columns = [
    {
      id: 'ml',
      title: 'MODEL PROBABILITY',
      subtitle: 'ML Ensemble Output',
      icon: '🤖',
      value: `${(phishingProbability * 100).toFixed(1)}%`,
      subvalue: `Phishing probability`,
      extra: `Legitimate: ${(legitimateProbability * 100).toFixed(1)}%`,
      badge: mlVerdict,
      badgeStyle: {
        CRITICAL: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
        HIGH: { bg: 'rgba(249,115,22,0.1)', color: '#f97316', border: 'rgba(249,115,22,0.3)' },
        Phishing: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
        Suspicious: { bg: 'rgba(234,179,8,0.1)', color: '#eab308', border: 'rgba(234,179,8,0.3)' },
        Safe: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
      }[mlVerdict] || mlStyle,
      scoreValue: mlRiskScore,
      scoreMax: 100,
      scoreColor: mlRiskScore >= 70 ? '#ef4444' : mlRiskScore >= 40 ? '#eab308' : '#22c55e',
      note: 'Weighted ensemble of LR, DT, RF, GB model probabilities. This is the authoritative ML output — not a measure of evidence quality.',
      details: (scanReport.model_predictions || []).map((m) => ({
        label: m.model_name,
        value: `${(m.probability * 100).toFixed(1)}% phishing`,
        verdict: m.prediction === 1 ? 'Phishing' : 'Safe',
      })),
    },
    {
      id: 'evidence',
      title: 'EVIDENCE STRENGTH',
      subtitle: 'URL Feature Analysis',
      icon: '🔬',
      value: `${evidenceStrength.score}/100`,
      subvalue: evidenceStrength.level,
      extra: `${evidenceStrength.criticalIndicators} critical · ${evidenceStrength.highIndicators} high indicators`,
      badge: evidenceStrength.level,
      badgeStyle: evStyle,
      scoreValue: evidenceStrength.score,
      scoreMax: 100,
      scoreColor: evStyle.color,
      note: 'Calculated from 22 extracted URL features and their risk weights. Independent of model training data or probability. Does NOT represent model accuracy.',
      details: [
        { label: 'Total Evidence Points', value: `${evidenceStrength.totalEvidencePoints} features`, verdict: '' },
        { label: 'Critical Indicators', value: `${evidenceStrength.criticalIndicators}`, verdict: evidenceStrength.criticalIndicators > 0 ? 'Phishing' : 'Safe' },
        { label: 'High Indicators', value: `${evidenceStrength.highIndicators}`, verdict: evidenceStrength.highIndicators > 0 ? 'Suspicious' : 'Safe' },
        { label: 'Active Indicators', value: `${activeAttackIndicators.length}`, verdict: activeAttackIndicators.length > 2 ? 'Phishing' : activeAttackIndicators.length > 0 ? 'Suspicious' : 'Safe' },
      ],
    },
    {
      id: 'risk',
      title: 'RISK SCORE',
      subtitle: 'Ensemble-Weighted Score',
      icon: '⚖️',
      value: `${mlRiskScore}/100`,
      subvalue: `Risk Level: ${scanReport.risk_level || (mlRiskScore <= 30 ? 'LOW' : mlRiskScore <= 70 ? 'MEDIUM' : 'HIGH')}`,
      extra: `Model confidence: ${(mlConfidence * 100).toFixed(1)}%`,
      badge: scanReport.risk_level || 'N/A',
      badgeStyle: mlStyle,
      scoreValue: mlRiskScore,
      scoreMax: 100,
      scoreColor: mlRiskScore >= 70 ? '#ef4444' : mlRiskScore >= 40 ? '#eab308' : '#22c55e',
      note: 'Authoritative risk score derived from the ML ensemble. Scale: 0 (completely safe) to 100 (confirmed phishing). Cannot be manually altered.',
      details: [
        { label: 'Verdict', value: mlVerdict, verdict: mlVerdict },
        { label: 'Model Agreement', value: mlModelAgreement.agreementLevel, verdict: mlModelAgreement.agreementLevel === 'UNANIMOUS' ? 'Phishing' : 'Suspicious' },
        { label: 'Phishing Votes', value: `${mlModelAgreement.phishingVotes}/${mlModelAgreement.totalModels}`, verdict: mlModelAgreement.phishingVotes > 0 ? 'Phishing' : 'Safe' },
        { label: 'Fusion Verdict', value: fusionVerdict, verdict: fusionVerdict },
      ],
    },
  ];

  return (
    <div className="report-section" style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '18px' }}>
        <h3 style={{ margin: 0 }}>📊 Model Probability vs Evidence Strength</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
          These three measurements are <strong>independent</strong> — combining them into a single "accuracy" figure is misleading and is not done here
        </p>
      </div>

      {/* Key distinction banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '10px', marginBottom: '20px',
        padding: '14px',
        background: 'rgba(6,182,212,0.05)',
        border: '1px solid rgba(6,182,212,0.15)',
        borderRadius: 'var(--radius-sm)',
      }}>
        <div style={{ fontSize: '12px' }}>
          <span style={{ color: '#ef4444', fontWeight: '700' }}>MODEL PROBABILITY</span>
          <span style={{ color: 'var(--text-muted)' }}> = what the trained neural ensemble thinks about this URL</span>
        </div>
        <div style={{ fontSize: '12px' }}>
          <span style={{ color: '#06b6d4', fontWeight: '700' }}>EVIDENCE STRENGTH</span>
          <span style={{ color: 'var(--text-muted)' }}> = how many independent feature signals support the verdict</span>
        </div>
        <div style={{ fontSize: '12px' }}>
          <span style={{ color: '#eab308', fontWeight: '700' }}>RISK SCORE</span>
          <span style={{ color: 'var(--text-muted)' }}> = authoritative weighted output of the ML pipeline</span>
        </div>
      </div>

      {/* Three-column display */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {columns.map((col, i) => (
          <motion.div
            key={col.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.35 }}
            style={{
              padding: '20px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {/* Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.07em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {col.icon} {col.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{col.subtitle}</div>
              </div>
              <span style={{
                fontSize: '10px', fontWeight: '800', padding: '3px 8px',
                borderRadius: '3px', letterSpacing: '0.04em',
                background: col.badgeStyle.bg, color: col.badgeStyle.color,
                border: `1px solid ${col.badgeStyle.border}`,
              }}>
                {col.badge}
              </span>
            </div>

            {/* Main value */}
            <div style={{
              fontSize: '32px', fontWeight: '800', fontFamily: 'var(--font-mono)',
              color: col.scoreColor, marginBottom: '4px',
            }}>
              {col.value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>{col.subvalue}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>{col.extra}</div>

            {/* Score bar */}
            <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden', marginBottom: '14px' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((col.scoreValue / col.scoreMax) * 100, 100)}%` }}
                transition={{ delay: i * 0.1 + 0.3, duration: 0.7, ease: 'easeOut' }}
                style={{ height: '100%', background: col.scoreColor, borderRadius: '3px' }}
              />
            </div>

            {/* Detail rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
              {col.details.map((d, j) => (
                <div key={j} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '4px 8px', background: 'var(--bg-elevated)',
                  borderRadius: '4px', fontSize: '11px',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{d.label}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontWeight: '600',
                    color: d.verdict === 'Phishing' ? '#ef4444' : d.verdict === 'Safe' ? '#22c55e' : d.verdict === 'Suspicious' ? '#eab308' : 'var(--accent-cyan)',
                  }}>
                    {d.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Note */}
            <div style={{
              padding: '8px 10px',
              background: 'var(--bg-elevated)',
              borderRadius: '4px',
              fontSize: '11px', color: 'var(--text-muted)',
              fontStyle: 'italic', lineHeight: '1.5',
            }}>
              {col.note}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Divergence alert */}
      {mlVerdict !== fusionVerdict && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            padding: '12px 16px',
            background: 'rgba(234,179,8,0.08)',
            border: '1px solid rgba(234,179,8,0.3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px', color: 'var(--accent-yellow)',
          }}
        >
          <strong>⚡ ML vs Evidence Divergence Detected</strong>
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
            The ML model returned <strong>{mlVerdict}</strong> while the Evidence Fusion Engine returned <strong>{fusionVerdict}</strong>.
            This divergence may occur when the URL has unusual patterns not well-represented in the training dataset.
            Analyst review is recommended.
          </p>
        </motion.div>
      )}
    </div>
  );
}
