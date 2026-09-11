import React from 'react';

export default function ThreatSeverityMatrix({ features }) {
  if (!features) {
    return (
      <div className="report-section card-glass" style={{ marginBottom: '24px' }}>
        <h3>📊 Threat Severity Matrix</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Feature indicators unavailable for matrix evaluation.</p>
      </div>
    );
  }

  // Derive indicators deterministically from actual 22 features
  const matrix = [
    {
      indicator: 'IP-based Hostname',
      severity: features.has_ip_address ? 'CRITICAL' : 'LOW',
      status: features.has_ip_address ? 'DETECTED' : 'ABSENT',
      evidence: `has_ip_address = ${features.has_ip_address ? '1 (True)' : '0 (False)'}`,
    },
    {
      indicator: 'Credential Trigger Keywords',
      severity: (features.has_suspicious_keywords || 0) > 0 ? 'HIGH' : 'LOW',
      status: (features.has_suspicious_keywords || 0) > 0 ? 'DETECTED' : 'ABSENT',
      evidence: `has_suspicious_keywords = ${features.has_suspicious_keywords || 0}`,
    },
    {
      indicator: 'URL Shortener Obfuscation',
      severity: features.has_shortener ? 'HIGH' : 'LOW',
      status: features.has_shortener ? 'DETECTED' : 'ABSENT',
      evidence: `has_shortener = ${features.has_shortener ? '1 (True)' : '0 (False)'}`,
    },
    {
      indicator: 'URL Obfuscation & Entropy',
      severity: (features.url_entropy || 0) > 4.5 || (features.num_at_symbols || 0) > 0 ? 'HIGH' : (features.url_entropy || 0) > 3.8 ? 'MEDIUM' : 'LOW',
      status: (features.url_entropy || 0) > 4.5 || (features.num_at_symbols || 0) > 0 ? 'DETECTED' : 'NORMAL',
      evidence: `url_entropy = ${typeof features.url_entropy === 'number' ? features.url_entropy.toFixed(2) : (features.url_entropy || 0)}, at_symbols = ${features.num_at_symbols || 0}`,
    },
    {
      indicator: 'Subdomain Complexity',
      severity: (features.num_subdomains || 0) > 3 ? 'HIGH' : (features.num_subdomains || 0) > 2 ? 'MEDIUM' : 'LOW',
      status: (features.num_subdomains || 0) > 2 ? 'ELEVATED' : 'NORMAL',
      evidence: `num_subdomains = ${features.num_subdomains || 0}`,
    },
    {
      indicator: 'URL & Path Length',
      severity: (features.url_length || 0) > 75 ? 'HIGH' : (features.url_length || 0) > 54 ? 'MEDIUM' : 'LOW',
      status: (features.url_length || 0) > 75 ? 'ELEVATED' : 'NORMAL',
      evidence: `url_length = ${features.url_length || 0} chars, path_length = ${features.path_length || 0} chars`,
    },
    {
      indicator: 'Special Character Ratio',
      severity: (features.special_char_ratio || 0) > 0.15 ? 'MEDIUM' : 'LOW',
      status: (features.special_char_ratio || 0) > 0.15 ? 'ELEVATED' : 'NORMAL',
      evidence: `special_char_ratio = ${((features.special_char_ratio || 0) * 100).toFixed(1)}%, hyphens = ${features.num_hyphens || 0}`,
    },
    {
      indicator: 'HTTPS & Security Indicator',
      severity: !features.has_https || features.has_suspicious_tld ? 'HIGH' : 'LOW',
      status: features.has_https ? 'PRESENT (SECURE)' : 'ABSENT (UNENCRYPTED)',
      evidence: `has_https = ${features.has_https ? '1 (True)' : '0 (False)'}, suspicious_tld = ${features.has_suspicious_tld ? '1 (True)' : '0 (False)'}`,
    },
    {
      indicator: 'Domain / Hostname Characteristics',
      severity: (features.domain_length || 0) > 30 ? 'MEDIUM' : 'LOW',
      status: (features.domain_length || 0) > 30 ? 'ELEVATED' : 'NORMAL',
      evidence: `domain_length = ${features.domain_length || 0} chars`,
    },
  ];

  const getSeverityBadgeClass = (sev) => {
    switch (sev) {
      case 'CRITICAL': return 'badge phishing';
      case 'HIGH': return 'badge phishing';
      case 'MEDIUM': return 'badge suspicious';
      default: return 'badge safe';
    }
  };

  return (
    <div className="report-section card-glass" style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--text-primary)' }}>📊 Threat Severity Matrix</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Indicator severity computed deterministically from extracted feature values.
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="history-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>INDICATOR</th>
              <th style={{ textAlign: 'center' }}>SEVERITY</th>
              <th style={{ textAlign: 'center' }}>STATUS</th>
              <th style={{ textAlign: 'left' }}>EXTRACTED EVIDENCE</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>
                  {row.indicator}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className={getSeverityBadgeClass(row.severity)}>
                    {row.severity}
                  </span>
                </td>
                <td style={{ textAlign: 'center', fontSize: '12px', fontWeight: '700', color: row.status.includes('DETECTED') || row.status.includes('ABSENT (UNENCRYPTED)') ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                  {row.status}
                </td>
                <td className="font-mono" style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>
                  {row.evidence}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
