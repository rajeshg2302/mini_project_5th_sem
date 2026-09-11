import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { runEvidenceFusion, getSeverityColor, getTierBadgeStyle } from '../../utils/evidenceFusion';

/**
 * Analyst Decision Assistant — Phase 13
 *
 * Deterministically generates analyst guidance from scan evidence.
 * Sections:
 *   - WHY IS THIS URL SUSPICIOUS?
 *   - SUPPORTING EVIDENCE
 *   - WHAT SHOULD BE INVESTIGATED NEXT?
 *   - WHAT EVIDENCE IS MISSING?
 *   - LIMITATIONS
 *
 * No external AI. No LLM calls. All content derived from feature values.
 */
export default function AnalystDecisionAssistant({ scanReport }) {
  const fusion = useMemo(() => runEvidenceFusion(scanReport), [scanReport]);

  if (!scanReport || !fusion) return null;

  const {
    analystDecision,
    activeAttackIndicators,
    evidenceChain,
    missingEvidence,
    mlRiskScore,
    mlVerdict,
    fusionVerdict,
    evidenceStrength,
    mlModelAgreement,
  } = fusion;

  const features = scanReport?.features || {};
  const topRiskFeatures = evidenceChain.filter((e) => e.impact === 'increases_risk').slice(0, 5);
  const topSafeFeatures = evidenceChain.filter((e) => e.impact === 'decreases_risk').slice(0, 3);

  // ── Generate "Why Suspicious" points ─────────────────────────────────────
  const whySuspicious = [];
  if (activeAttackIndicators.length > 0) {
    activeAttackIndicators.forEach((ind) => {
      whySuspicious.push({
        icon: ind.severity === 'CRITICAL' ? '🚨' : ind.severity === 'HIGH' ? '⚠️' : '🔎',
        severity: ind.severity,
        point: `${ind.name} detected (${ind.tactic})`,
        detail: ind.description,
        feature: `Feature value: ${typeof ind.featureValue === 'number' ? ind.featureValue.toFixed ? ind.featureValue.toFixed(3) : ind.featureValue : ind.featureValue}`,
      });
    });
  }
  if (whySuspicious.length === 0) {
    whySuspicious.push({
      icon: '✅',
      severity: 'LOW',
      point: 'No structural phishing indicators detected',
      detail: 'URL structure does not match known obfuscation or credential harvesting patterns.',
      feature: '',
    });
  }

  // ── Next investigative steps ──────────────────────────────────────────────
  const nextSteps = [];
  if (features.has_ip_address >= 1) {
    nextSteps.push({ priority: 'HIGH', action: 'Verify host ownership', reason: 'IP-based hostname bypasses DNS reputation checks. Reverse-lookup and validate the hosting entity.' });
  }
  if (features.has_shortener >= 1) {
    nextSteps.push({ priority: 'HIGH', action: 'Expand shortened URL', reason: 'Use a trusted URL expander (e.g., unshorten.it) to reveal the real destination domain.' });
  }
  if (features.has_suspicious_keywords > 0) {
    nextSteps.push({ priority: 'HIGH', action: 'Inspect page content for login forms', reason: 'Credential-trigger keywords in the URL path suggest a potential login harvesting page.' });
  }
  if (features.num_subdomains > 2) {
    nextSteps.push({ priority: 'MEDIUM', action: 'Verify root domain authenticity', reason: `${features.num_subdomains} subdomains detected. Check if the root domain matches the claimed brand.` });
  }
  if (mlVerdict !== fusionVerdict) {
    nextSteps.push({ priority: 'HIGH', action: 'Investigate ML vs Evidence divergence', reason: `ML verdict (${mlVerdict}) differs from Evidence Fusion verdict (${fusionVerdict}). This URL may be an edge case not well-represented in training data.` });
  }
  if (mlModelAgreement.dissent) {
    nextSteps.push({ priority: 'MEDIUM', action: 'Review model disagreement', reason: `${mlModelAgreement.phishingVotes}/${mlModelAgreement.totalModels} models voted Phishing. Model dissent requires analyst verification.` });
  }
  if (nextSteps.length === 0) {
    nextSteps.push({ priority: 'LOW', action: 'Standard monitoring', reason: 'No specific investigation triggers detected. Maintain routine URL monitoring.' });
  }

  // ── Contextual recommendations ────────────────────────────────────────────
  const recommendations = [];
  if (mlVerdict === 'Phishing' || fusionVerdict === 'Phishing') {
    recommendations.push({ priority: 'CRITICAL', icon: '🚫', action: 'DO NOT enter credentials or personal information on this website.' });
    recommendations.push({ priority: 'HIGH', icon: '📋', action: 'Record this URL as a phishing investigation case and escalate to security team.' });
  }
  if (mlVerdict === 'Suspicious' || fusionVerdict === 'Suspicious') {
    recommendations.push({ priority: 'HIGH', icon: '🔍', action: 'Verify destination domain independently before any interaction.' });
    recommendations.push({ priority: 'MEDIUM', icon: '🛡️', action: 'Avoid entering sensitive information until the URL is confirmed safe.' });
  }
  if (features.has_shortener >= 1) {
    recommendations.push({ priority: 'HIGH', icon: '🔗', action: 'Expand shortened URL using a trusted expander before sharing or clicking.' });
  }
  if (!features.has_https || features.has_https === 0) {
    recommendations.push({ priority: 'MEDIUM', icon: '🔓', action: 'Connection is unencrypted (HTTP). Any data submitted will be transmitted in plaintext.' });
  }
  if (recommendations.length === 0) {
    recommendations.push({ priority: 'LOW', icon: '✅', action: 'No specific action required. Standard security hygiene applies.' });
  }

  const urgencyColors = {
    IMMEDIATE: '#ef4444',
    ELEVATED: '#f97316',
    LOW: '#22c55e',
    MEDIUM: '#eab308',
    HIGH: '#f97316',
    CRITICAL: '#ef4444',
  };

  const actionBg = {
    IMMEDIATE: 'rgba(239,68,68,0.1)',
    ELEVATED: 'rgba(249,115,22,0.08)',
    HIGH: 'rgba(249,115,22,0.08)',
    MEDIUM: 'rgba(234,179,8,0.08)',
    CRITICAL: 'rgba(239,68,68,0.12)',
    LOW: 'rgba(34,197,94,0.08)',
  };

  return (
    <div className="report-section" style={{ marginBottom: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0 }}>🧑‍💻 Analyst Decision Assistant</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Deterministic analyst guidance derived from scan evidence — no LLM, no external AI
          </p>
        </div>
        <div style={{
          padding: '8px 16px',
          background: actionBg[analystDecision.urgency] || 'var(--bg-card)',
          border: `1px solid ${urgencyColors[analystDecision.urgency] || 'var(--border-color)'}44`,
          borderRadius: 'var(--radius-sm)',
        }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended Action</div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: urgencyColors[analystDecision.urgency], letterSpacing: '0.03em' }}>
            {analystDecision.recommendedAction}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Urgency: {analystDecision.urgency} · Confidence: {analystDecision.confidence}</div>
        </div>
      </div>

      {/* Rationale banner */}
      <div style={{
        padding: '12px 16px', marginBottom: '20px',
        background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-color)',
        fontSize: '13px', color: 'var(--text-secondary)',
        borderLeft: `3px solid ${urgencyColors[analystDecision.urgency] || 'var(--accent-cyan)'}`,
      }}>
        <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Decision Rationale</strong>
        {analystDecision.rationale}
        {analystDecision.divergence && (
          <div style={{
            marginTop: '8px', padding: '6px 10px',
            background: 'rgba(234,179,8,0.08)', borderRadius: '4px',
            border: '1px solid rgba(234,179,8,0.25)', fontSize: '12px',
            color: 'var(--accent-yellow)',
          }}>
            ⚡ ML vs Evidence Divergence — ML: {mlVerdict} | Evidence Fusion: {fusionVerdict}
          </div>
        )}
      </div>

      {/* Section 1: Why Suspicious */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-cyan)', marginBottom: '12px' }}>
          🔬 WHY IS THIS URL {mlVerdict === 'Safe' && fusionVerdict === 'Safe' ? 'CLASSIFIED AS SAFE' : 'FLAGGED'}?
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {whySuspicious.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{
                display: 'flex', gap: '12px', padding: '10px 14px',
                background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
              }}
            >
              <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.point}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.detail}</div>
                {item.feature && (
                  <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                    {item.feature}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Section 2: Supporting Evidence */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-cyan)', marginBottom: '12px' }}>
          📋 SUPPORTING EVIDENCE
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
          {/* Risk-increasing features */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--accent-red)', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>
              Risk Factors ({topRiskFeatures.length})
            </div>
            {topRiskFeatures.map((f, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 10px', marginBottom: '4px',
                background: 'rgba(239,68,68,0.06)', borderRadius: '4px',
                border: '1px solid rgba(239,68,68,0.15)', fontSize: '12px',
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>{f.feature.replace(/_/g, ' ')}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                  {typeof f.value === 'number' ? (Number.isInteger(f.value) ? f.value : f.value.toFixed(3)) : String(f.value)}
                </span>
              </div>
            ))}
          </div>

          {/* Protective features */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>
              Protective Factors ({topSafeFeatures.length})
            </div>
            {topSafeFeatures.map((f, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 10px', marginBottom: '4px',
                background: 'rgba(34,197,94,0.06)', borderRadius: '4px',
                border: '1px solid rgba(34,197,94,0.15)', fontSize: '12px',
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>{f.feature.replace(/_/g, ' ')}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
                  {typeof f.value === 'number' ? (Number.isInteger(f.value) ? f.value : f.value.toFixed(3)) : String(f.value)}
                </span>
              </div>
            ))}
            {topSafeFeatures.length === 0 && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 10px' }}>
                No significant protective features detected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Next Steps */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-cyan)', marginBottom: '12px' }}>
          🔭 WHAT SHOULD BE INVESTIGATED NEXT?
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {nextSteps.map((step, i) => (
            <div key={i} style={{
              display: 'flex', gap: '14px', padding: '10px 14px',
              background: actionBg[step.priority] || 'var(--bg-card)',
              border: `1px solid ${urgencyColors[step.priority] || 'var(--border-color)'}33`,
              borderRadius: 'var(--radius-sm)',
            }}>
              <span style={{
                fontSize: '11px', fontWeight: '800', padding: '3px 8px',
                borderRadius: '3px', height: 'fit-content', flexShrink: 0,
                background: `${urgencyColors[step.priority]}22`,
                border: `1px solid ${urgencyColors[step.priority] || '#666'}44`,
                color: urgencyColors[step.priority] || 'var(--text-muted)',
                letterSpacing: '0.05em',
              }}>
                {step.priority}
              </span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{step.action}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{step.reason}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Actionable Recommendations */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-cyan)', marginBottom: '12px' }}>
          🛡️ CONTEXTUAL RECOMMENDATIONS
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
          {recommendations.map((rec, i) => (
            <div key={i} style={{
              display: 'flex', gap: '10px', padding: '10px 14px',
              background: actionBg[rec.priority] || 'var(--bg-card)',
              border: `1px solid ${urgencyColors[rec.priority] || 'var(--border-color)'}33`,
              borderRadius: 'var(--radius-sm)',
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{rec.icon}</span>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{rec.action}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 5: Missing Evidence */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '12px' }}>
          ❓ WHAT EVIDENCE IS MISSING?
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {missingEvidence.slice(0, 4).map((gap, i) => (
            <div key={i} style={{
              display: 'flex', gap: '12px', padding: '10px 14px',
              background: 'var(--bg-card)',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <span style={{ fontSize: '14px', flexShrink: 0 }}>🔒</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {gap.gap} <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '400' }}>— {gap.category}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{gap.impact}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 6: Limitations */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(100,100,100,0.06)',
        border: '1px solid rgba(100,100,100,0.15)',
        borderRadius: 'var(--radius-sm)',
      }}>
        <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '10px' }}>
          ⚖️ LIMITATIONS
        </h4>
        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.7' }}>
          <li>Analysis is restricted to URL features extracted at scan time. Page content, SSL certificates, and WHOIS data are not inspected.</li>
          <li>ML model verdicts are probabilistic and may produce false positives or false negatives on unseen URL patterns.</li>
          <li>Evidence Strength is calculated from feature weights and is independent of — not a replacement for — the ML risk score.</li>
          <li>This assistant generates content deterministically from feature values. No LLM, external AI, or live threat feeds are used.</li>
          <li>Phishing campaigns evolve rapidly. A URL classified as Safe today may later be weaponized.</li>
        </ul>
      </div>
    </div>
  );
}
