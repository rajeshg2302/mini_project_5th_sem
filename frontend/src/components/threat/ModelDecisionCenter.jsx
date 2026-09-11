import React from 'react';

export default function ModelDecisionCenter({ modelPredictions, bestModelName, confidence, riskScore }) {
  if (!modelPredictions || !Array.isArray(modelPredictions) || modelPredictions.length === 0) {
    return (
      <div className="report-section card-glass" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '8px' }}>🤖 MODEL DECISION CENTER</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Detailed per-model probabilities are not available in the current scan response.
        </p>
      </div>
    );
  }

  // Calculate authentic model consensus from actual model predictions
  const phishingCount = modelPredictions.filter(m => m.prediction === 1 || (m.probability !== undefined && m.probability >= 0.5)).length;
  const totalModels = modelPredictions.length;
  const consensusText = `${phishingCount} / ${totalModels} models classify as phishing`;

  return (
    <div className="report-section card-glass" style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '16px', color: 'var(--text-primary)' }}>🤖 MODEL DECISION CENTER</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            Individual model classification predictions and ensemble consensus evaluation.
          </p>
        </div>

        {/* Model Consensus Badge */}
        <div style={{ background: 'var(--bg-elevated)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '6px' }}>MODEL CONSENSUS:</span>
          <span className="font-mono" style={{ fontSize: '12px', fontWeight: '800', color: phishingCount >= (totalModels / 2) ? 'var(--accent-red)' : 'var(--accent-green)' }}>
            {consensusText}
          </span>
        </div>
      </div>

      {/* Grid of Individual Model Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {modelPredictions.map((m, idx) => {
          const phishPct = m.probability !== undefined ? (m.probability * 100).toFixed(1) : 'N/A';
          const isPhish = m.prediction === 1 || (m.probability !== undefined && m.probability >= 0.5);

          return (
            <div key={idx} style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{m.model_name}</span>
                <span className={`badge ${isPhish ? 'phishing' : 'safe'}`}>
                  {isPhish ? 'PHISHING' : 'SAFE'}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>PHISHING PROBABILITY</div>
              <div className="font-mono" style={{ fontSize: '18px', fontWeight: '800', color: isPhish ? 'var(--accent-red)' : 'var(--accent-green)', marginBottom: '8px' }}>
                {phishPct}%
              </div>

              <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${phishPct}%`,
                    height: '100%',
                    background: isPhish ? 'var(--accent-red)' : 'var(--accent-green)',
                    transition: 'width 0.8s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Model & Confidence Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>FINAL SELECTED MODEL</span>
          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
            {bestModelName ? bestModelName.replace(/_/g, ' ').toUpperCase() : 'WEIGHTED ENSEMBLE PIPELINE'}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>OVERALL CONFIDENCE</span>
          <div className="font-mono" style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
            {confidence !== undefined ? `${(confidence * 100).toFixed(1)}%` : `${riskScore}%`}
          </div>
        </div>
      </div>
    </div>
  );
}
