import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { runEvidenceFusion, getSeverityColor, getTierBadgeStyle } from '../../utils/evidenceFusion';
import { calculateThreatProfile } from '../../services/threatIntelligence';

/**
 * Threat Evidence Summary — Phase 13
 *
 * Six-signal evidence panel covering:
 *   ML SIGNAL, URL STRUCTURE, HOSTNAME, OBFUSCATION, KEYWORDS, SECURITY
 *
 * Each panel shows actual severity, status, and evidence values.
 */
export default function ThreatEvidenceSummary({ scanReport }) {
  const fusion = useMemo(() => runEvidenceFusion(scanReport), [scanReport]);
  const threatProfile = useMemo(() => calculateThreatProfile(scanReport?.features), [scanReport?.features]);

  if (!scanReport || !fusion) return null;

  const features = scanReport?.features || {};
  const { mlRiskScore, mlVerdict, mlModelAgreement, evidenceStrength } = fusion;

  const panels = [
    {
      id: 'ml_signal',
      icon: '🤖',
      label: 'ML SIGNAL',
      description: 'Ensemble model output',
      score: mlRiskScore,
      level: mlRiskScore >= 70 ? 'CRITICAL' : mlRiskScore >= 40 ? 'MEDIUM' : 'LOW',
      status: mlVerdict,
      evidence: [
        `Verdict: ${mlVerdict}`,
        `Risk score: ${mlRiskScore}/100`,
        `Model agreement: ${mlModelAgreement.agreementLevel}`,
        `${mlModelAgreement.phishingVotes}/${mlModelAgreement.totalModels} voted Phishing`,
      ],
    },
    {
      id: 'structure',
      icon: '🔗',
      label: 'URL STRUCTURE',
      description: 'Length, depth, slashes, query params',
      score: threatProfile.structure?.score ?? 0,
      level: threatProfile.structure?.level ?? 'LOW',
      status: threatProfile.structure?.level ?? 'LOW',
      evidence: [
        `URL length: ${features.url_length ?? 'N/A'}`,
        `Path length: ${features.path_length ?? 'N/A'}`,
        `Slashes: ${features.num_slashes ?? 'N/A'}`,
        `Query params: ${features.num_query_params ?? 'N/A'}`,
      ],
    },
    {
      id: 'hostname',
      icon: '🌐',
      label: 'HOSTNAME',
      description: 'IP, subdomains, hyphens, TLD',
      score: threatProfile.hostname?.score ?? 0,
      level: threatProfile.hostname?.level ?? 'LOW',
      status: threatProfile.hostname?.level ?? 'LOW',
      evidence: [
        `IP address: ${features.has_ip_address ? 'YES ⚠' : 'No'}`,
        `Subdomains: ${features.num_subdomains ?? 'N/A'}`,
        `Domain length: ${features.domain_length ?? 'N/A'}`,
        `Hyphens: ${features.num_hyphens ?? 'N/A'}`,
      ],
    },
    {
      id: 'obfuscation',
      icon: '🎭',
      label: 'OBFUSCATION',
      description: 'Entropy, shortener, @, special chars',
      score: threatProfile.obfuscation?.score ?? 0,
      level: threatProfile.obfuscation?.level ?? 'LOW',
      status: threatProfile.obfuscation?.level ?? 'LOW',
      evidence: [
        `Shortener: ${features.has_shortener ? 'YES ⚠' : 'No'}`,
        `@ symbols: ${features.num_at_symbols ?? 0}`,
        `URL entropy: ${features.url_entropy?.toFixed?.(2) ?? features.url_entropy ?? 'N/A'}`,
        `Special chars: ${features.special_char_ratio?.toFixed?.(3) ?? 'N/A'}`,
      ],
    },
    {
      id: 'keywords',
      icon: '🔑',
      label: 'KEYWORDS',
      description: 'Suspicious credential trigger words',
      score: threatProfile.keyword?.score ?? 0,
      level: threatProfile.keyword?.level ?? 'LOW',
      status: threatProfile.keyword?.level ?? 'LOW',
      evidence: [
        `Suspicious keywords: ${features.has_suspicious_keywords ?? 0}`,
        features.has_suspicious_keywords > 0
          ? 'Credential-trigger terms detected in URL path'
          : 'No credential-trigger terms found',
      ],
    },
    {
      id: 'security',
      icon: '🔐',
      label: 'SECURITY',
      description: 'HTTPS status, suspicious TLD',
      score: threatProfile.security?.score ?? 0,
      level: threatProfile.security?.level ?? 'LOW',
      status: threatProfile.security?.level ?? 'LOW',
      evidence: [
        `HTTPS: ${features.has_https ? 'Active ✅' : 'Missing ⚠'}`,
        `Suspicious TLD: ${features.has_suspicious_tld ? 'YES ⚠' : 'No'}`,
      ],
    },
  ];

  const getScoreColor = (level) => {
    switch (level) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH':     return '#f97316';
      case 'MEDIUM':   return '#eab308';
      case 'GUARDED':  return '#06b6d4';
      default:         return '#22c55e';
    }
  };

  return (
    <div className="report-section" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ margin: 0 }}>🛡️ Threat Evidence Summary</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Six-signal evidence breakdown derived from extracted URL features
          </p>
        </div>
        <div style={{
          padding: '6px 14px',
          background: getTierBadgeStyle(evidenceStrength.level).bg,
          border: `1px solid ${getTierBadgeStyle(evidenceStrength.level).border}`,
          borderRadius: '6px',
          fontSize: '11px', fontWeight: '800',
          color: getTierBadgeStyle(evidenceStrength.level).color,
          letterSpacing: '0.05em',
        }}>
          EVIDENCE STRENGTH: {evidenceStrength.level}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '14px' }}>
        {panels.map((panel, i) => {
          const scoreColor = getScoreColor(panel.level);
          const style = getTierBadgeStyle(panel.level);

          return (
            <motion.div
              key={panel.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
              style={{
                padding: '16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                borderTop: `3px solid ${scoreColor}`,
              }}
            >
              {/* Panel header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                    {panel.icon} {panel.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{panel.description}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: scoreColor, fontFamily: 'var(--font-mono)' }}>
                    {panel.score}
                  </div>
                  <span style={{
                    fontSize: '9px', fontWeight: '800', padding: '2px 6px',
                    borderRadius: '3px', letterSpacing: '0.05em',
                    background: style.bg, color: style.color,
                    border: `1px solid ${style.border}`,
                  }}>
                    {panel.level}
                  </span>
                </div>
              </div>

              {/* Score bar */}
              <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(panel.score, 100)}%` }}
                  transition={{ delay: i * 0.07 + 0.2, duration: 0.6, ease: 'easeOut' }}
                  style={{ height: '100%', background: scoreColor, borderRadius: '2px' }}
                />
              </div>

              {/* Evidence items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {panel.evidence.map((ev, j) => (
                  <div key={j} style={{
                    fontSize: '11px', color: 'var(--text-secondary)',
                    padding: '3px 6px',
                    background: 'var(--bg-elevated)',
                    borderRadius: '3px',
                    fontFamily: ev.includes(':') ? 'var(--font-mono)' : 'inherit',
                  }}>
                    {ev}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
