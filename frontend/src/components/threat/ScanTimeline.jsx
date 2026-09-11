import { HiCheckCircle } from 'react-icons/hi';

const STAGES = [
  { id: 1, label: 'URL Received', desc: 'Target string submitted' },
  { id: 2, label: 'Validated', desc: 'Scheme & syntax verified' },
  { id: 3, label: 'Features Extracted', desc: '22 features derived locally' },
  { id: 4, label: 'Model Evaluated', desc: '4 ML ensemble models executed' },
  { id: 5, label: 'Risk Calculated', desc: 'Ensemble probability weighted' },
  { id: 6, label: 'Explanation Generated', desc: 'SHAP-inspired matrix derived' },
];

export default function ScanTimeline() {
  return (
    <div className="report-section" style={{ marginBottom: '24px' }}>
      <h3>⏱️ Analysis Pipeline Timeline</h3>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Verified local execution stages executed by the PhishGuard backend engine
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '8px',
        alignItems: 'center',
      }}>
        {STAGES.map((stage, idx) => (
          <div
            key={stage.id}
            style={{
              padding: '10px 8px',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <div style={{ fontSize: '18px', color: 'var(--accent-green)', marginBottom: '4px' }}>
              <HiCheckCircle style={{ display: 'inline-block' }} />
            </div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>
              {stage.label}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {stage.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
