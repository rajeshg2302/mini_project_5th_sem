import { useState, useEffect } from 'react';
import { HiMenu, HiX, HiShieldCheck, HiServer, HiChip, HiSearch, HiTerminal } from 'react-icons/hi';
import { getHealth } from '../../services/api';

export default function Header({ onToggleSidebar, sidebarOpen, onOpenCommandPalette, onOpenGlobalSearch }) {
  const [health, setHealth] = useState({ status: 'checking', models_loaded: false });
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000);
    const clockInterval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);

  const checkSystemStatus = async () => {
    const data = await getHealth();
    setHealth(data);
  };

  const isOnline = health.status === 'healthy' && health.models_loaded;

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          className="mobile-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? <HiX /> : <HiMenu />}
        </button>

        <div className="header-title-wrapper">
          <div className="security-badge">
            <HiShieldCheck /> NEXUS CONTROL CENTER
          </div>
          <span className="system-clock font-mono">{time}</span>
        </div>

        {/* Command Palette & Search Quick Triggers */}
        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
          <button
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={onOpenCommandPalette}
            title="Open Command Palette (Ctrl+K)"
          >
            <HiTerminal style={{ color: 'var(--accent-cyan)' }} />
            <span>Command Palette</span>
            <span className="font-mono" style={{ fontSize: '10px', background: 'var(--bg-elevated)', padding: '2px 4px', borderRadius: '3px' }}>
              Ctrl+K
            </span>
          </button>

          <button
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={onOpenGlobalSearch}
            title="Global Search Scans & Cases"
          >
            <HiSearch style={{ color: 'var(--accent-cyan)' }} />
            <span>Global Search</span>
          </button>
        </div>
      </div>

      <div className="header-right">
        {/* Real Backend Status Indicator */}
        <div
          className={`system-status-indicator ${isOnline ? 'online' : 'offline'}`}
          title={isOnline ? "Backend active & ML models ready" : "Backend unreachable or models not loaded"}
        >
          <span className="status-dot animate-pulse"></span>
          <span className="status-label">
            {isOnline ? 'AI ENGINE ONLINE' : 'AI ENGINE OFFLINE'}
          </span>
        </div>

        <div className="system-pill" title="Nexus Architecture">
          <HiChip style={{ color: 'var(--accent-cyan)' }} />
          <span>NEXUS v1.0</span>
        </div>
      </div>
    </header>
  );
}
