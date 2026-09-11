import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiSearch, HiX, HiClock, HiBriefcase, HiExternalLink } from 'react-icons/hi';
import { getHistory, getCases } from '../../services/api';

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [scans, setScans] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setScans([]);
      setCases([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [scansRes, casesRes] = await Promise.all([
          getHistory({ search: query.trim(), limit: 5 }).catch(() => ({ scans: [] })),
          getCases({ search: query.trim(), limit: 5 }).catch(() => ({ cases: [] })),
        ]);
        setScans(scansRes.scans || []);
        setCases(casesRes.cases || []);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 10000,
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '80px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="card-glass"
          style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '540px',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
            border: '1px solid var(--accent-cyan)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-elevated)',
            }}
          >
            <HiSearch style={{ fontSize: '22px', color: 'var(--accent-cyan)', marginRight: '12px' }} />
            <input
              autoFocus
              type="text"
              placeholder="Global Search scans & cases by URL, Case ID (e.g. PG-00001)..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '15px',
                fontFamily: 'inherit',
              }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}
            >
              <HiX />
            </button>
          </div>

          {/* Results Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Searching database records...
              </div>
            ) : !query.trim() ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Enter a search query to scan history and investigation cases.
              </div>
            ) : scans.length === 0 && cases.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No database records found matching "{query}".
              </div>
            ) : (
              <div>
                {/* Investigation Cases Results */}
                {cases.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <HiBriefcase style={{ color: 'var(--accent-cyan)' }} /> THREAT INVESTIGATION CASES ({cases.length})
                    </div>
                    {cases.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          navigate(`/cases/${c.id}`);
                          onClose();
                        }}
                        style={{
                          display: 'flex',
                          justify: 'space-between',
                          alignItems: 'center',
                          background: 'var(--bg-elevated)',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '6px',
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span className="font-mono" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                              #{c.case_number}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                              {c.url.length > 45 ? c.url.substring(0, 45) + '...' : c.url}
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Status: {c.status} • Created: {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className={`score-badge ${c.risk_score <= 30 ? 'low' : c.risk_score <= 70 ? 'medium' : 'high'}`}>
                            {c.risk_score}/100
                          </span>
                          <HiExternalLink style={{ color: 'var(--text-muted)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Scan History Results */}
                {scans.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <HiClock style={{ color: 'var(--accent-cyan)' }} /> SCAN HISTORY ({scans.length})
                    </div>
                    {scans.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          navigate('/history');
                          onClose();
                        }}
                        style={{
                          display: 'flex',
                          justify: 'space-between',
                          alignItems: 'center',
                          background: 'var(--bg-elevated)',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '6px',
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer',
                        }}
                      >
                        <div>
                          <div className="font-mono" style={{ fontSize: '12px', color: 'var(--accent-cyan)', marginBottom: '2px', wordBreak: 'break-all' }}>
                            {s.url.length > 45 ? s.url.substring(0, 45) + '...' : s.url}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Verdict: {s.verdict} • Scanned: {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className={`badge ${s.verdict?.toLowerCase()}`}>
                            {s.verdict}
                          </span>
                          <span className={`score-badge ${s.risk_score <= 30 ? 'low' : s.risk_score <= 70 ? 'medium' : 'high'}`}>
                            {s.risk_score}/100
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
