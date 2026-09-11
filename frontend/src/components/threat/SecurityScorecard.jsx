import React from 'react';
import { calculateThreatProfile } from '../../services/threatIntelligence';

export default function SecurityScorecard({ features, overallScore, overallLevel }) {
  const profile = calculateThreatProfile(features);

  const dimensions = [
    {
      key: 'structure',
      name: 'URL Structure Risk',
      score: profile.structure.score,
      level: profile.structure.level,
      explanation: 'Evaluates URL character length, path depth, slash count, and query parameters.',
    },
    {
      key: 'hostname',
      name: 'Hostname / IP Risk',
      score: profile.hostname.score,
      level: profile.hostname.level,
      explanation: 'Evaluates raw IP hostname usage, domain length, hyphens, and subdomain stuffing.',
    },
    {
      key: 'obfuscation',
      name: 'Obfuscation Risk',
      score: profile.obfuscation.score,
      level: profile.obfuscation.level,
      explanation: 'Evaluates Shannon entropy, shortened URL services, @ symbols, and special char ratios.',
    },
    {
      key: 'keyword',
      name: 'Suspicious Keywords Risk',
      score: profile.keyword.score,
      level: profile.keyword.level,
      explanation: 'Evaluates presence of credential harvesting terms (e.g. login, verify, account, secure).',
    },
    {
      key: 'security',
      name: 'Security Indicators Risk',
      score: profile.security.score,
      level: profile.security.level,
      explanation: 'Evaluates absence of HTTPS encryption and high-risk top-level domain extensions.',
    },
  ];

  const getBadgeClass = (level) => {
    switch (level) {
      case 'CRITICAL':
      case 'HIGH':
        return 'badge phishing';
      case 'MEDIUM':
      case 'GUARDED':
        return 'badge suspicious';
      default:
        return 'badge safe';
    }
  };

  return (
    <div className="report-section card-glass" style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--text-primary)' }}>🎯 Threat Security Scorecard</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Analytical breakdown across 5 threat profile dimensions derived from extracted feature values.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {dimensions.map((dim) => (
          <div key={dim.key} style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{dim.name}</span>
              <span className={getBadgeClass(dim.level)}>{dim.level}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ flex: 1, height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${dim.score}%`,
                    height: '100%',
                    background: dim.score > 60 ? 'var(--accent-red)' : dim.score > 20 ? 'var(--accent-yellow)' : 'var(--accent-green)',
                    transition: 'width 0.8s ease',
                  }}
                />
              </div>
              <span className="font-mono" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                {dim.score}/100
              </span>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
              {dim.explanation}
            </p>
          </div>
        ))}
      </div>

      {/* Overall Summary Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>PRIMARY ML OVERALL RISK</span>
          <div style={{ fontSize: '18px', fontWeight: '800', color: (overallScore || 0) > 70 ? 'var(--accent-red)' : (overallScore || 0) > 30 ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>
            {overallScore !== undefined ? `${overallScore} / 100` : 'N/A'} — <span style={{ textTransform: 'uppercase' }}>{overallLevel || 'EVALUATED'}</span>
          </div>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '480px', margin: 0 }}>
          Notice: The five dimension scores provide an analytical structural breakdown. The primary ML ensemble risk score remains the authoritative decision metric.
        </p>
      </div>
    </div>
  );
}
