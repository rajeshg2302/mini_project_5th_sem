import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from 'recharts';
import { calculateThreatProfile } from '../../services/threatIntelligence';

export default function ThreatProfileRadar({ features }) {
  const profile = calculateThreatProfile(features);

  const radarData = [
    { dimension: 'URL Structure', score: profile.structure.score, level: profile.structure.level },
    { dimension: 'Hostname/IP', score: profile.hostname.score, level: profile.hostname.level },
    { dimension: 'Obfuscation', score: profile.obfuscation.score, level: profile.obfuscation.level },
    { dimension: 'Keywords', score: profile.keyword.score, level: profile.keyword.level },
    { dimension: 'Security Risk', score: profile.security.score, level: profile.security.level },
  ];

  const getLevelColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'var(--accent-red)';
      case 'HIGH': return 'var(--accent-orange)';
      case 'MEDIUM': return 'var(--accent-yellow)';
      case 'GUARDED': return 'var(--accent-cyan)';
      default: return 'var(--accent-green)';
    }
  };

  return (
    <div className="report-section" style={{ marginBottom: '24px' }}>
      <h3>🎯 Threat Profile & Risk Radar</h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Derived 5-dimension risk profile calculated directly from extracted URL features
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'center' }}>
        {/* Radar Visualization */}
        <div style={{ height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border-color)" />
              <PolarAngleAxis dataKey="dimension" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Radar
                name="Risk Score"
                dataKey="score"
                stroke="var(--accent-cyan)"
                fill="var(--accent-cyan)"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
                formatter={(val) => [`${val}/100`, 'Risk Score']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* 5-Dimension Risk Table */}
        <div style={{ display: 'flex', flexCapacity: 'column', flexDirection: 'column', gap: '10px' }}>
          {radarData.map((item) => (
            <div
              key={item.dimension}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `3px solid ${getLevelColor(item.level)}`
              }}
            >
              <div>
                <span style={{ fontWeight: '600', fontSize: '13px', display: 'block' }}>{item.dimension}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Score: {item.score}/100</span>
              </div>
              <span className="badge" style={{
                background: 'var(--bg-card)',
                color: getLevelColor(item.level),
                border: `1px solid ${getLevelColor(item.level)}`
              }}>
                {item.level}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
