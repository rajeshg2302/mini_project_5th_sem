import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiSearch, HiTrash, HiEye, HiRefresh, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { getHistory, deleteScan, getReport } from '../services/api';

export default function HistoryPage() {
  const [scans, setScans] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('');
  const [page, setPage] = useState(0);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const navigate = useNavigate();
  const limit = 15;

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { skip: page * limit, limit };
      if (search.trim()) params.search = search.trim();
      if (verdictFilter) params.verdict = verdictFilter;
      const data = await getHistory(params);
      
      let list = data.scans || [];
      if (sortOrder === 'asc') {
        list = [...list].reverse();
      }
      setScans(list);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, verdictFilter, sortOrder]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete scan record #${id}?`)) return;
    try {
      await deleteScan(id);
      loadHistory();
    } catch (err) {
      console.error('Failed to delete scan record:', err);
    }
  };

  const handleViewReport = async (scan) => {
    try {
      const report = await getReport(scan.id);
      navigate('/scan', { state: { report } });
    } catch (err) {
      console.error('Failed to fetch full scan report:', err);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🕐 Scan History</h1>
          <p className="page-subtitle">Search, filter, and inspect saved scan records stored in SQLite database</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/compare')}>
            ⚖️ Compare Scans
          </button>
          <button className="btn btn-outline" onClick={loadHistory}>
            <HiRefresh /> Refresh
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <input
            id="history-search"
            className="filter-input"
            type="text"
            placeholder="Search by URL domain or pattern..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>

        <select
          id="history-verdict-filter"
          className="filter-select"
          value={verdictFilter}
          onChange={(e) => { setVerdictFilter(e.target.value); setPage(0); }}
        >
          <option value="">All Threat Levels</option>
          <option value="Safe">Safe</option>
          <option value="Suspicious">Suspicious</option>
          <option value="Phishing">Phishing</option>
        </select>

        <select
          id="history-sort"
          className="filter-select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {/* Table Results */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
          <span style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading scan history...</span>
        </div>
      ) : scans.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No scans yet.</h3>
          <p>{search || verdictFilter ? 'No records match your active filters.' : 'Perform website scans in the Scanner to populate your history.'}</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Showing {scans.length} of {total} scan records</span>
            <span>Page {page + 1} of {totalPages || 1}</span>
          </div>

          <table className="history-table">
            <thead>
              <tr>
                <th>Scan ID</th>
                <th>URL</th>
                <th>Verdict</th>
                <th>Risk Score</th>
                <th>AI Confidence</th>
                <th>Timestamp</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr key={scan.id} onClick={() => handleViewReport(scan)}>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--text-muted)' }}>
                    #{scan.id}
                  </td>
                  <td className="url-cell">{scan.url}</td>
                  <td>
                    <span className={`badge ${scan.verdict?.toLowerCase()}`}>
                      {scan.verdict}
                    </span>
                  </td>
                  <td>
                    <span className={`score-badge ${scan.risk_score <= 30 ? 'low' : scan.risk_score <= 70 ? 'medium' : 'high'}`}>
                      {scan.risk_score} / 100
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {scan.confidence !== undefined ? (scan.confidence * 100).toFixed(1) : (scan.risk_score).toFixed(1)}%
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(scan.created_at).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleViewReport(scan)}
                        title="View Security Report"
                      >
                        <HiEye /> View
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={(e) => handleDelete(scan.id, e)}
                        title="Delete Record"
                      >
                        <HiTrash /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '28px' }}>
              <button
                className="btn btn-outline"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <HiChevronLeft /> Previous
              </button>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                className="btn btn-outline"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <HiChevronRight />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
