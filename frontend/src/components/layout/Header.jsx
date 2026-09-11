import { useState, useEffect } from 'react';
import { HiMenu, HiX, HiShieldCheck, HiServer, HiChip } from 'react-icons/hi';
import { getHealth } from '../../services/api';

export default function Header({ onToggleSidebar, sidebarOpen }) {
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
            <HiShieldCheck /> SOC THREAT INTEL
          </div>
          <span className="system-clock font-mono">{time}</span>
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

        <div className="system-pill" title="Phase 3 Integration Verified">
          <HiChip style={{ color: 'var(--accent-cyan)' }} />
          <span>ENSEMBLE ARCH</span>
        </div>
      </div>
    </header>
  );
}
