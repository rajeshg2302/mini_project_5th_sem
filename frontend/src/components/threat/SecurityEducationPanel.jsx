import { useState } from 'react';
import { HiAcademicCap, HiChevronDown, HiChevronUp, HiInformationCircle } from 'react-icons/hi';
import { getSecurityEducationalNotes } from '../../services/threatIntelligence';

export default function SecurityEducationPanel({ features }) {
  const [expanded, setExpanded] = useState(false);
  const notes = getSecurityEducationalNotes(features);

  if (notes.length === 0) return null;

  return (
    <div className="report-section" style={{ marginBottom: '24px' }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HiAcademicCap style={{ color: 'var(--accent-purple)', fontSize: '20px' }} />
          Security Education Mode — Why Attackers Use These Techniques
        </h3>
        <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }}>
          {expanded ? <HiChevronUp /> : <HiChevronDown />}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notes.map((note, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px 16px',
                background: 'rgba(139, 92, 246, 0.08)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{note.title}</strong>
                <span className="badge" style={{ background: 'var(--bg-card)', color: 'var(--accent-purple)', fontSize: '10px' }}>
                  {note.technique}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {note.explanation}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
