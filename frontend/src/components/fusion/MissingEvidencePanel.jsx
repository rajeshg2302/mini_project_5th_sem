import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { runEvidenceFusion, getSeverityColor } from '../../utils/evidenceFusion';

/**
 * Missing Evidence Panel — Phase 13
 *
 * Clearly displays:
 *   AVAILABLE analysis capabilities (what WAS done)
 *   NOT AVAILABLE analysis capabilities (what CANNOT be done)
 *
 * Never implies unavailable analysis was performed.
 */
export default function MissingEvidencePanel({ scanReport }) {
  const fusion = useMemo(() => runEvidenceFusion(scanReport), [scanReport]);

  if (!scanReport || !fusion) return null;

  const { missingEvidence, featureCount, indicatorCount } = fusion;
  const features = scanReport?.features || {};

  const availableCapabilities = [
    {
      icon: '🔗',
      name: 'URL Structure Analysis',
      detail: `${featureCount} features extracted (length, depth, slashes, query params, entropy)`,
      status: 'COMPLETE',
    },
    {
      icon: '🌐',
      name: 'Domain/Hostname Analysis',
      detail: 'IP address, subdomain count, domain length, hyphens, punycode detection',
      status: 'COMPLETE',
    },
    {
      icon: '🔍',
      name: 'Obfuscation Detection',
      detail: 'URL shortener, @ symbol, URL entropy, path entropy, special character ratio',
      status: 'COMPLETE',
    },
    {
      icon: '🔑',
      name: 'Keyword Analysis',
      detail: 'Suspicious credential-trigger keyword detection in URL path and domain',
      status: 'COMPLETE',
    },
    {
      icon: '🤖',
      name: 'ML Ensemble Prediction',
      detail: 'LR, DT, RF, GB models — weighted ensemble probability and per-model votes',
      status: 'COMPLETE',
    },
    {
      icon: '🧠',
      name: 'SHAP Feature Explanations',
      detail: 'Pseudo-SHAP values per feature ranked by absolute impact on prediction',
      status: 'COMPLETE',
    },
    {
      icon: '📊',
      name: 'Threat Profile Dimensions',
      detail: '5-axis threat profile: Structure, Hostname, Obfuscation, Keyword, Security',
      status: 'COMPLETE',
    },
    {
      icon: '⚗️',
      name: 'Evidence Fusion',
      detail: `${indicatorCount} active indicators fused from feature evidence and ML output`,
      status: 'COMPLETE',
    },
  ];

  const unavailableCapabilities = [
    {
      icon: '🌍',
      name: 'Website DOM / Page Content',
      detail: 'HTML structure, login form detection, iframe presence, JavaScript behavior — not fetched (security guardrail)',
      impact: 'Cannot confirm credential harvesting page layout or drive-by downloads',
      severity: 'HIGH',
    },
    {
      icon: '🔐',
      name: 'TLS Certificate Inspection',
      detail: 'Certificate issuer, expiry date, self-signed detection, certificate transparency',
      impact: 'Cannot verify if HTTPS certificate is from a trusted CA or self-signed',
      severity: 'MEDIUM',
    },
    {
      icon: '📅',
      name: 'WHOIS / Domain Age',
      detail: 'Domain registration date, registrar, WHOIS privacy status — not queried (no external calls)',
      impact: 'Cannot flag newly registered domains (< 30 days), a strong phishing signal',
      severity: 'HIGH',
    },
    {
      icon: '📡',
      name: 'External Threat Intelligence',
      detail: 'VirusTotal, Google Safe Browsing, URLhaus, PhishTank, Shodan',
      impact: 'Cannot cross-reference against live threat intelligence databases',
      severity: 'HIGH',
    },
    {
      icon: '🏢',
      name: 'Hosting Provider Reputation',
      detail: 'ASN ownership, bulletproof hosting detection, TOR exit node check, geolocation',
      impact: 'Cannot detect hosting in known malicious infrastructure regions',
      severity: 'MEDIUM',
    },
    {
      icon: '📧',
      name: 'Email Context / Sender Analysis',
      detail: 'SPF, DKIM, DMARC, sender IP reputation — not available in URL-only analysis',
      impact: 'Cannot verify if URL was delivered via spoofed email sender',
      severity: 'MEDIUM',
    },
  ];

  const severityLabels = { HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#06b6d4' };

  return (
    <div className="report-section" style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '18px' }}>
        <h3 style={{ margin: 0 }}>🔒 Analysis Scope & Missing Evidence</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
          Transparent documentation of what this analysis can and cannot determine
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* AVAILABLE */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px', marginBottom: '12px',
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <span style={{ fontSize: '14px' }}>✅</span>
            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Available Analysis ({availableCapabilities.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {availableCapabilities.map((cap, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex', gap: '10px', padding: '10px 12px',
                  background: 'rgba(34,197,94,0.04)',
                  border: '1px solid rgba(34,197,94,0.12)',
                  borderRadius: '6px',
                }}
              >
                <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>{cap.icon}</span>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{cap.name}</div>
                    <span style={{
                      fontSize: '9px', fontWeight: '800', padding: '1px 6px',
                      background: 'rgba(34,197,94,0.15)', color: '#22c55e',
                      border: '1px solid rgba(34,197,94,0.3)', borderRadius: '3px',
                      letterSpacing: '0.05em', flexShrink: 0, marginLeft: '8px',
                    }}>
                      {cap.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{cap.detail}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* NOT AVAILABLE */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px', marginBottom: '12px',
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <span style={{ fontSize: '14px' }}>🔒</span>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Not Available ({unavailableCapabilities.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {unavailableCapabilities.map((cap, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex', gap: '10px', padding: '10px 12px',
                  background: 'rgba(239,68,68,0.03)',
                  border: '1px dashed rgba(239,68,68,0.2)',
                  borderRadius: '6px',
                }}
              >
                <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px', opacity: 0.5 }}>{cap.icon}</span>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>{cap.name}</div>
                    <span style={{
                      fontSize: '9px', fontWeight: '800', padding: '1px 6px',
                      background: `${severityLabels[cap.severity]}22`,
                      color: severityLabels[cap.severity],
                      border: `1px solid ${severityLabels[cap.severity]}44`,
                      borderRadius: '3px', letterSpacing: '0.05em',
                      flexShrink: 0, marginLeft: '8px',
                    }}>
                      IMPACT: {cap.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{cap.detail}</div>
                  <div style={{ fontSize: '11px', color: severityLabels[cap.severity] || '#f97316', marginTop: '3px', fontStyle: 'italic' }}>
                    → {cap.impact}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Security note */}
      <div style={{
        marginTop: '16px', padding: '10px 16px',
        background: 'rgba(6,182,212,0.05)',
        border: '1px solid rgba(6,182,212,0.15)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '12px', color: 'var(--text-muted)',
      }}>
        🛡️ <strong>Security Guardrails Active:</strong> PhishGuard explicitly prevents remote webpage fetching,
        external threat intelligence queries, and subprocess execution to eliminate SSRF and remote code execution risks.
        This is by design — not a limitation.
      </div>
    </div>
  );
}
