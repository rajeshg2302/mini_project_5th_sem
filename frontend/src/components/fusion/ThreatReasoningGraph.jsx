import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { runEvidenceFusion, getSeverityColor, getTierBadgeStyle } from '../../utils/evidenceFusion';

/**
 * Threat Reasoning Graph — Phase 13
 *
 * Interactive node-based graph visualizing the reasoning chain:
 * URL → Features → Indicators + ML → Evidence Fusion → Final Verdict
 *
 * Clicking a node reveals source feature values.
 * No fabricated relationships — only connections backed by real features.
 */
export default function ThreatReasoningGraph({ scanReport }) {
  const fusion = useMemo(() => runEvidenceFusion(scanReport), [scanReport]);
  const [selectedNode, setSelectedNode] = useState(null);

  if (!scanReport || !fusion) return null;

  const { reasoningGraph, activeAttackIndicators, evidenceChain, mlModelAgreement, mlVerdict, fusionVerdict, intelligenceScore } = fusion;

  // ── Build display nodes ──────────────────────────────────────────────────
  const displayLayers = [
    // Layer 0: URL input
    {
      level: 0,
      label: 'LAYER 0 — INPUT',
      nodes: [
        {
          id: 'url_input',
          icon: '🔗',
          title: 'URL INPUT',
          subtitle: (scanReport.url || '').length > 45 ? `${scanReport.url.substring(0, 45)}…` : (scanReport.url || ''),
          color: 'var(--accent-cyan)',
          detail: {
            title: 'Source URL',
            items: [
              { k: 'URL', v: scanReport.url },
              { k: 'Scan ID', v: `#${scanReport.id || 'N/A'}` },
              { k: 'Features Extracted', v: Object.keys(scanReport.features || {}).length },
            ],
          },
        },
      ],
    },
    // Layer 1: Feature extraction
    {
      level: 1,
      label: 'LAYER 1 — FEATURE EXTRACTION',
      nodes: evidenceChain.slice(0, 5).map((f, i) => {
        const riskStyle = getTierBadgeStyle(f.riskLevel);
        return {
          id: `feat_${i}`,
          icon: f.riskLevel === 'CRITICAL' ? '🔴' : f.riskLevel === 'HIGH' ? '🟠' : f.riskLevel === 'MEDIUM' ? '🟡' : '🟢',
          title: f.feature.replace(/_/g, ' ').toUpperCase(),
          subtitle: `Value: ${typeof f.value === 'number' ? (Number.isInteger(f.value) ? f.value : f.value.toFixed(3)) : String(f.value)}`,
          color: riskStyle.color,
          detail: {
            title: f.feature,
            items: [
              { k: 'Observed Value', v: typeof f.value === 'number' ? (Number.isInteger(f.value) ? f.value : f.value.toFixed(4)) : String(f.value) },
              { k: 'Risk Level', v: f.riskLevel },
              { k: 'Weight', v: f.weight.toFixed(2) },
              { k: 'Impact', v: f.impact === 'increases_risk' ? '↑ Increases Risk' : '↓ Decreases Risk' },
              { k: 'Contribution', v: f.contribution.toFixed(3) },
            ],
          },
        };
      }),
    },
    // Layer 2: ML engine + Attack indicators
    {
      level: 2,
      label: 'LAYER 2 — EVALUATION',
      nodes: [
        {
          id: 'ml_engine',
          icon: '🤖',
          title: 'ML ENGINE',
          subtitle: `${mlModelAgreement.totalModels} Models · ${mlModelAgreement.agreementLevel}`,
          color: 'var(--accent-cyan)',
          detail: {
            title: 'ML Ensemble Engine',
            items: [
              { k: 'Models', v: mlModelAgreement.totalModels },
              { k: 'Agreement', v: mlModelAgreement.agreementLevel },
              { k: 'Phishing Votes', v: `${mlModelAgreement.phishingVotes}/${mlModelAgreement.totalModels}` },
              { k: 'Verdict', v: mlVerdict },
              { k: 'Agreement Score', v: `${mlModelAgreement.agreementScore.toFixed(1)}%` },
            ],
          },
        },
        ...activeAttackIndicators.slice(0, 3).map((ind, i) => {
          const style = getTierBadgeStyle(ind.severity);
          return {
            id: `ind_${i}`,
            icon: ind.severity === 'CRITICAL' ? '🚨' : ind.severity === 'HIGH' ? '⚠️' : '🔎',
            title: ind.name.length > 20 ? `${ind.name.substring(0, 20)}…` : ind.name,
            subtitle: `${ind.severity} · ${ind.tactic}`,
            color: style.color,
            detail: {
              title: `Indicator: ${ind.name}`,
              items: [
                { k: 'ATT&CK ID', v: ind.id },
                { k: 'Tactic', v: ind.tactic },
                { k: 'Severity', v: ind.severity },
                { k: 'Feature Value', v: ind.featureValue },
                { k: 'MITRE Ref', v: ind.mitre },
              ],
            },
          };
        }),
      ],
    },
    // Layer 3: Evidence Fusion
    {
      level: 3,
      label: 'LAYER 3 — EVIDENCE FUSION',
      nodes: [
        {
          id: 'evidence_fusion',
          icon: '⚗️',
          title: 'EVIDENCE FUSION',
          subtitle: `Score: ${fusion.evidenceStrength.score}/100 · ${fusion.evidenceStrength.level}`,
          color: '#a855f7',
          detail: {
            title: 'Evidence Fusion Engine',
            items: [
              { k: 'Evidence Score', v: `${fusion.evidenceStrength.score}/100` },
              { k: 'Level', v: fusion.evidenceStrength.level },
              { k: 'Intel Score', v: `${intelligenceScore.score}/100` },
              { k: 'Intel Tier', v: intelligenceScore.tier },
              { k: 'Critical Indicators', v: fusion.evidenceStrength.criticalIndicators },
              { k: 'High Indicators', v: fusion.evidenceStrength.highIndicators },
            ],
          },
        },
      ],
    },
    // Layer 4: Final verdict
    {
      level: 4,
      label: 'LAYER 4 — FINAL ASSESSMENT',
      nodes: [
        {
          id: 'verdict',
          icon: fusionVerdict === 'Phishing' ? '🔴' : fusionVerdict === 'Suspicious' ? '🟡' : '🟢',
          title: `FUSION VERDICT: ${fusionVerdict.toUpperCase()}`,
          subtitle: `ML Verdict: ${mlVerdict} · Intel Tier: ${intelligenceScore.tier}`,
          color: getSeverityColor(fusionVerdict),
          detail: {
            title: 'Final Assessment',
            items: [
              { k: 'Fusion Verdict', v: fusionVerdict },
              { k: 'ML Verdict', v: mlVerdict },
              { k: 'Agreement', v: mlVerdict === fusionVerdict ? '✅ Aligned' : '⚡ Divergence' },
              { k: 'Action', v: fusion.analystDecision.recommendedAction },
              { k: 'Urgency', v: fusion.analystDecision.urgency },
            ],
          },
        },
      ],
    },
  ];

  const selected = selectedNode ? displayLayers.flatMap((l) => l.nodes).find((n) => n.id === selectedNode) : null;

  return (
    <div className="report-section" style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '18px' }}>
        <h3 style={{ margin: 0 }}>🗺️ Threat Reasoning Graph</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
          Interactive reasoning chain — click any node to inspect source data
        </p>
      </div>

      <div style={{ display: 'flex', gap: '20px', position: 'relative' }}>
        {/* Graph Column */}
        <div style={{ flex: '1', overflowX: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {displayLayers.map((layer, li) => (
              <div key={layer.level}>
                {/* Layer label */}
                <div style={{
                  fontSize: '10px', fontWeight: '800', letterSpacing: '0.08em',
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                  padding: '8px 0 6px', opacity: 0.7,
                }}>
                  {layer.label}
                </div>

                {/* Node row */}
                <div style={{
                  display: 'flex', gap: '10px', flexWrap: 'wrap',
                  paddingBottom: li < displayLayers.length - 1 ? '6px' : '0',
                }}>
                  {layer.nodes.map((node, ni) => (
                    <motion.button
                      key={node.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: li * 0.08 + ni * 0.05 }}
                      onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                      style={{
                        cursor: 'pointer',
                        padding: '10px 14px',
                        background: selectedNode === node.id
                          ? `${node.color}22`
                          : 'var(--bg-card)',
                        border: `1.5px solid ${selectedNode === node.id ? node.color : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-sm)',
                        textAlign: 'left',
                        minWidth: '160px',
                        maxWidth: '220px',
                        transition: 'all 0.2s',
                        boxShadow: selectedNode === node.id ? `0 0 12px ${node.color}44` : 'none',
                      }}
                    >
                      <div style={{ fontSize: '14px', marginBottom: '3px' }}>{node.icon}</div>
                      <div style={{
                        fontSize: '11px', fontWeight: '800', letterSpacing: '0.04em',
                        color: selectedNode === node.id ? node.color : 'var(--text-primary)',
                        textTransform: 'uppercase',
                      }}>
                        {node.title}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {node.subtitle}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Connector line (except last) */}
                {li < displayLayers.length - 1 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', padding: '4px 0',
                    gap: '6px', color: 'var(--text-muted)', fontSize: '11px',
                  }}>
                    <div style={{ width: '2px', height: '20px', background: 'var(--border-color)', margin: '0 8px' }} />
                    <span style={{ opacity: 0.5 }}>feeds into</span>
                    <div style={{ width: '2px', height: '20px', background: 'var(--border-color)', margin: '0 8px' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: '240px' }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                width: '240px',
                flexShrink: 0,
                padding: '16px',
                background: 'var(--bg-elevated)',
                border: `1px solid ${selected.color}44`,
                borderRadius: 'var(--radius-sm)',
                borderLeft: `3px solid ${selected.color}`,
                height: 'fit-content',
                position: 'sticky',
                top: '8px',
                overflow: 'hidden',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '800', color: selected.color, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {selected.detail.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selected.detail.items.map((item, i) => (
                  <div key={i} style={{ fontSize: '12px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {item.k}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)', color: 'var(--text-primary)',
                      fontWeight: '600', wordBreak: 'break-all', fontSize: '11px',
                    }}>
                      {String(item.v).length > 50 ? `${String(item.v).substring(0, 50)}…` : String(item.v)}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  marginTop: '14px', width: '100%', padding: '6px',
                  background: 'transparent',
                  border: `1px solid ${selected.color}44`,
                  borderRadius: '4px', fontSize: '11px',
                  color: 'var(--text-muted)', cursor: 'pointer',
                }}
              >
                ✕ Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{
        marginTop: '12px', padding: '8px 14px',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '11px', color: 'var(--text-muted)',
      }}>
        💡 All graph connections are derived from actual feature extraction and ML output. No relationships are synthesized or fabricated.
      </div>
    </div>
  );
}
