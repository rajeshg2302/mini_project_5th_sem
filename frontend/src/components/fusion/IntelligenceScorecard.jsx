import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { runEvidenceFusion, getSeverityColor, getTierBadgeStyle } from '../../utils/evidenceFusion';
import { calculateThreatProfile } from '../../services/threatIntelligence';

/**
 * Intelligence Scorecard — Phase 13
 *
 * Displays ML signal, 5 threat-profile dimensions, evidence strength,
 * and the composite intelligence score tier.
 *
 * Sources: real scan features + fusion engine output.
 * NEVER combines ML probability with evidence strength into a fake accuracy.
 */
export default function IntelligenceScorecard({ scanReport }) {
  const fusion = useMemo(() => runEvidenceFusion(scanReport), [scanReport]);
  const threatProfile = useMemo(
    () => calculateThreatProfile(scanReport?.features),
    [scanReport?.features]
  );

  if (!scanReport || !fusion) return null;

  const { mlRiskScore, mlConfidence, evidenceStrength, intelligenceScore, mlModelAgreement } = fusion;

  const signals = [
    {
      label: 'ML SIGNAL',
      sublabel: 'Model Ensemble Output',
      score: mlRiskScore,
      max: 100,
      detail: `${(mlConfidence * 100).toFixed(1)}% confidence · ${mlModelAgreement.agreementLevel} agreement`,
      color: getSeverityColor(mlRiskScore >= 70 ? 'CRITICAL' : mlRiskScore >= 40 ? 'MEDIUM' : 'LOW'),
      note: 'Model probability — not evidence strength',
    },
    {
      label: 'URL STRUCTURE',
      sublabel: 'Length, depth, slashes, params',
      score: threatProfile.structure?.score ?? 0,
      max: 100,
      detail: `Risk: ${threatProfile.structure?.level ?? 'N/A'}`,
      color: getSeverityColor(threatProfile.structure?.level),
    },
    {
      label: 'HOSTNAME / DOMAIN',
      sublabel: 'IP, subdomains, hyphens, TLD',
      score: threatProfile.hostname?.score ?? 0,
      max: 100,
      detail: `Risk: ${threatProfile.hostname?.level ?? 'N/A'}`,
      color: getSeverityColor(threatProfile.hostname?.level),
    },
    {
      label: 'OBFUSCATION',
      sublabel: 'Entropy, shortener, @, special chars',
      score: threatProfile.obfuscation?.score ?? 0,
      max: 100,
      detail: `Risk: ${threatProfile.obfuscation?.level ?? 'N/A'}`,
      color: getSeverityColor(threatProfile.obfuscation?.level),
    },
    {
      label: 'KEYWORD SIGNAL',
      sublabel: 'Suspicious credential trigger words',
      score: threatProfile.keyword?.score ?? 0,
      max: 100,
      detail: `Risk: ${threatProfile.keyword?.level ?? 'N/A'}`,
      color: getSeverityColor(threatProfile.keyword?.level),
    },
    {
      label: 'SECURITY INDICATORS',
      sublabel: 'HTTPS status, suspicious TLD',
      score: threatProfile.security?.score ?? 0,
      max: 100,
      detail: `Risk: ${threatProfile.security?.level ?? 'N/A'}`,
      color: getSeverityColor(threatProfile.security?.level),
    },
  ];

  const tierStyle = getTierBadgeStyle(intelligenceScore.tier);
  const evidenceStyle = getTierBadgeStyle(evidenceStrength.level);

  return (
    <div className="report-section" style={{ marginBottom: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0 }}>🎯 Intelligence Scorecard</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Multi-signal threat analysis derived from URL features — ML probability is tracked separately from evidence strength
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Evidence Strength badge */}
          <div style={{
            padding: '6px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: '800',
            letterSpacing: '0.06em', border: `1px solid ${evidenceStyle.border}`,
            background: evidenceStyle.bg, color: evidenceStyle.color,
          }}>
            EVIDENCE: {evidenceStrength.level}
          </div>
          {/* Intelligence Tier badge */}
          <div style={{
            padding: '6px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: '800',
            letterSpacing: '0.06em', border: `1px solid ${tierStyle.border}`,
            background: tierStyle.bg, color: tierStyle.color,
          }}>
            INTEL TIER: {intelligenceScore.tier}
          </div>
        </div>
      </div>

      {/* Signal Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {signals.map((sig, i) => (
          <motion.div
            key={sig.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            style={{
              padding: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Colored left accent */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: sig.color, borderRadius: '3px 0 0 3px' }} />

            <div style={{ paddingLeft: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {sig.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{sig.sublabel}</div>
                </div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: sig.color, fontFamily: 'var(--font-mono)' }}>
                  {sig.score}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: '5px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(sig.score, 100)}%` }}
                  transition={{ delay: i * 0.06 + 0.2, duration: 0.6, ease: 'easeOut' }}
                  style={{ height: '100%', background: sig.color, borderRadius: '3px' }}
                />
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{sig.detail}</div>
              {sig.note && (
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                  ⚠ {sig.note}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom summary row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        padding: '16px',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-color)',
      }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ML Risk Score</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: mlRiskScore >= 70 ? 'var(--accent-red)' : mlRiskScore >= 40 ? 'var(--accent-yellow)' : 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
            {mlRiskScore}/100
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Authoritative ML output</div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Evidence Strength</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: evidenceStyle.color, fontFamily: 'var(--font-mono)' }}>
            {evidenceStrength.score}/100
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Independent of ML probability</div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Intel Score</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: tierStyle.color, fontFamily: 'var(--font-mono)' }}>
            {intelligenceScore.score}/100
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Weighted fusion of all signals</div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model Agreement</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
            {mlModelAgreement.agreementLevel}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {mlModelAgreement.phishingVotes}P / {mlModelAgreement.safeVotes}S of {mlModelAgreement.totalModels} models
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <details style={{ marginTop: '12px' }}>
        <summary style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
          ▶ Intel Score breakdown
        </summary>
        <div style={{
          marginTop: '10px', padding: '12px', background: 'var(--bg-card)',
          borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '12px',
        }}>
          {Object.entries(intelligenceScore.breakdown).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{v}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
