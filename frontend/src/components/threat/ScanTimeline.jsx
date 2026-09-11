import { HiCheckCircle, HiClock } from 'react-icons/hi';

const DEFAULT_STAGES = [
  { id: 1, label: 'SCAN CREATED', desc: 'Target string ingested' },
  { id: 2, label: 'VALIDATED', desc: 'Scheme & syntax verified' },
  { id: 3, label: 'FEATURES EXTRACTED', desc: '22 features derived locally' },
  { id: 4, label: 'MODEL EVALUATED', desc: '4 ML ensemble models executed' },
  { id: 5, label: 'ANALYSIS COMPLETED', desc: 'Ensemble probability weighted' },
];

export default function ScanTimeline({ caseData, scanData }) {
  const events = [...DEFAULT_STAGES];

  if (caseData) {
    events.push({ id: 6, label: 'INVESTIGATION CREATED', desc: `Case #${caseData.case_number}` });
    if (caseData.analyst_notes) {
      events.push({ id: 7, label: 'NOTES UPDATED', desc: 'Analyst observations recorded' });
    }
    if (caseData.status && caseData.status !== 'NEW') {
      events.push({ id: 8, label: 'STATUS CHANGED', desc: `Status: ${caseData.status}` });
    }
    if (caseData.resolution) {
      events.push({ id: 9, label: 'RESOLUTION', desc: caseData.resolution });
    }
  }

  return (
    <div className="report-section card-glass" style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '14px' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--text-primary)' }}>⏱️ Investigation Lifecycle Timeline</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Traceable lifecycle sequence of actual recorded events in the security database.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '8px',
        alignItems: 'center',
      }}>
        {events.map((stage) => (
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
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px', textTransform: 'uppercase' }}>
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
