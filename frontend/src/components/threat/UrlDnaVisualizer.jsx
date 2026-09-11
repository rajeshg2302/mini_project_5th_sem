import { generateUrlDna } from '../../services/threatIntelligence';

export default function UrlDnaVisualizer({ features }) {
  const dnaIndicators = generateUrlDna(features);

  return (
    <div className="report-section" style={{ marginBottom: '24px' }}>
      <h3>🧬 PhishGuard URL DNA Fingerprint</h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Normalized feature intensity matrix comparing raw observed values against risk thresholds
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '12px'
      }}>
        {dnaIndicators.map((item) => {
          const isHighRisk = item.score > 60;
          const isMedRisk = item.score > 30 && item.score <= 60;
          const barColor = isHighRisk ? 'var(--accent-red)' : isMedRisk ? 'var(--accent-yellow)' : 'var(--accent-green)';

          return (
            <div
              key={item.label}
              style={{
                padding: '10px 14px',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>{item.label}</span>
                <span className="font-mono" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{String(item.raw)}</span>
              </div>

              {/* Intensity Bar */}
              <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${item.score}%`,
                    height: '100%',
                    background: barColor,
                    transition: 'width 0.8s ease',
                  }}
                  title={`Risk intensity: ${Math.round(item.score)}%`}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                <span>Category: {item.category}</span>
                <span>Intensity: {Math.round(item.score)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
