import React from 'react';

export default function InvestigationAssessment({ scan }) {
  if (!scan) return null;

  const features = scan.features || {};
  const verdict = scan.verdict || 'Safe';
  const riskScore = scan.risk_score || 0;
  const confidence = scan.confidence !== undefined ? (scan.confidence * 100).toFixed(1) : (riskScore).toFixed(1);

  // Generate deterministic primary findings from actual extracted features
  const primaryFindings = [];
  if (features.has_ip_address) {
    primaryFindings.push('Host identifier relies directly on an unindexed IPv4 address rather than a registered domain name.');
  }
  if ((features.has_suspicious_keywords || 0) > 0) {
    primaryFindings.push(`Contains ${features.has_suspicious_keywords} high-confidence credential harvesting terms in the URL path/query.`);
  }
  if (features.has_shortener) {
    primaryFindings.push('URL utilizes a shortening / redirection service to obscure the final landing destination.');
  }
  if ((features.num_subdomains || 0) > 2) {
    primaryFindings.push(`Excessive subdomain depth (${features.num_subdomains} subdomains) detected, consistent with brand-spoofing patterns.`);
  }
  if (!features.has_https) {
    primaryFindings.push('Connection uses cleartext HTTP protocol without SSL/TLS security encryption certificates.');
  }
  if (features.has_suspicious_tld) {
    primaryFindings.push('Domain uses a top-level domain frequently associated with automated threat campaigns.');
  }
  if (primaryFindings.length === 0) {
    if (verdict.toLowerCase() === 'phishing') {
      primaryFindings.push('Extracted lexical ratios (high entropy, digit density) align with trained phishing feature distributions.');
    } else {
      primaryFindings.push('No critical phishing indicators detected during feature extraction.');
      primaryFindings.push('Standard structural length and legitimate domain formatting observed.');
    }
  }

  // Supporting Evidence
  const supportingEvidence = [
    `Calculated Phishing Probability: ${riskScore}% (Ensemble Model Confidence: ${confidence}%)`,
    `Shannon URL Entropy: ${typeof features.url_entropy === 'number' ? features.url_entropy.toFixed(2) : (features.url_entropy || 'N/A')}`,
    `Total Character Length: ${features.url_length || 0} chars (Domain: ${features.domain_length || 0} chars, Path: ${features.path_length || 0} chars)`,
    `Special Character Ratio: ${((features.special_char_ratio || 0) * 100).toFixed(1)}% (${features.num_hyphens || 0} hyphens, ${features.num_at_symbols || 0} @ symbols)`,
  ];

  // Dynamic Analyst Reasoning Block
  const reasoningText = verdict.toLowerCase() === 'phishing'
    ? `Multiple independent URL characteristics indicate elevated phishing risk. Specifically, ${primaryFindings[0].toLowerCase()} Combined with an ensemble model confidence of ${confidence}%, this URL presents a significant security risk for credential harvesting or social engineering.`
    : verdict.toLowerCase() === 'suspicious'
    ? `The analyzed URL exhibits suspicious lexical and structural features. While not conclusively malicious, indicators such as ${primaryFindings[0].toLowerCase()} warrant elevated analyst caution prior to interaction.`
    : `Analysis of 22 extracted URL features identified no significant phishing indicators. The domain formatting, protocol security, and lexical entropy remain within normal legitimate parameters.`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
      {/* AI Security Assessment */}
      <div className="report-section card-glass">
        <div style={{ marginBottom: '14px' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--text-primary)' }}>🤖 AI Security Assessment</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Deterministic analytical interpretation synthesized from 22 extracted feature metrics and ML model probability.
          </p>
        </div>

        <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-sm)', borderLeft: `4px solid ${verdict.toLowerCase() === 'phishing' ? 'var(--accent-red)' : verdict.toLowerCase() === 'suspicious' ? 'var(--accent-yellow)' : 'var(--accent-green)'}`, marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
            "{verdict.toLowerCase() === 'phishing' ? 'The analyzed URL exhibits multiple indicators associated with elevated phishing risk.' : verdict.toLowerCase() === 'suspicious' ? 'The analyzed URL exhibits suspicious indicators requiring careful analyst review.' : 'The analyzed URL displays structural characteristics consistent with legitimate web services.'}"
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '8px' }}>
              PRIMARY FINDINGS
            </h4>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {primaryFindings.map((finding, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{finding}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '8px' }}>
              SUPPORTING EVIDENCE
            </h4>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {supportingEvidence.map((evidence, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{evidence}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Analyst Conclusion Block */}
      <div className="report-section card-glass" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '12px' }}>
          📌 ANALYST ASSESSMENT & CONCLUSION
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>OVERALL RISK</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: verdict.toLowerCase() === 'phishing' ? 'var(--accent-red)' : verdict.toLowerCase() === 'suspicious' ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>
              {scan.severity || (verdict.toLowerCase() === 'phishing' ? 'HIGH' : 'LOW')} ({riskScore}/100)
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>FINAL VERDICT</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {verdict.toUpperCase()}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>MODEL CONFIDENCE</div>
            <div className="font-mono" style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
              {confidence}%
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>ANALYST REASONING</div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0, background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: '4px' }}>
            {reasoningText}
          </p>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>RECOMMENDED ACTION</div>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {verdict.toLowerCase() !== 'safe' ? (
              <>
                <li>Avoid submitting credentials, passwords, or personal identity information on this destination.</li>
                <li>Independently verify the domain name through official search engines or organization portals.</li>
                <li>Do not proceed if the destination URL was received via unsolicited or unexpected communication.</li>
              </>
            ) : (
              <>
                <li>Standard caution recommended. Always confirm recipient address before providing sensitive data.</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
