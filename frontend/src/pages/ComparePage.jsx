import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiScale, HiArrowLeft } from 'react-icons/hi';
import { getHistory, getReport } from '../services/api';
import { runEvidenceFusion, getSeverityColor, getTierBadgeStyle } from '../utils/evidenceFusion';
import { calculateThreatProfile } from '../services/threatIntelligence';

export default function ComparePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [historyList, setHistoryList] = useState([]);
  const [scanA, setScanA] = useState(location.state?.scanA || null);
  const [scanB, setScanB] = useState(location.state?.scanB || null);
  const [selectedIdA, setSelectedIdA] = useState(location.state?.scanA?.id || '');
  const [selectedIdB, setSelectedIdB] = useState(location.state?.scanB?.id || '');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    loadHistoryOptions();
  }, []);

  const loadHistoryOptions = async () => {
    setLoading(true);
    try {
      const data = await getHistory({ limit: 50 });
      const list = data.scans || [];
      setHistoryList(list);
      if (list.length >= 2 && !scanA && !scanB) {
        fetchReportA(list[0].id);
        fetchReportB(list[1].id);
        setSelectedIdA(list[0].id);
        setSelectedIdB(list[1].id);
      }
    } catch (err) {
      console.error('Failed to load history for comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportA = async (id) => {
    if (!id) return;
    try { setScanA(await getReport(id)); setSelectedIdA(id); }
    catch (err) { console.error('Failed to load scan A:', err); }
  };

  const fetchReportB = async (id) => {
    if (!id) return;
    try { setScanB(await getReport(id)); setSelectedIdB(id); }
    catch (err) { console.error('Failed to load scan B:', err); }
  };

  // Compute fusion data for both scans
  const fusionA = useMemo(() => runEvidenceFusion(scanA), [scanA]);
  const fusionB = useMemo(() => runEvidenceFusion(scanB), [scanB]);
  const profileA = useMemo(() => calculateThreatProfile(scanA?.features), [scanA?.features]);
  const profileB = useMemo(() => calculateThreatProfile(scanB?.features), [scanB?.features]);

  // Feature comparison
  const featureComparisons = useMemo(() => {
    if (!scanA?.features || !scanB?.features) return [];
    return Object.keys(scanA.features).map((key) => {
      const valA = scanA.features[key];
      const valB = scanB.features[key];
      return { feature: key, valA, valB, isDifferent: valA !== valB };
    });
  }, [scanA, scanB]);

  const diffCount = featureComparisons.filter((f) => f.isDifferent).length;

  const getVerdictStyle = (verdict) => {
    if (verdict === 'Phishing') return { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)' };
    if (verdict === 'Suspicious') return { color: '#eab308', bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.3)' };
    return { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.3)' };
  };

  const tabs = [
    { id: 'summary', label: '📊 Summary' },
    { id: 'intelligence', label: '🎯 Intelligence' },
    { id: 'indicators', label: '🔍 Indicators' },
    { id: 'features', label: '🔬 Feature Matrix' },
  ];

  // Signal comparison rows
  const signalRows = fusionA && fusionB ? [
    {
      label: 'ML Risk Score',
      valA: `${fusionA.mlRiskScore}/100`,
      valB: `${fusionB.mlRiskScore}/100`,
      diff: Math.abs(fusionA.mlRiskScore - fusionB.mlRiskScore),
      colorA: fusionA.mlRiskScore >= 70 ? '#ef4444' : fusionA.mlRiskScore >= 40 ? '#eab308' : '#22c55e',
      colorB: fusionB.mlRiskScore >= 70 ? '#ef4444' : fusionB.mlRiskScore >= 40 ? '#eab308' : '#22c55e',
    },
    {
      label: 'ML Verdict',
      valA: fusionA.mlVerdict,
      valB: fusionB.mlVerdict,
      diff: fusionA.mlVerdict !== fusionB.mlVerdict ? 1 : 0,
      colorA: getVerdictStyle(fusionA.mlVerdict).color,
      colorB: getVerdictStyle(fusionB.mlVerdict).color,
    },
    {
      label: 'Evidence Strength',
      valA: fusionA.evidenceStrength.level,
      valB: fusionB.evidenceStrength.level,
      diff: fusionA.evidenceStrength.score !== fusionB.evidenceStrength.score ? 1 : 0,
      colorA: getTierBadgeStyle(fusionA.evidenceStrength.level).color,
      colorB: getTierBadgeStyle(fusionB.evidenceStrength.level).color,
    },
    {
      label: 'Intelligence Tier',
      valA: fusionA.intelligenceScore.tier,
      valB: fusionB.intelligenceScore.tier,
      diff: fusionA.intelligenceScore.tier !== fusionB.intelligenceScore.tier ? 1 : 0,
      colorA: getTierBadgeStyle(fusionA.intelligenceScore.tier).color,
      colorB: getTierBadgeStyle(fusionB.intelligenceScore.tier).color,
    },
    {
      label: 'Fusion Verdict',
      valA: fusionA.fusionVerdict,
      valB: fusionB.fusionVerdict,
      diff: fusionA.fusionVerdict !== fusionB.fusionVerdict ? 1 : 0,
      colorA: getVerdictStyle(fusionA.fusionVerdict).color,
      colorB: getVerdictStyle(fusionB.fusionVerdict).color,
    },
    {
      label: 'Active Indicators',
      valA: `${fusionA.activeAttackIndicators.length}`,
      valB: `${fusionB.activeAttackIndicators.length}`,
      diff: Math.abs(fusionA.activeAttackIndicators.length - fusionB.activeAttackIndicators.length),
      colorA: fusionA.activeAttackIndicators.length > 2 ? '#ef4444' : fusionA.activeAttackIndicators.length > 0 ? '#f97316' : '#22c55e',
      colorB: fusionB.activeAttackIndicators.length > 2 ? '#ef4444' : fusionB.activeAttackIndicators.length > 0 ? '#f97316' : '#22c55e',
    },
    {
      label: 'Model Agreement',
      valA: fusionA.mlModelAgreement.agreementLevel,
      valB: fusionB.mlModelAgreement.agreementLevel,
      diff: fusionA.mlModelAgreement.agreementLevel !== fusionB.mlModelAgreement.agreementLevel ? 1 : 0,
      colorA: 'var(--accent-cyan)',
      colorB: 'var(--accent-cyan)',
    },
    {
      label: 'URL Structure Score',
      valA: `${profileA?.structure?.score ?? 0}/100`,
      valB: `${profileB?.structure?.score ?? 0}/100`,
      diff: Math.abs((profileA?.structure?.score ?? 0) - (profileB?.structure?.score ?? 0)),
      colorA: getSeverityColor(profileA?.structure?.level),
      colorB: getSeverityColor(profileB?.structure?.level),
    },
    {
      label: 'Obfuscation Score',
      valA: `${profileA?.obfuscation?.score ?? 0}/100`,
      valB: `${profileB?.obfuscation?.score ?? 0}/100`,
      diff: Math.abs((profileA?.obfuscation?.score ?? 0) - (profileB?.obfuscation?.score ?? 0)),
      colorA: getSeverityColor(profileA?.obfuscation?.level),
      colorB: getSeverityColor(profileB?.obfuscation?.level),
    },
    {
      label: 'Security Indicators Score',
      valA: `${profileA?.security?.score ?? 0}/100`,
      valB: `${profileB?.security?.score ?? 0}/100`,
      diff: Math.abs((profileA?.security?.score ?? 0) - (profileB?.security?.score ?? 0)),
      colorA: getSeverityColor(profileA?.security?.level),
      colorB: getSeverityColor(profileB?.security?.level),
    },
  ] : [];

  // Indicator comparison
  const indicatorsA = fusionA?.activeAttackIndicators || [];
  const indicatorsB = fusionB?.activeAttackIndicators || [];
  const allIndicatorIds = [...new Set([...indicatorsA.map((i) => i.id), ...indicatorsB.map((i) => i.id)])];

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-outline" style={{ marginBottom: '12px', padding: '6px 12px' }} onClick={() => navigate('/history')}>
            <HiArrowLeft /> Back to Scan History
          </button>
          <h1 className="page-title">⚖️ Comparative Investigation</h1>
          <p className="page-subtitle">Side-by-side ML predictions, evidence fusion, threat indicators, and feature analysis</p>
        </div>
      </div>

      {/* Selector Toolbar */}
      <div className="report-section" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>Select Two Scans to Compare:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Scan A (Primary Target):</label>
            <select className="filter-select" style={{ width: '100%' }} value={selectedIdA} onChange={(e) => fetchReportA(e.target.value)}>
              <option value="">-- Select Scan A --</option>
              {historyList.map((item) => (
                <option key={item.id} value={item.id}>#{item.id} — {item.verdict} ({item.risk_score}/100) — {item.url?.substring(0, 40)}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Scan B (Comparison Target):</label>
            <select className="filter-select" style={{ width: '100%' }} value={selectedIdB} onChange={(e) => fetchReportB(e.target.value)}>
              <option value="">-- Select Scan B --</option>
              {historyList.map((item) => (
                <option key={item.id} value={item.id}>#{item.id} — {item.verdict} ({item.risk_score}/100) — {item.url?.substring(0, 40)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Display */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : !scanA || !scanB ? (
        <div className="empty-state">
          <div className="empty-icon">⚖️</div>
          <h3>Select Two Scans to Compare</h3>
          <p>Choose two completed scans from your scan history using the selectors above.</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

          {/* Side-by-Side Header Cards */}
          <div className="report-grid" style={{ marginBottom: '24px' }}>
            {[
              { scan: scanA, fusion: fusionA, label: 'SCAN A', badge: 'safe', num: scanA.id },
              { scan: scanB, fusion: fusionB, label: 'SCAN B', badge: 'suspicious', num: scanB.id },
            ].map(({ scan, fusion: f, label, badge, num }, ci) => {
              const vs = getVerdictStyle(scan.verdict);
              return (
                <div key={ci} style={{
                  padding: '20px', borderRadius: 'var(--radius-sm)',
                  background: vs.bg, border: `1px solid ${vs.border}`,
                  borderTop: `4px solid ${vs.color}`,
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: vs.color, letterSpacing: '0.07em', marginBottom: '6px' }}>
                    {label} (#{num})
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: vs.color, marginBottom: '6px' }}>
                    {scan.verdict.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', wordBreak: 'break-all', marginBottom: '12px' }}>{scan.url}</div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Risk Score</div>
                      <div style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: vs.color }}>{scan.risk_score}</div>
                    </div>
                    {f && (
                      <>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Evidence</div>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: getTierBadgeStyle(f.evidenceStrength.level).color }}>
                            {f.evidenceStrength.level}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Indicators</div>
                          <div style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: f.activeAttackIndicators.length > 0 ? '#f97316' : '#22c55e' }}>
                            {f.activeAttackIndicators.length}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Intel Tier</div>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: getTierBadgeStyle(f.intelligenceScore.tier).color }}>
                            {f.intelligenceScore.tier}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  fontSize: '12px', fontWeight: '700', letterSpacing: '0.04em',
                  background: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--bg-card)',
                  color: activeTab === tab.id ? '#000' : 'var(--text-secondary)',
                  border: activeTab === tab.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ── TAB: Summary ── */}
            {activeTab === 'summary' && fusionA && fusionB && (
              <motion.div key="summary" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="report-section">
                  <h3>📊 Signal Comparison</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    ML metrics, Evidence Strength, Intelligence Tier, and Threat Dimensions compared side-by-side
                  </p>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Signal</th>
                          <th>Scan A (#{scanA.id})</th>
                          <th>Scan B (#{scanB.id})</th>
                          <th>Delta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {signalRows.map((row, i) => (
                          <tr key={i} style={{ background: row.diff > 0 ? 'rgba(6,182,212,0.05)' : 'inherit' }}>
                            <td style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>{row.label}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: '700', color: row.colorA }}>{row.valA}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: '700', color: row.colorB }}>{row.valB}</td>
                            <td>
                              {row.diff > 0 ? (
                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '3px', background: 'rgba(6,182,212,0.1)', color: 'var(--accent-cyan)', border: '1px solid rgba(6,182,212,0.3)', fontWeight: '700' }}>
                                  DIFFERENT {typeof row.diff === 'number' && row.diff > 1 ? `(Δ${row.diff})` : ''}
                                </span>
                              ) : (
                                <span style={{ fontSize: '11px', opacity: 0.5, padding: '2px 8px', borderRadius: '3px', background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.15)' }}>
                                  IDENTICAL
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── TAB: Intelligence ── */}
            {activeTab === 'intelligence' && fusionA && fusionB && (
              <motion.div key="intelligence" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="report-section">
                  <h3>🎯 Intelligence Breakdown Comparison</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {[
                      { label: 'Scan A', f: fusionA, scan: scanA },
                      { label: 'Scan B', f: fusionB, scan: scanB },
                    ].map(({ label, f, scan }) => (
                      <div key={label} style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontWeight: '800', marginBottom: '12px', color: 'var(--accent-cyan)', fontSize: '13px' }}>{label} — Intelligence Breakdown</div>
                        {Object.entries(f.intelligenceScore.breakdown).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: '700' }}>{v}</span>
                          </div>
                        ))}
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800' }}>
                            <span>Total Intel Score</span>
                            <span style={{ color: getTierBadgeStyle(f.intelligenceScore.tier).color }}>{f.intelligenceScore.score}/100 ({f.intelligenceScore.tier})</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800', marginTop: '4px' }}>
                            <span>Evidence Strength</span>
                            <span style={{ color: getTierBadgeStyle(f.evidenceStrength.level).color }}>{f.evidenceStrength.score}/100 ({f.evidenceStrength.level})</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800', marginTop: '4px' }}>
                            <span>Fusion Verdict</span>
                            <span style={{ color: getVerdictStyle(f.fusionVerdict).color }}>{f.fusionVerdict}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800', marginTop: '4px' }}>
                            <span>Recommended Action</span>
                            <span style={{ color: 'var(--accent-yellow)', fontSize: '11px' }}>{f.analystDecision.recommendedAction}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── TAB: Indicators ── */}
            {activeTab === 'indicators' && (
              <motion.div key="indicators" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="report-section">
                  <h3>🔍 Attack Indicator Comparison</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Observed indicators derived from URL features — not confirmed attack classifications
                  </p>
                  {allIndicatorIds.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--accent-green)' }}>
                      ✅ No attack indicators observed in either scan
                    </div>
                  ) : (
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Observed Indicator</th>
                          <th>Severity</th>
                          <th>Scan A</th>
                          <th>Scan B</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allIndicatorIds.map((indId) => {
                          const inA = indicatorsA.find((i) => i.id === indId);
                          const inB = indicatorsB.find((i) => i.id === indId);
                          const ind = inA || inB;
                          const severity = ind?.severity || 'LOW';
                          const ts = getTierBadgeStyle(severity);
                          return (
                            <tr key={indId}>
                              <td style={{ fontSize: '12px', fontWeight: '700' }}>{ind?.name}</td>
                              <td>
                                <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '3px', background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}>
                                  {severity}
                                </span>
                              </td>
                              <td>
                                {inA ? (
                                  <span style={{ color: '#ef4444', fontWeight: '700', fontSize: '12px' }}>
                                    ⚠ Detected (val: {inA.featureValue})
                                  </span>
                                ) : (
                                  <span style={{ color: '#22c55e', opacity: 0.7, fontSize: '12px' }}>Not detected</span>
                                )}
                              </td>
                              <td>
                                {inB ? (
                                  <span style={{ color: '#ef4444', fontWeight: '700', fontSize: '12px' }}>
                                    ⚠ Detected (val: {inB.featureValue})
                                  </span>
                                ) : (
                                  <span style={{ color: '#22c55e', opacity: 0.7, fontSize: '12px' }}>Not detected</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── TAB: Feature Matrix ── */}
            {activeTab === 'features' && (
              <motion.div key="features" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="report-section">
                  <h3>🔬 Feature Comparison Matrix</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    {diffCount} of {featureComparisons.length} features differ between Scan A and Scan B
                  </p>
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Feature Name</th>
                        <th>Scan A Value</th>
                        <th>Scan B Value</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {featureComparisons.map((row) => (
                        <tr key={row.feature} style={{ background: row.isDifferent ? 'rgba(6, 182, 212, 0.06)' : 'inherit' }}>
                          <td className="font-mono" style={{ fontSize: '12px', fontWeight: row.isDifferent ? '700' : '400' }}>
                            {row.feature}
                          </td>
                          <td className="font-mono" style={{ fontSize: '13px', color: row.isDifferent ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                            {typeof row.valA === 'number' ? (Number.isInteger(row.valA) ? row.valA : row.valA.toFixed(4)) : String(row.valA)}
                          </td>
                          <td className="font-mono" style={{ fontSize: '13px', color: row.isDifferent ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                            {typeof row.valB === 'number' ? (Number.isInteger(row.valB) ? row.valB : row.valB.toFixed(4)) : String(row.valB)}
                          </td>
                          <td>
                            {row.isDifferent ? (
                              <span className="badge suspicious" style={{ fontSize: '10px' }}>DIFFERENT</span>
                            ) : (
                              <span className="badge safe" style={{ fontSize: '10px', opacity: 0.6 }}>IDENTICAL</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
