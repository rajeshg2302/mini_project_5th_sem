import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { runEvidenceFusion, getSeverityColor, getTierBadgeStyle } from '../../utils/evidenceFusion';

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

/**
 * Attack Indicator Classification — Phase 13
 *
 * Derives attack technique indicators ONLY from actual URL features.
 * Uses neutral "Observed Indicator" language — never "Confirmed Attack Technique".
 * Expandable detail cards with source feature + value.
 */
export default function AttackIndicators({ scanReport }) {
  const fusion = useMemo(() => runEvidenceFusion(scanReport), [scanReport]);
  const [expanded, setExpanded] = useState(null);

  if (!scanReport || !fusion) return null;

  const { activeAttackIndicators, mlRiskScore } = fusion;

  if (!activeAttackIndicators || activeAttackIndicators.length === 0) {
    return (
      <div className="report-section" style={{ marginBottom: '24px' }}>
        <h3>🔍 Attack Indicator Classification</h3>
        <div style={{
          padding: '24px', textAlign: 'center',
          background: 'rgba(34, 197, 94, 0.05)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          borderRadius: 'var(--radius-sm)',
        }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-green)' }}>
            No Observable Attack Indicators Detected
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            URL features do not match known phishing obfuscation or credential harvesting patterns.
          </div>
        </div>
      </div>
    );
  }

  const sorted = [...activeAttackIndicators].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
  );

  // Group by tactic
  const grouped = sorted.reduce((acc, ind) => {
    const key = ind.tactic || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(ind);
    return acc;
  }, {});

  const severityBg = {
    CRITICAL: 'rgba(239,68,68,0.1)',
    HIGH: 'rgba(249,115,22,0.1)',
    MEDIUM: 'rgba(234,179,8,0.08)',
    LOW: 'rgba(6,182,212,0.08)',
  };
  const severityBorder = {
    CRITICAL: 'rgba(239,68,68,0.3)',
    HIGH: 'rgba(249,115,22,0.3)',
    MEDIUM: 'rgba(234,179,8,0.25)',
    LOW: 'rgba(6,182,212,0.2)',
  };

  return (
    <div className="report-section" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ margin: 0 }}>🔍 Attack Indicator Classification</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Observed indicators derived from extracted URL features — not confirmed attack techniques
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['CRITICAL', 'HIGH', 'MEDIUM'].map((s) => {
            const count = activeAttackIndicators.filter((i) => i.severity === s).length;
            if (!count) return null;
            const style = getTierBadgeStyle(s);
            return (
              <span key={s} style={{
                fontSize: '11px', fontWeight: '800', padding: '4px 10px',
                borderRadius: '4px', border: `1px solid ${style.border}`,
                background: style.bg, color: style.color,
              }}>
                {count} {s}
              </span>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{
        padding: '10px 14px', marginBottom: '16px',
        background: 'rgba(6,182,212,0.06)',
        border: '1px solid rgba(6,182,212,0.2)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '12px', color: 'var(--text-secondary)',
      }}>
        ⚠ <strong>Analysis Scope:</strong> All indicators are inferred from URL structure features only.
        Indicators are <em>observations</em>, not confirmed attack classifications.
        Domain-age, SSL certificate, or page content data are not available.
      </div>

      {/* Grouped indicator cards */}
      {Object.entries(grouped).map(([tactic, indicators]) => (
        <div key={tactic} style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '11px', fontWeight: '800', letterSpacing: '0.07em',
            color: 'var(--text-muted)', textTransform: 'uppercase',
            marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ width: '24px', height: '1px', background: 'var(--border-color)', display: 'inline-block' }} />
            TACTIC: {tactic}
            <span style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {indicators.map((ind, i) => {
              const isOpen = expanded === `${tactic}_${i}`;
              const sev = ind.severity;
              const color = getSeverityColor(sev);

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  style={{
                    border: `1px solid ${severityBorder[sev] || 'var(--border-color)'}`,
                    background: severityBg[sev] || 'var(--bg-card)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Indicator header row */}
                  <div
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 16px', cursor: 'pointer', userSelect: 'none',
                    }}
                    onClick={() => setExpanded(isOpen ? null : `${tactic}_${i}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Severity dot */}
                      <div style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: color, boxShadow: `0 0 8px ${color}`,
                        flexShrink: 0,
                      }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          Observed Indicator: {ind.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {ind.mitre} — Feature value: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{ind.featureValue}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '10px', fontWeight: '800', letterSpacing: '0.06em',
                        padding: '3px 8px', borderRadius: '3px',
                        border: `1px solid ${severityBorder[sev]}`,
                        background: severityBg[sev], color,
                      }}>
                        {sev}
                      </span>
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>▶</span>
                    </div>
                  </div>

                  {/* Expandable detail */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{
                          padding: '12px 16px 14px',
                          borderTop: `1px solid ${severityBorder[sev] || 'var(--border-color)'}`,
                          background: 'var(--bg-card)',
                        }}>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                            {ind.description}
                          </p>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                            <div style={{ fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>ATT&CK ID: </span>
                              <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{ind.id}</span>
                            </div>
                            <div style={{ fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Tactic: </span>
                              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{ind.tactic}</span>
                            </div>
                            <div style={{ fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Observed Value: </span>
                              <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                                {typeof ind.featureValue === 'number'
                                  ? (Number.isInteger(ind.featureValue) ? ind.featureValue : ind.featureValue.toFixed(3))
                                  : String(ind.featureValue)}
                              </span>
                            </div>
                          </div>

                          <div style={{
                            marginTop: '10px', padding: '8px 12px',
                            background: 'rgba(0,0,0,0.15)',
                            borderRadius: '4px', fontSize: '11px',
                            color: 'var(--text-muted)', fontStyle: 'italic',
                          }}>
                            🔬 This indicator is derived from URL feature extraction only.
                            It represents a structural observation, not a confirmed malicious action.
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{
        marginTop: '4px', padding: '8px 14px',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '11px', color: 'var(--text-muted)',
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px',
      }}>
        <span>{activeAttackIndicators.length} indicator(s) observed from URL features · ML Risk Score: {mlRiskScore}/100</span>
        <span style={{ fontStyle: 'italic' }}>Click any indicator to expand source details</span>
      </div>
    </div>
  );
}
