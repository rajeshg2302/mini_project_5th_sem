import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiSearch, HiRefresh, HiEye, HiTrash, HiBriefcase, HiFilter, HiExclamation, HiShieldExclamation, HiSortDescending } from 'react-icons/hi';
import { getCases, getCaseStats, deleteCase } from '../services/api';

export default function CasesPage() {
  const [cases, setCases] = useState([]);
  const [highRiskQueue, setHighRiskQueue] = useState([]);
  const [stats, setStats] = useState({ total: 0, open_cases: 0, confirmed_threats: 0, false_positives: 0, resolved: 0, high_risk_queue: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState('newest');
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const limit = 15;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch aggregate case stats from backend API
      const statsData = await getCaseStats().catch(() => null);
      if (statsData) setStats(statsData);

      // Fetch paginated cases with sort parameter
      const params = { skip: page * limit, limit, sort: sortOption };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (severityFilter !== 'ALL') params.severity = severityFilter;

      const data = await getCases(params);
      setCases(data.cases || []);
      setTotal(data.total || 0);

      // Fetch high risk queue for dedicated panel (status NEW or INVESTIGATING & risk >= 70)
      const highRiskData = await getCases({ limit: 5, sort: 'highest_risk', status: 'ALL' }).catch(() => null);
      if (highRiskData && highRiskData.cases) {
        const filteredHighRisk = highRiskData.cases.filter(
          (c) => (c.status === 'NEW' || c.status === 'INVESTIGATING') && c.risk_score >= 70
        );
        setHighRiskQueue(filteredHighRisk);
      }
    } catch (err) {
      console.error('Failed to load investigation cases data:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, severityFilter, sortOption]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id, caseNumber, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete investigation case #${caseNumber}? This deletes the case record but preserves original scan history.`)) return;
    try {
      await deleteCase(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete case:', err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'NEW':
        return <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>NEW</span>;
      case 'INVESTIGATING':
        return <span className="badge suspicious">INVESTIGATING</span>;
      case 'CONFIRMED THREAT':
        return <span className="badge phishing">CONFIRMED THREAT</span>;
      case 'FALSE POSITIVE':
        return <span className="badge safe">FALSE POSITIVE</span>;
      case 'RESOLVED':
        return <span className="badge safe">RESOLVED</span>;
      default:
        return <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{status}</span>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">💼 Threat Investigation Cases</h1>
          <p className="page-subtitle">Persistent SOC case management, analyst forensic assessments, and security reports</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/scan')}>
            <HiSearch /> New Scan & Investigate
          </button>
          <button className="btn btn-outline" onClick={loadData}>
            <HiRefresh /> Refresh
          </button>
        </div>
      </div>

      {/* Statistics Header Banner */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card cyan">
          <div className="stat-label">Total Cases</div>
          <div className="stat-value">{stats.total || total}</div>
          <div className="stat-change" style={{ color: 'var(--text-secondary)' }}>Persistent DB records</div>
        </div>

        <div className="stat-card purple">
          <div className="stat-label">Open Investigations</div>
          <div className="stat-value">{stats.open_cases}</div>
          <div className="stat-change" style={{ color: 'var(--accent-yellow)' }}>New / Active</div>
        </div>

        <div className="stat-card red">
          <div className="stat-label">High-Risk Queue</div>
          <div className="stat-value">{stats.high_risk_queue}</div>
          <div className="stat-change" style={{ color: 'var(--accent-red)' }}>Risk score ≥ 70</div>
        </div>

        <div className="stat-card green">
          <div className="stat-label">Resolved / False Pos.</div>
          <div className="stat-value">{(stats.resolved || 0) + (stats.false_positives || 0)}</div>
          <div className="stat-change" style={{ color: 'var(--accent-green)' }}>Completed cases</div>
        </div>
      </div>

      {/* High-Risk Active Investigations Queue Panel */}
      {highRiskQueue.length > 0 && (
        <motion.div
          className="report-section card-glass"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent-red)', background: 'rgba(239, 68, 68, 0.05)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', color: 'var(--accent-red)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HiShieldExclamation /> HIGH-RISK INVESTIGATIONS QUEUE (IMMEDIATE ANALYST ACTION REQUIRED)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{highRiskQueue.length} Active High-Risk Cases</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
            {highRiskQueue.map((hc) => (
              <div
                key={hc.id}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/cases/${hc.id}`)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="font-mono" style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                      #{hc.case_number}
                    </span>
                    <span className="badge phishing" style={{ fontSize: '10px' }}>
                      RISK {hc.risk_score}/100
                    </span>
                  </div>
                  <div className="font-mono" style={{ fontSize: '12px', color: 'var(--text-primary)', wordBreak: 'break-all', maxWidth: '240px' }}>
                    {hc.url.length > 35 ? hc.url.substring(0, 35) + '...' : hc.url}
                  </div>
                </div>

                <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}>
                  Investigate
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filter, Search, and Sort Controls */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <input
            id="cases-search"
            className="filter-input"
            type="text"
            placeholder="Search by Case ID (e.g. PG-00001) or URL..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>

        <select
          id="cases-status-filter"
          className="filter-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
        >
          <option value="ALL">All Statuses</option>
          <option value="NEW">New</option>
          <option value="INVESTIGATING">Investigating</option>
          <option value="CONFIRMED THREAT">Confirmed Threat</option>
          <option value="FALSE POSITIVE">False Positive</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        <select
          id="cases-severity-filter"
          className="filter-select"
          value={severityFilter}
          onChange={(e) => { setSeverityFilter(e.target.value); setPage(0); }}
        >
          <option value="ALL">All Risk Levels</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="GUARDED">Guarded</option>
          <option value="LOW">Low</option>
        </select>

        <select
          id="cases-sort-select"
          className="filter-select"
          value={sortOption}
          onChange={(e) => { setSortOption(e.target.value); setPage(0); }}
        >
          <option value="newest">Sort: Newest First</option>
          <option value="oldest">Sort: Oldest First</option>
          <option value="highest_risk">Sort: Highest Risk</option>
          <option value="lowest_risk">Sort: Lowest Risk</option>
        </select>
      </div>

      {/* Table Results */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
          <span style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading threat investigation cases...</span>
        </div>
      ) : cases.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3>No threat investigations recorded yet.</h3>
          <p>
            {search || statusFilter !== 'ALL' || severityFilter !== 'ALL'
              ? 'No cases match your active search or filter criteria.'
              : 'Start an investigation from any scan result in the Scanner or Scan History.'}
          </p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/scan')}>
            Go to Scanner
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Showing {cases.length} of {total} investigation cases</span>
          </div>

          <div className="table-responsive history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Case Number</th>
                  <th>Target URL</th>
                  <th>Verdict</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} onClick={() => navigate(`/cases/${c.id}`)}>
                    <td className="font-mono" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-cyan)' }}>
                      #{c.case_number}
                    </td>
                    <td className="url-cell" title={c.url}>{c.url}</td>
                    <td>
                      <span className={`badge ${c.verdict?.toLowerCase()}`}>
                        {c.verdict}
                      </span>
                    </td>
                    <td>
                      <span className={`score-badge ${c.risk_score <= 30 ? 'low' : c.risk_score <= 70 ? 'medium' : 'high'}`}>
                        {c.risk_score} / 100
                      </span>
                    </td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {c.created_at ? new Date(c.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => navigate(`/cases/${c.id}`)}
                          title="Investigate Case"
                        >
                          <HiEye /> Investigate
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={(e) => handleDelete(c.id, c.case_number, e)}
                          title="Delete Case Record"
                        >
                          <HiTrash /> Delete
                        </button>
                      </div>
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
