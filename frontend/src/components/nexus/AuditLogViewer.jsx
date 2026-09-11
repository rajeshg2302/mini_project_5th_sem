import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HiShieldCheck, HiRefresh, HiSearch, HiFilter, HiClipboardList } from 'react-icons/hi';
import { getAuditLogs } from '../../services/api';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState('newest');
  const [page, setPage] = useState(0);
  const limit = 15;

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { skip: page * limit, limit, sort: sortOption };
      if (search.trim()) params.search = search.trim();
      if (eventTypeFilter !== 'ALL') params.event_type = eventTypeFilter;

      const data = await getAuditLogs(params);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, eventTypeFilter, sortOption]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'WARN':
        return <span className="badge suspicious" style={{ fontSize: '10px' }}>WARN</span>;
      case 'ERROR':
        return <span className="badge phishing" style={{ fontSize: '10px' }}>ERROR</span>;
      default:
        return <span className="badge safe" style={{ fontSize: '10px' }}>INFO</span>;
    }
  };

  return (
    <div className="report-section card-glass" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HiClipboardList style={{ color: 'var(--accent-cyan)' }} /> SYSTEM SECURITY AUDIT LOG
        </h3>
        <button className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={loadAuditLogs}>
          <HiRefresh /> Refresh Logs
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="filter-bar" style={{ marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <input
            id="audit-log-search"
            className="filter-input"
            type="text"
            placeholder="Search audit action details..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>

        <select
          id="audit-event-type-filter"
          className="filter-select"
          value={eventTypeFilter}
          onChange={(e) => { setEventTypeFilter(e.target.value); setPage(0); }}
        >
          <option value="ALL">All Event Types</option>
          <option value="SCAN_CREATED">Scan Created</option>
          <option value="CASE_CREATED">Case Created</option>
          <option value="STATUS_CHANGED">Status Changed</option>
          <option value="SCAN_DELETED">Scan Deleted</option>
          <option value="HISTORY_CLEARED">History Cleared</option>
          <option value="CASE_DELETED">Case Deleted</option>
          <option value="REPORT_GENERATED">Report Generated</option>
          <option value="SETTINGS_CHANGED">Settings Changed</option>
        </select>

        <select
          id="audit-sort-select"
          className="filter-select"
          value={sortOption}
          onChange={(e) => { setSortOption(e.target.value); setPage(0); }}
        >
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
        </select>
      </div>

      {/* Table Results */}
      {loading ? (
        <div className="loading-spinner" style={{ minHeight: '180px' }}>
          <div className="spinner" />
        </div>
      ) : logs.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          No security audit events recorded matching criteria.
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {logs.length} of {total} audit log events
          </div>
          <table className="history-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event Type</th>
                <th>Action Details</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="font-mono" style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {l.timestamp ? new Date(l.timestamp).toLocaleString() : 'N/A'}
                  </td>
                  <td>
                    <span className="font-mono" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-cyan)' }}>
                      {l.event_type}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{l.action_details}</td>
                  <td>{getSeverityBadge(l.severity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
