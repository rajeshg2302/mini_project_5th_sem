import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { HiShieldCheck, HiShieldExclamation, HiExclamation, HiSearch, HiClock, HiArrowRight, HiBriefcase, HiChip, HiLightningBolt } from 'react-icons/hi';
import { getAnalytics, getCases, getCaseStats } from '../services/api';
import { usePreferences } from '../context/PreferencesContext';

const COLORS = {
  safe: '#10b981',
  suspicious: '#f59e0b',
  phishing: '#ef4444',
  cyan: '#06b6d4',
};

export default function DashboardPage() {
  const [url, setUrl] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [casesData, setCasesData] = useState(null);
  const [caseStats, setCaseStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const { prefs } = usePreferences();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [analyticsRes, casesRes, statsRes] = await Promise.all([
        getAnalytics(),
        getCases({ limit: 10 }).catch(() => ({ cases: [], total: 0 })),
        getCaseStats().catch(() => null),
      ]);
      setAnalytics(analyticsRes);
      setCasesData(casesRes);
      setCaseStats(statsRes);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAnalyze = () => {
    if (!url.trim()) return;
    navigate('/scan', { state: { autoScanUrl: url.trim() } });
  };

  const casesList = casesData?.cases || [];
  const totalCases = caseStats?.total ?? casesData?.total ?? 0;
  const openCasesCount = caseStats?.open_cases ?? casesList.filter(c => c.status === 'NEW' || c.status === 'INVESTIGATING').length;
  const confirmedThreatsCount = caseStats?.confirmed_threats ?? casesList.filter(c => c.status === 'CONFIRMED THREAT' || c.verdict === 'Phishing').length;
  const falsePositivesCount = caseStats?.false_positives ?? casesList.filter(c => c.status === 'FALSE POSITIVE').length;
  const resolvedCasesCount = caseStats?.resolved ?? casesList.filter(c => c.status === 'RESOLVED').length;
  const criticalCasesCount = caseStats?.high_risk_queue ?? casesList.filter(c => c.severity === 'CRITICAL' || c.severity === 'HIGH').length;

  // Calculate live Threat Level from actual backend stats
  const computeThreatLevel = () => {
    if (!analytics || analytics.total_scans === 0) return { level: 'NO ACTIVE THREATS', color: 'var(--accent-green)' };
    const highRiskRatio = (analytics.phishing_count + criticalCasesCount) / Math.max(1, analytics.total_scans);
    if (criticalCasesCount > 3 || highRiskRatio > 0.4) return { level: 'CRITICAL', color: 'var(--accent-red)' };
    if (criticalCasesCount > 0 || highRiskRatio > 0.2) return { level: 'HIGH', color: 'var(--accent-red)' };
    if (analytics.suspicious_count > 0 || highRiskRatio > 0.1) return { level: 'MEDIUM', color: 'var(--accent-yellow)' };
    if (analytics.total_scans > 0) return { level: 'GUARDED', color: 'var(--accent-cyan)' };
    return { level: 'LOW', color: 'var(--accent-green)' };
  };

  const threatLevelInfo = computeThreatLevel();

  const pieData = analytics ? [
    { name: 'Safe', value: analytics.safe_count, color: COLORS.safe },
    { name: 'Suspicious', value: analytics.suspicious_count, color: COLORS.suspicious },
    { name: 'Phishing', value: analytics.phishing_count, color: COLORS.phishing },
  ].filter(d => d.value > 0) : [];

  const riskDistData = analytics?.risk_distribution
    ? Object.entries(analytics.risk_distribution).map(([range, count]) => ({
        range,
        count,
      }))
    : [];

  const widgets = prefs.enabledWidgets || {};
  const isMinimal = prefs.dashboardMode === 'minimal';

  return (
    <div>
      {/* Nexus Command Center Hero Header */}
      <motion.div
        className="dashboard-hero"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="hero-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', fontWeight: '800' }}>
              PHISHGUARD NEXUS
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              MODE: <strong style={{ color: 'var(--text-primary)', textTransform: 'uppercase' }}>{prefs.dashboardMode || 'SOC'}</strong>
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              THREAT LEVEL: <strong style={{ color: threatLevelInfo.color }}>{threatLevelInfo.level}</strong>
            </span>
          </div>

          <h1>AI Threat Operations Control Center</h1>
          <p className="hero-subtitle">
            Analyze suspicious URLs, trace decision evidence chains, and manage SOC threat investigation cases.
          </p>

          <div className="url-input-group hero-search-bar">
            <input
              id="dashboard-url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a website URL to analyze..."
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAnalyze()}
            />
            <button
              id="dashboard-scan-button"
              className="scan-button"
              onClick={handleQuickAnalyze}
            >
              <HiSearch /> ANALYZE URL
            </button>
          </div>
        </div>
      </motion.div>

      {/* B. System Status & Metrics Widgets */}
      {widgets.stats !== false && (
        <>
          <div className="section-header" style={{ marginTop: '36px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>📊 SOC System Metrics</h2>
          </div>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
            </div>
          ) : !analytics ? (
            <div className="empty-state">
              <div className="empty-icon">⚠️</div>
              <h3>Could not connect to backend server</h3>
              <p>Make sure the FastAPI backend is running on http://localhost:8000</p>
            </div>
          ) : (
            <>
              <motion.div
                className="stats-grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="stat-card cyan">
                  <div className="stat-label">Total Scans</div>
                  <div className="stat-value">{analytics.total_scans}</div>
                  <div className="stat-change" style={{ color: 'var(--text-secondary)' }}>
                    Real backend records
                  </div>
                </div>

                <div className="stat-card red">
                  <div className="stat-label">Phishing Detected</div>
                  <div className="stat-value">{analytics.phishing_count}</div>
                  <div className="stat-change" style={{ color: COLORS.phishing }}>
                    <HiShieldExclamation style={{ verticalAlign: 'middle' }} /> Threats flagged
                  </div>
                </div>

                <div className="stat-card green">
                  <div className="stat-label">Safe Predictions</div>
                  <div className="stat-value">{analytics.safe_count}</div>
                  <div className="stat-change" style={{ color: COLORS.safe }}>
                    <HiShieldCheck style={{ verticalAlign: 'middle' }} /> Low risk URLs
                  </div>
                </div>

                <div className="stat-card purple">
                  <div className="stat-label">Investigation Cases</div>
                  <div className="stat-value">{totalCases}</div>
                  <div className="stat-change" style={{ color: 'var(--accent-yellow)' }}>
                    Open: {openCasesCount} | Resolved: {resolvedCasesCount}
                  </div>
                </div>
              </motion.div>

              {/* SOC Threat Operations Overview Panel */}
              {!isMinimal && widgets.investigationQueue !== false && (
                <div className="report-section card-glass" style={{ marginTop: '24px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', margin: 0 }}>🛡️ THREAT OPERATIONS OVERVIEW (SOC PANEL)</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Live case metrics derived from database investigation records</p>
                    </div>
                    <button className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => navigate('/cases')}>
                      <HiBriefcase /> Manage Cases ({totalCases})
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>OPEN INVESTIGATIONS</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-yellow)', marginTop: '4px' }}>{openCasesCount}</div>
                    </div>

                    <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>HIGH / CRITICAL CASES</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-red)', marginTop: '4px' }}>{criticalCasesCount}</div>
                    </div>

                    <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CONFIRMED THREATS</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-red)', marginTop: '4px' }}>{confirmedThreatsCount}</div>
                    </div>

                    <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>FALSE POSITIVES</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-green)', marginTop: '4px' }}>{falsePositivesCount}</div>
                    </div>
                  </div>

                  {/* Recent Investigations List */}
                  {casesList.length > 0 ? (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px' }}>RECENT THREAT INVESTIGATIONS</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {casesList.slice(0, 4).map(c => (
                          <div
                            key={c.id}
                            onClick={() => navigate(`/cases/${c.id}`)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--border-color)' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span className="font-mono" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-cyan)' }}>#{c.case_number}</span>
                              <span className="url-cell" style={{ maxWidth: '340px', fontSize: '12px' }}>{c.url}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span className={`badge ${c.verdict?.toLowerCase()}`}>{c.verdict}</span>
                              <span className="badge suspicious" style={{ fontSize: '10px' }}>{c.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', margin: 0, padding: '12px' }}>
                      No active threat investigation cases recorded yet. Perform scans to initiate cases.
                    </p>
                  )}
                </div>
              )}

              {/* Threat Overview Charts */}
              {!isMinimal && (widgets.activity !== false || widgets.riskDist !== false) && (
                <div className="report-grid">
                  {widgets.activity !== false && (
                    <motion.div
                      className="chart-container"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <h3>Threat Level Distribution</h3>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            dataKey="value"
                            paddingAngle={4}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </motion.div>
                  )}

                  {widgets.riskDist !== false && (
                    <motion.div
                      className="chart-container"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h3>Risk Score Breakdown</h3>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={riskDistData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                          <XAxis dataKey="range" stroke="var(--text-muted)" fontSize={11} />
                          <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
                            }}
                          />
                          <Bar dataKey="count" fill={COLORS.cyan} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Recent Scans Widget */}
              {widgets.recentScans !== false && (
                <motion.div
                  className="report-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3><HiClock style={{ verticalAlign: 'middle', color: 'var(--accent-cyan)' }} /> Recent Scan History</h3>
                    <button className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => navigate('/history')}>
                      View All <HiArrowRight />
                    </button>
                  </div>

                  {analytics.recent_scans?.length > 0 ? (
                    <div className="table-responsive history-table-container">
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th>URL</th>
                            <th>Verdict</th>
                            <th>Risk Score</th>
                            <th>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.recent_scans.map((scan) => (
                            <tr key={scan.id} onClick={() => navigate('/history')}>
                              <td className="url-cell" title={scan.url}>{scan.url}</td>
                              <td>
                                <span className={`badge ${scan.verdict?.toLowerCase()}`}>
                                  {scan.verdict}
                                </span>
                              </td>
                              <td>
                                <span className={`score-badge ${scan.risk_score <= 30 ? 'low' : scan.risk_score <= 70 ? 'medium' : 'high'}`}>
                                  {scan.risk_score}/100
                                </span>
                              </td>
                              <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                {new Date(scan.created_at).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
                      No recent scans found.
                    </p>
                  )}
                </motion.div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
