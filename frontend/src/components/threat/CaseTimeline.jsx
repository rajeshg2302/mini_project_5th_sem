import React from 'react';
import { HiClock, HiPlusCircle, HiPencilAlt, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';

export default function CaseTimeline({ caseData, scanData }) {
  if (!caseData) return null;

  const events = [
    {
      id: 'scan_event',
      title: 'URL Forensic Scan Executed',
      timestamp: scanData?.scanned_at || caseData.created_at,
      icon: <HiClock style={{ color: 'var(--accent-cyan)' }} />,
      details: `Target: ${caseData.url} | Verdict: ${caseData.verdict} (${caseData.risk_score}/100)`,
    },
    {
      id: 'create_event',
      title: `Case #${caseData.case_number} Created`,
      timestamp: caseData.created_at,
      icon: <HiPlusCircle style={{ color: 'var(--accent-blue)' }} />,
      details: `Assigned Analyst: ${caseData.assigned_analyst || 'Security Analyst'}`,
    },
  ];

  if (caseData.updated_at && caseData.updated_at !== caseData.created_at) {
    events.push({
      id: 'update_event',
      title: 'Case Investigation Updated',
      timestamp: caseData.updated_at,
      icon: <HiPencilAlt style={{ color: 'var(--accent-yellow)' }} />,
      details: `Current Status: ${caseData.status}${caseData.resolution ? ` | Resolution: ${caseData.resolution}` : ''}`,
    });
  }

  if (caseData.status === 'RESOLVED' || caseData.status === 'CONFIRMED THREAT' || caseData.status === 'FALSE POSITIVE') {
    events.push({
      id: 'resolution_event',
      title: `Case Marked as ${caseData.status}`,
      timestamp: caseData.updated_at || new Date().toISOString(),
      icon: caseData.status === 'CONFIRMED THREAT' ? (
        <HiExclamationCircle style={{ color: 'var(--accent-red)' }} />
      ) : (
        <HiCheckCircle style={{ color: 'var(--accent-green)' }} />
      ),
      details: caseData.resolution_notes || 'Investigation disposition finalized by analyst.',
    });
  }

  return (
    <div className="report-section card-glass" style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <HiClock style={{ color: 'var(--accent-cyan)' }} /> INVESTIGATION CASE TIMELINE
      </h3>

      <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid var(--border-color)' }}>
        {events.map((evt, idx) => (
          <div key={evt.id} style={{ position: 'relative', marginBottom: idx === events.length - 1 ? 0 : '20px' }}>
            {/* Timeline node icon */}
            <div
              style={{
                position: 'absolute',
                left: '-34px',
                top: '0px',
                background: 'var(--bg-card)',
                borderRadius: '50%',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                border: '1px solid var(--border-color)',
              }}
            >
              {evt.icon}
            </div>

            <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{evt.title}</span>
                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : 'N/A'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{evt.details}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
