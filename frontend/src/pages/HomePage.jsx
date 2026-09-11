import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiShieldCheck, HiSearch, HiLightningBolt, HiChartBar, HiClock, HiArrowRight } from 'react-icons/hi';
import { scanURL } from '../services/api';

const features = [
  { icon: <HiSearch />, title: 'Smart URL Scanner', desc: 'Advanced URL analysis with 22+ features' },
  { icon: <HiLightningBolt />, title: 'ML-Powered Detection', desc: 'Ensemble of 3 trained models' },
  { icon: <HiChartBar />, title: 'Explainable AI', desc: 'Understand why URLs are flagged' },
  { icon: <HiClock />, title: 'Scan History', desc: 'Track and review all your scans' },
];

const DEMO_URLS = [
  { url: 'https://www.google.com', label: 'Google (Safe)', type: 'safe' },
  { url: 'http://192.168.1.100/login/verify-account.html', label: 'IP-based phishing', type: 'phishing' },
  { url: 'http://paypa1-secure.tk/account', label: 'Typosquatting', type: 'phishing' },
  { url: 'https://github.com', label: 'GitHub (Safe)', type: 'safe' },
  { url: 'http://login.amazon.security-update.xyz', label: 'Subdomain abuse', type: 'phishing' },
  { url: 'https://bit.ly/abcdef', label: 'URL Shortener', type: 'phishing' },
];

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleScan = async (targetUrl) => {
    const scanUrl = targetUrl || url;
    if (!scanUrl.trim()) {
      setError('Please enter a URL');
      return;
    }
    setError('');
    setScanning(true);
    try {
      const result = await scanURL(scanUrl);
      navigate('/scan', { state: { report: result } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to scan URL. Is the backend running?');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <motion.div
        className="scanner-hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ marginTop: '40px' }}
      >
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>
          <HiShieldCheck style={{ color: 'var(--accent-cyan)' }} />
        </div>
        <h1>PhishGuard</h1>
        <p style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto 8px' }}>
          AI-Powered Phishing Website Detection & Explainable Cyber Threat Analysis
        </p>
        <p>Protect yourself from malicious websites with real machine learning</p>
      </motion.div>

      {/* Quick Scan */}
      <motion.div
        className="scanner-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="url-input-wrapper">
          <div className="url-input-group">
            <input
              id="home-url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a website URL to scan..."
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              disabled={scanning}
            />
            <button
              id="home-scan-button"
              className={`scan-button ${scanning ? 'scanning' : ''}`}
              onClick={() => handleScan()}
              disabled={scanning}
            >
              {scanning ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Scanning...
                </>
              ) : (
                <>
                  <HiSearch /> Scan URL
                </>
              )}
            </button>
          </div>
          {error && (
            <p style={{ color: 'var(--accent-red)', fontSize: '14px', marginTop: '12px', textAlign: 'center' }}>
              {error}
            </p>
          )}
        </div>
      </motion.div>

      {/* Feature Cards */}
      <motion.div
        className="stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{ maxWidth: '900px', margin: '0 auto 48px' }}
      >
        {features.map((f, i) => (
          <div key={i} className={`stat-card ${['cyan', 'purple', 'green', 'yellow'][i]}`}>
            <div style={{ fontSize: '28px', marginBottom: '12px', color: 'var(--accent-cyan)' }}>
              {f.icon}
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>{f.title}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{f.desc}</div>
          </div>
        ))}
      </motion.div>

      {/* AI Threat Simulation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        style={{ maxWidth: '900px', margin: '0 auto' }}
      >
        <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>
          🎯 AI Threat Simulation
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Try scanning these example URLs to see how PhishGuard detects different phishing patterns
        </p>
        <div className="simulation-grid">
          {DEMO_URLS.map((demo, i) => (
            <motion.div
              key={i}
              className="simulation-card"
              onClick={() => {
                setUrl(demo.url);
                handleScan(demo.url);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="sim-type">
                <span className={`badge ${demo.type}`}>{demo.type}</span>
                <span style={{ marginLeft: '8px', color: 'var(--text-secondary)' }}>{demo.label}</span>
              </div>
              <div className="sim-url" style={{ marginTop: '8px' }}>{demo.url}</div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Click to scan <HiArrowRight />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
