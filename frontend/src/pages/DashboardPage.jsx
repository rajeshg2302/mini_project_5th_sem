import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import { HiShieldCheck, HiShieldExclamation, HiExclamation, HiSearch, HiClock, HiArrowRight } from 'react-icons/hi';
import { getAnalytics } from '../services/api';

const COLORS = {
  safe: '#10b981',
  suspicious: '#f59e0b',
  phishing: '#ef4444',
  cyan: '#06b6d4',
};

export default function DashboardPage() {
  const [url, setUrl] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAnalyze = () => {
    if (!url.trim()) return;
    navigate('/scan', { state: { autoScanUrl: url.trim() } });
  };

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

  return (
    <div>
      {/* A. Hero Section */}
      <motion.div
        className="dashboard-hero"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="hero-content">
          <h1>AI-Powered Phishing Intelligence</h1>
          <p className="hero-subtitle">
            Analyze suspicious URLs using machine learning and explainable threat analysis.
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

      {/* B. Statistics (REAL Backend Data) */}
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
              <div className="stat-label">Average Risk Score</div>
              <div className="stat-value">{analytics.average_risk_score}</div>
              <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
                Threat percentage: {analytics.threat_percentage}%
              </div>
            </div>
          </motion.div>

          {/* If No History Exists: Show Proper Empty State (No Fabricated Stats) */}
          {analytics.total_scans === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No scans recorded yet</h3>
              <p>Enter a URL in the box above to perform your first real security analysis.</p>
            </div>
          ) : (
            <>
              {/* D. Threat Overview Charts */}
              <div className="report-grid">
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
              </div>

              {/* C. Recent Scans */}
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
                          <td className="url-cell">{scan.url}</td>
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
                ) : (
                  <p style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
                    No recent scans found.
                  </p>
                )}
              </motion.div>
            </>
          )}
        </>
      )}
    </div>
  );
}
