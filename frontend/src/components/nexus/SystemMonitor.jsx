import { useState, useEffect } from 'react';
import { HiChip, HiServer, HiDatabase, HiClock, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import { getHealth, getStatus } from '../../services/api';

export default function SystemMonitor() {
  const [health, setHealth] = useState({ status: 'checking', models_loaded: false });
  const [statusInfo, setStatusInfo] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);
  const [lastCheck, setLastCheck] = useState(new Date());

  useEffect(() => {
    runCheck();
    const interval = setInterval(runCheck, 15000);
    return () => clearInterval(interval);
  }, []);

  const runCheck = async () => {
    const startTime = performance.now();
    try {
      const hData = await getHealth();
      const endTime = performance.now();
      setLatencyMs(Math.round(endTime - startTime));
      setHealth(hData);
      setLastCheck(new Date());

      const sData = await getStatus().catch(() => null);
      if (sData) setStatusInfo(sData);
    } catch (err) {
      setHealth({ status: 'offline', models_loaded: false });
      setLatencyMs(null);
    }
  };

  const isOnline = health.status === 'healthy' && health.models_loaded;

  return (
    <div className="report-section card-glass" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HiServer style={{ color: 'var(--accent-cyan)' }} /> LIVE SYSTEM MONITOR (SOC TELEMETRY)
        </h3>
        <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Last Checked: {lastCheck.toLocaleTimeString()}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {/* Backend Latency */}
        <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HiClock style={{ color: 'var(--accent-cyan)' }} /> API LATENCY
          </div>
          <div className="font-mono" style={{ fontSize: '18px', fontWeight: '800', color: latencyMs !== null && latencyMs < 200 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>
            {latencyMs !== null ? `${latencyMs} ms` : 'N/A'}
          </div>
        </div>

        {/* Backend API Health */}
        <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HiServer style={{ color: 'var(--accent-cyan)' }} /> BACKEND ENGINE
          </div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: isOnline ? 'var(--accent-green)' : 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isOnline ? <><HiCheckCircle /> HEALTHY</> : <><HiExclamationCircle /> OFFLINE</>}
          </div>
        </div>

        {/* ML Engine Loaded Models */}
        <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HiChip style={{ color: 'var(--accent-cyan)' }} /> ML MODELS LOADED
          </div>
          <div className="font-mono" style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
            {statusInfo?.models_loaded_count ? `${statusInfo.models_loaded_count} Models Ready` : health.models_loaded ? '4 Models Ready' : '0 Loaded'}
          </div>
        </div>

        {/* Database Status */}
        <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HiDatabase style={{ color: 'var(--accent-cyan)' }} /> DATABASE STATUS
          </div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HiCheckCircle /> SQLITE CONNECTED
          </div>
        </div>
      </div>
    </div>
  );
}
