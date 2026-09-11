import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { HiShieldCheck, HiShieldExclamation, HiChartBar, HiExclamation, HiRefresh } from 'react-icons/hi';
import { getAnalytics } from '../services/api';

const COLORS = {
  safe: '#10b981',
  suspicious: '#f59e0b',
  phishing: '#ef4444',
  cyan: '#06b6d4',
  purple: '#8b5cf6',
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Could not connect to API analytics endpoint. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <span style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Fetching live analytics...</span>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <h3>Analytics Unavailable</h3>
        <p>{error || 'Failed to retrieve analytics data from server.'}</p>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={loadAnalytics}>
          <HiRefresh /> Retry Connection
        </button>
      </div>
    );
  }

  const pieData = [
    { name: 'Safe', value: analytics.safe_count, color: COLORS.safe },
    { name: 'Suspicious', value: analytics.suspicious_count, color: COLORS.suspicious },
    { name: 'Phishing', value: analytics.phishing_count, color: COLORS.phishing },
  ].filter(d => d.value > 0);

  const riskDistData = analytics.risk_distribution
    ? Object.entries(analytics.risk_distribution).map(([range, count]) => ({
        range: `Score ${range}`,
        count,
      }))
    : [];

  const dailyData = analytics.daily_scans || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📈 Threat Analytics</h1>
          <p className="page-subtitle">Real-time threat distribution and detection metrics from the scan database</p>
        </div>
        <button className="btn btn-outline" onClick={loadAnalytics}>
          <HiRefresh /> Refresh
        </button>
      </div>

      {/* Metrics Header */}
      <motion.div
        className="stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="stat-card cyan">
          <div className="stat-label">Total Analyzed URLs</div>
          <div className="stat-value">{analytics.total_scans}</div>
          <div className="stat-change" style={{ color: 'var(--text-secondary)' }}>
            Database records
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-label">Phishing Detected</div>
          <div className="stat-value">{analytics.phishing_count}</div>
          <div className="stat-change" style={{ color: COLORS.phishing }}>
            <HiShieldExclamation style={{ verticalAlign: 'middle' }} /> Malicious threats
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-label">Safe URLs</div>
          <div className="stat-value">{analytics.safe_count}</div>
          <div className="stat-change" style={{ color: COLORS.safe }}>
            <HiShieldCheck style={{ verticalAlign: 'middle' }} /> Low risk
          </div>
        </div>

        <div className="stat-card yellow">
          <div className="stat-label">Suspicious URLs</div>
          <div className="stat-value">{analytics.suspicious_count}</div>
          <div className="stat-change" style={{ color: COLORS.suspicious }}>
            <HiExclamation style={{ verticalAlign: 'middle' }} /> Requires caution
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-label">Average Risk Score</div>
          <div className="stat-value">{analytics.average_risk_score} <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/100</span></div>
          <div className="stat-change" style={{ color: 'var(--accent-purple)' }}>
            Threat Rate: {analytics.threat_percentage}%
          </div>
        </div>
      </motion.div>

      {analytics.total_scans === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📡</div>
          <h3>No scan data recorded yet</h3>
          <p>Scan website URLs using the Scanner to populate threat analytics graphs.</p>
        </div>
      ) : (
        <>
          {/* Main Visualizations */}
          <div className="report-grid">
            {/* Phishing vs Legitimate Distribution */}
            <motion.div
              className="chart-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3>🛡️ Threat Verdict Breakdown</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
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

            {/* Risk Level Distribution */}
            <motion.div
              className="chart-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3>📊 Risk Score Histogram</h3>
              <ResponsiveContainer width="100%" height={280}>
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

          {/* Activity Over Time */}
          {dailyData.length > 0 && (
            <motion.div
              className="chart-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3>📅 Scan Activity (30-Day Trend)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke={COLORS.cyan} strokeWidth={2} fillOpacity={1} fill="url(#scanGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
