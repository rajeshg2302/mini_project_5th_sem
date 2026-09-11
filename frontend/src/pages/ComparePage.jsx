import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiScale, HiArrowLeft, HiRefresh } from 'react-icons/hi';
import { getHistory, getReport } from '../services/api';

export default function ComparePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [historyList, setHistoryList] = useState([]);
  const [scanA, setScanA] = useState(location.state?.scanA || null);
  const [scanB, setScanB] = useState(location.state?.scanB || null);
  const [selectedIdA, setSelectedIdA] = useState(location.state?.scanA?.id || '');
  const [selectedIdB, setSelectedIdB] = useState(location.state?.scanB?.id || '');
  const [loading, setLoading] = useState(true);

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
      console.error('Failed to load history list for comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportA = async (id) => {
    if (!id) return;
    try {
      const report = await getReport(id);
      setScanA(report);
      setSelectedIdA(id);
    } catch (err) {
      console.error('Failed to load scan A:', err);
    }
  };

  const fetchReportB = async (id) => {
    if (!id) return;
    try {
      const report = await getReport(id);
      setScanB(report);
      setSelectedIdB(id);
    } catch (err) {
      console.error('Failed to load scan B:', err);
    }
  };

  const getVerdictClass = (verdict) => {
    switch (verdict?.toLowerCase()) {
      case 'safe': return 'safe';
      case 'suspicious': return 'suspicious';
      case 'phishing': return 'phishing';
      default: return '';
    }
  };

  // Compare 22 features and identify key differences
  const getFeatureComparison = () => {
    if (!scanA?.features || !scanB?.features) return [];

    const keys = Object.keys(scanA.features);
    return keys.map((key) => {
      const valA = scanA.features[key];
      const valB = scanB.features[key];
      const isDifferent = valA !== valB;
      return {
        feature: key,
        valA,
        valB,
        isDifferent,
      };
    });
  };

  const featureComparisons = getFeatureComparison();

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-outline" style={{ marginBottom: '12px', padding: '6px 12px' }} onClick={() => navigate('/history')}>
            <HiArrowLeft /> Back to Scan History
          </button>
          <h1 className="page-title">⚖️ Scan Comparison Tool</h1>
          <p className="page-subtitle">Side-by-side comparison of risk scores, AI predictions, and extracted feature differences</p>
        </div>
      </div>

      {/* Selector Toolbar */}
      <div className="report-section" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>Select Two Scans to Compare:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Scan A (Primary Target):</label>
            <select
              className="filter-select"
              style={{ width: '100%' }}
              value={selectedIdA}
              onChange={(e) => fetchReportA(e.target.value)}
            >
              <option value="">-- Select Scan A --</option>
              {historyList.map((item) => (
                <option key={item.id} value={item.id}>
                  #{item.id} — {item.verdict} ({item.risk_score}/100) — {item.url}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Scan B (Comparison Target):</label>
            <select
              className="filter-select"
              style={{ width: '100%' }}
              value={selectedIdB}
              onChange={(e) => fetchReportB(e.target.value)}
            >
              <option value="">-- Select Scan B --</option>
              {historyList.map((item) => (
                <option key={item.id} value={item.id}>
                  #{item.id} — {item.verdict} ({item.risk_score}/100) — {item.url}
                </option>
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
          {/* Side-by-Side Summary Cards */}
          <div className="report-grid" style={{ marginBottom: '28px' }}>
            {/* Target A Card */}
            <div className={`report-header ${getVerdictClass(scanA.verdict)}`} style={{ flexDirection: 'column', alignItems: 'flex-start', margin: 0 }}>
              <div className="badge safe" style={{ marginBottom: '8px' }}>SCAN A (#{scanA.id})</div>
              <h2 className={getVerdictClass(scanA.verdict)}>{scanA.verdict}</h2>
              <div className="verdict-url" style={{ marginBottom: '12px' }}>{scanA.url}</div>
              <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: "'JetBrains Mono', monospace" }}>
                Score: <span className={`score-badge ${scanA.risk_score <= 30 ? 'low' : scanA.risk_score <= 70 ? 'medium' : 'high'}`}>{scanA.risk_score}/100</span>
              </div>
            </div>

            {/* Target B Card */}
            <div className={`report-header ${getVerdictClass(scanB.verdict)}`} style={{ flexDirection: 'column', alignItems: 'flex-start', margin: 0 }}>
              <div className="badge suspicious" style={{ marginBottom: '8px' }}>SCAN B (#{scanB.id})</div>
              <h2 className={getVerdictClass(scanB.verdict)}>{scanB.verdict}</h2>
              <div className="verdict-url" style={{ marginBottom: '12px' }}>{scanB.url}</div>
              <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: "'JetBrains Mono', monospace" }}>
                Score: <span className={`score-badge ${scanB.risk_score <= 30 ? 'low' : scanB.risk_score <= 70 ? 'medium' : 'high'}`}>{scanB.risk_score}/100</span>
              </div>
            </div>
          </div>

          {/* Feature Differences Matrix */}
          <div className="report-section">
            <h3>🔬 Feature Comparison Matrix</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Highlighted rows represent structural feature variations between Scan A and Scan B
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
                  <tr
                    key={row.feature}
                    style={{
                      background: row.isDifferent ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-card)',
                    }}
                  >
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
    </div>
  );
}
