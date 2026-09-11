import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiSearch, HiTrash, HiEye, HiRefresh, HiChevronLeft, HiChevronRight,
  HiBriefcase, HiExclamation, HiCheckCircle, HiX, HiScale
} from 'react-icons/hi';
import { getHistory, deleteScan, getReport, createCase, clearHistory } from '../services/api';

export default function HistoryPage() {
  const [scans, setScans] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('');
  const [page, setPage] = useState(0);
  const [sortOrder, setSortOrder] = useState('desc');
  const navigate = useNavigate();
  const limit = 15;

  // Confirmation Modal States
  const [scanToDelete, setScanToDelete] = useState(null); // Individual scan object
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Notification Toasts
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  const triggerToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

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

  // Open Individual Delete Modal
  const openDeleteModal = (scan, e) => {
    e.stopPropagation();
    setScanToDelete(scan);
  };

  // Confirm Individual Delete
  const confirmIndividualDelete = async () => {
    if (!scanToDelete) return;
    setIsDeleting(true);
    try {
      await deleteScan(scanToDelete.id);
      triggerToast('success', '✓ Scan deleted successfully');
      setScanToDelete(null);
      loadHistory();
    } catch (err) {
      console.error('Failed to delete scan record:', err);
      triggerToast('error', 'Unable to delete scan. Try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Confirm Clear All History
  const confirmClearAllHistory = async () => {
    setIsClearing(true);
    try {
      await clearHistory();
      triggerToast('success', '✓ Scan history cleared successfully');
      setShowClearAllModal(false);
      setPage(0);
      loadHistory();
    } catch (err) {
      console.error('Failed to clear scan history:', err);
      triggerToast('error', 'Unable to clear scan history. Try again.');
    } finally {
      setIsClearing(false);
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

  const handleCompare = (scan, e) => {
    e.stopPropagation();
    navigate('/compare', { state: { scanA: scan } });
  };

  const handleInvestigate = async (scan, e) => {
    e.stopPropagation();
    try {
      const caseData = await createCase({
        url: scan.url,
        verdict: scan.verdict,
        risk_score: scan.risk_score,
        severity: scan.risk_score <= 30 ? 'LOW' : scan.risk_score <= 70 ? 'MEDIUM' : 'CRITICAL',
        scan_id: scan.id,
        status: 'NEW',
        analyst_notes: `Investigation launched from Scan History record #${scan.id}.`,
      });
      navigate(`/cases/${caseData.id}`);
    } catch (err) {
      console.error('Failed to launch investigation case:', err);
      triggerToast('error', 'Could not start investigation case.');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 9999,
              background: toast.type === 'success' ? 'var(--bg-card)' : '#7f1d1d',
              border: `1px solid ${toast.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '12px 18px',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            }}
          >
            {toast.type === 'success' ? (
              <HiCheckCircle style={{ color: 'var(--accent-green)', fontSize: '20px' }} />
            ) : (
              <HiExclamation style={{ color: 'var(--accent-red)', fontSize: '20px' }} />
            )}
            <span style={{ fontSize: '13px', fontWeight: '600' }}>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '8px' }}
            >
              <HiX />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">🕐 Scan History</h1>
          <p className="page-subtitle">Search, filter, and inspect saved scan records stored in SQLite database</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/compare')}>
            <HiScale /> Compare Scans
          </button>
          <button className="btn btn-outline" onClick={loadHistory}>
            <HiRefresh /> Refresh
          </button>
          {total > 0 && (
            <button
              id="clear-all-history-btn"
              className="btn btn-danger"
              onClick={() => setShowClearAllModal(true)}
              style={{ fontWeight: '700', padding: '8px 14px' }}
              title="Clear all stored scan records from database"
            >
              <HiTrash /> CLEAR ALL HISTORY
            </button>
          )}
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

      {/* Main Content Area */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
          <span style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading scan history...</span>
        </div>
      ) : total === 0 && !search && !verdictFilter ? (
        /* Empty State */
        <div className="empty-state card-glass" style={{ padding: '48px 24px', textAlign: 'center', marginTop: '20px' }}>
          <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
            NO SCAN HISTORY
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '420px', margin: '0 auto 24px auto' }}>
            No phishing scans or analysis records have been stored yet. Submit a website URL to begin automated security analysis.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/scan')} style={{ padding: '10px 24px', fontWeight: '700' }}>
            <HiSearch /> START NEW SCAN
          </button>
        </div>
      ) : scans.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No matching records found.</h3>
          <p>No stored scan records match your active search or filter criteria.</p>
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
                <th style={{ textAlign: 'center' }}>Actions</th>
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
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                        onClick={() => handleViewReport(scan)}
                        title="View Security Report"
                      >
                        <HiEye /> VIEW
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                        onClick={(e) => handleCompare(scan, e)}
                        title="Compare Scan"
                      >
                        <HiScale /> COMPARE
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                        onClick={(e) => openDeleteModal(scan, e)}
                        disabled={isDeleting && scanToDelete?.id === scan.id}
                        title="Delete scan record from database"
                      >
                        <HiTrash /> {isDeleting && scanToDelete?.id === scan.id ? 'Deleting...' : 'DELETE'}
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

      {/* Individual Delete Confirmation Modal */}
      <AnimatePresence>
        {scanToDelete && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-glass"
              style={{
                maxWidth: '480px', width: '100%', padding: '24px',
                border: '1px solid var(--accent-red)', background: 'var(--bg-card)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '50%', color: 'var(--accent-red)', fontSize: '24px' }}>
                  <HiExclamation />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                    DELETE SCAN?
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Database Record #{scanToDelete.id}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '14px' }}>
                Are you sure you want to permanently delete this scan?
              </p>

              <div style={{ background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>TARGET URL</div>
                <div className="font-mono" style={{ fontSize: '12px', color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
                  {scanToDelete.url}
                </div>
              </div>

              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-red)', marginBottom: '20px' }}>
                ⚠️ This action cannot be undone.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setScanToDelete(null)}
                  disabled={isDeleting}
                >
                  CANCEL
                </button>
                <button
                  id="confirm-delete-scan-btn"
                  className="btn btn-danger"
                  onClick={confirmIndividualDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'DELETE SCAN'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear All History Confirmation Modal */}
      <AnimatePresence>
        {showClearAllModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-glass"
              style={{
                maxWidth: '480px', width: '100%', padding: '24px',
                border: '2px solid var(--accent-red)', background: 'var(--bg-card)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.25)', padding: '12px', borderRadius: '50%', color: 'var(--accent-red)', fontSize: '26px' }}>
                  <HiTrash />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                    CLEAR ALL SCAN HISTORY?
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Bulk Database Deletion
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
                This will permanently delete all stored scan records in the SQLite database. All history entries and associated analytics counters will be reset.
              </p>

              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-red)', marginBottom: '22px' }}>
                ⚠️ This action cannot be undone.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setShowClearAllModal(false)}
                  disabled={isClearing}
                >
                  CANCEL
                </button>
                <button
                  id="confirm-clear-all-btn"
                  className="btn btn-danger"
                  onClick={confirmClearAllHistory}
                  disabled={isClearing}
                  style={{ background: 'var(--accent-red)', fontWeight: '800' }}
                >
                  {isClearing ? 'Clearing...' : 'CLEAR HISTORY'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
