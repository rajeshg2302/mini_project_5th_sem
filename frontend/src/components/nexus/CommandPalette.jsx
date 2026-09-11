import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiSearch, HiHome, HiClock, HiBriefcase, HiChartSquareBar,
  HiCube, HiLightningBolt, HiCog, HiColorSwatch, HiTrash, HiX
} from 'react-icons/hi';
import { usePreferences } from '../../context/PreferencesContext';
import { clearHistory } from '../../services/api';

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { prefs, updatePref, addToast } = usePreferences();

  const commands = [
    { id: 'nav_dashboard', title: 'Open Dashboard', category: 'Navigation', icon: <HiHome />, action: () => navigate('/') },
    { id: 'nav_scan', title: 'Start New Scan', category: 'Action', icon: <HiSearch />, action: () => navigate('/scan') },
    { id: 'nav_history', title: 'Open Scan History', category: 'Navigation', icon: <HiClock />, action: () => navigate('/history') },
    { id: 'nav_cases', title: 'Open Threat Cases', category: 'Navigation', icon: <HiBriefcase />, action: () => navigate('/cases') },
    { id: 'nav_analytics', title: 'Open Threat Analytics', category: 'Navigation', icon: <HiChartSquareBar />, action: () => navigate('/analytics') },
    { id: 'nav_models', title: 'Open AI Model Lab', category: 'Navigation', icon: <HiCube />, action: () => navigate('/models') },
    { id: 'nav_simulator', title: 'Open Threat Simulator', category: 'Navigation', icon: <HiLightningBolt />, action: () => navigate('/simulator') },
    { id: 'nav_settings', title: 'Open Control Center (Settings)', category: 'Navigation', icon: <HiCog />, action: () => navigate('/settings') },
    {
      id: 'action_theme',
      title: `Toggle Theme (Current: ${prefs.theme})`,
      category: 'Preferences',
      icon: <HiColorSwatch />,
      action: () => {
        const themes = ['nexus-dark', 'midnight', 'carbon', 'high-contrast'];
        const nextTheme = themes[(themes.indexOf(prefs.theme) + 1) % themes.length];
        updatePref('theme', nextTheme);
        addToast(`Theme changed to ${nextTheme}`, 'info');
      },
    },
    {
      id: 'action_clear_history',
      title: 'Clear Scan History',
      category: 'Danger',
      icon: <HiTrash />,
      action: async () => {
        if (window.confirm('Clear all scan history from database?')) {
          try {
            await clearHistory();
            addToast('Scan history cleared successfully', 'success');
          } catch (err) {
            addToast('Failed to clear history', 'error');
          }
        }
      },
    },
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open command palette
          window.dispatchEvent(new CustomEvent('open-command-palette'));
        }
      }
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

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
          paddingTop: '100px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          className="card-glass"
          style={{
            maxWidth: '600px',
            width: '100%',
            maxHeight: '480px',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
            border: '1px solid var(--accent-primary)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Search Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-elevated)',
            }}
          >
            <HiSearch style={{ fontSize: '20px', color: 'var(--accent-primary)', marginRight: '12px' }} />
            <input
              autoFocus
              type="text"
              placeholder="Type a command or search (e.g. Scan, History, Theme)..."
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
            <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
              ESC
            </span>
          </div>

          {/* Commands List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No commands matching "{query}"
              </div>
            ) : (
              filtered.map((cmd, idx) => (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: idx === selectedIndex ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                    border: idx === selectedIndex ? '1px solid var(--accent-primary)' : '1px solid transparent',
                    cursor: 'pointer',
                    marginBottom: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px', color: idx === selectedIndex ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                      {cmd.icon}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: idx === selectedIndex ? '700' : '500', color: 'var(--text-primary)' }}>
                      {cmd.title}
                    </span>
                  </div>
                  <span className="badge" style={{ fontSize: '10px', background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                    {cmd.category}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Footer Shortcuts hint */}
          <div style={{ padding: '8px 16px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>Navigate: ↑ ↓ • Select: Enter</span>
            <span>PhishGuard Nexus Command Palette</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
