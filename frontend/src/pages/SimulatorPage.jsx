import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiLightningBolt, HiShieldCheck, HiExclamation, HiShieldExclamation, HiArrowRight, HiInformationCircle, HiRefresh, HiAdjustments } from 'react-icons/hi';
import { scanURL } from '../services/api';

const SIMULATION_PRESETS = [
  {
    id: 'ip-phish',
    title: 'IP Address Hostname',
    category: 'Network Anomaly',
    url: 'http://192.168.1.100/login/verify-account.html',
    description: 'Bypasses standard domain name registration by placing a raw IPv4 address in place of a domain hostname.',
    type: 'phishing',
  },
  {
    id: 'typo-phish',
    title: 'Typosquatting & Brand Spoof',
    category: 'Domain Imitation',
    url: 'http://paypa1-secure-login.tk/verification',
    description: 'Uses character substitution (e.g. 1 instead of l) and free suspicious TLD (.tk) to fool users.',
    type: 'phishing',
  },
  {
    id: 'subdomain-phish',
    title: 'Subdomain Abuse',
    category: 'Structure Anomaly',
    url: 'http://login.amazon.security-update.account-verify.xyz/signin',
    description: 'Stuffs known brand names into subdomains while using a suspicious root TLD (.xyz).',
    type: 'phishing',
  },
  {
    id: 'shortener-phish',
    title: 'Shortened URL Redirection',
    category: 'Obfuscation',
    url: 'http://bit.ly/3x8K9zQ?redirect=login',
    description: 'Hides true destination address behind shortener domains (bit.ly, tinyurl) with suspicious parameters.',
    type: 'phishing',
  },
  {
    id: 'google-safe',
    title: 'Legitimate Domain (Google)',
    category: 'Clean Record',
    url: 'https://www.google.com/search?q=phishguard',
    description: 'Standard legitimate URL using HTTPS, standard domain length, zero phishing keywords.',
    type: 'safe',
  },
];

export default function SimulatorPage() {
  const [originalScan, setOriginalScan] = useState(null);
  const [simulatedScan, setSimulatedScan] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [activeUrl, setActiveUrl] = useState('');
  
  // Interactive feature modification toggles
  const [toggleIp, setToggleIp] = useState(false);
  const [toggleHttps, setToggleHttps] = useState(true);
  const [toggleKeywords, setToggleKeywords] = useState(false);
  const navigate = useNavigate();

  const runOriginalScan = async (targetUrl) => {
    const url = targetUrl || activeUrl;
    if (!url) return;

    setActiveUrl(url);
    setScanning(true);
    setError(null);

    try {
      const origReport = await scanURL(url);
      setOriginalScan(origReport);
      
      // Calculate initial simulated version
      let simUrl = url;
      if (toggleIp && !simUrl.includes('192.168.1.1')) {
        simUrl = 'http://192.168.1.1/login.php';
      }
      const simReport = await scanURL(simUrl);
      setSimulatedScan(simReport);
    } catch (err) {
      setError('Simulation analysis failed. Ensure backend is running.');
    } finally {
      setScanning(false);
    }
  };

  const handleApplyFeatureChange = async (newIp, newHttps, newKw) => {
    setToggleIp(newIp);
    setToggleHttps(newHttps);
    setToggleKeywords(newKw);

    if (!activeUrl) return;
    setScanning(true);

    try {
      let modifiedUrl = activeUrl;
      if (newIp) {
        modifiedUrl = 'http://192.168.1.50/login.php';
      } else {
        if (!newHttps && modifiedUrl.startsWith('https://')) {
          modifiedUrl = modifiedUrl.replace('https://', 'http://');
        } else if (newHttps && modifiedUrl.startsWith('http://')) {
          modifiedUrl = modifiedUrl.replace('http://', 'https://');
        }
      }

      if (newKw && !modifiedUrl.includes('verify')) {
        modifiedUrl += '?verify=account&login=update';
      }

      const res = await scanURL(modifiedUrl);
      setSimulatedScan(res);
    } catch (err) {
      console.error('Simulation change error:', err);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚡ Threat Simulator & Feature Modifier</h1>
          <p className="page-subtitle">Interactive ML inference simulation comparing original vs modified URL risk scores</p>
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="disclaimer-banner info-banner" style={{ marginBottom: '28px' }}>
        <HiInformationCircle className="disclaimer-icon" />
        <div>
          <strong className="disclaimer-title">MODEL SIMULATION NOTICE</strong>
          <p className="disclaimer-text">
            This simulation demonstrates how the trained ML ensemble responds to controlled feature changes in real-time.
            It does not determine whether a real website is safe and never modifies stored database scan records.
          </p>
        </div>
      </div>

      {/* Preset Demonstrations */}
      <div className="report-section" style={{ marginBottom: '32px' }}>
        <h3>🎯 Preset Simulation Targets</h3>
        <div className="simulation-grid" style={{ marginTop: '16px' }}>
          {SIMULATION_PRESETS.map((preset) => (
            <motion.div
              key={preset.id}
              className="simulation-card"
              whileHover={{ scale: 1.02, borderColor: 'var(--accent-cyan)' }}
              onClick={() => runOriginalScan(preset.url)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="badge" style={{ background: 'var(--bg-card)', color: 'var(--accent-cyan)', fontSize: '10px' }}>
                  {preset.category}
                </span>
                <span className={`badge ${preset.type}`}>{preset.type}</span>
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>{preset.title}</h4>
              <div className="sim-url" style={{ marginBottom: '8px' }}>{preset.url}</div>
              <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                Load into Simulator <HiArrowRight />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix (ORIGINAL vs SIMULATED) */}
      {originalScan && simulatedScan && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Interactive Modifiers */}
          <div className="report-section" style={{ marginBottom: '24px' }}>
            <h3><HiAdjustments style={{ verticalAlign: 'middle', color: 'var(--accent-cyan)' }} /> Controlled Feature Modifiers</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Toggle structural feature switches below to observe real-time inference shifts:
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button
                className={`btn ${toggleHttps ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleApplyFeatureChange(toggleIp, !toggleHttps, toggleKeywords)}
              >
                {toggleHttps ? '🔒 HTTPS Protocol (Active)' : '🔓 Force HTTP Protocol'}
              </button>

              <button
                className={`btn ${toggleIp ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleApplyFeatureChange(!toggleIp, toggleHttps, toggleKeywords)}
              >
                {toggleIp ? '🌐 IP Hostname (Forced)' : '🌐 Standard Domain'}
              </button>

              <button
                className={`btn ${toggleKeywords ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleApplyFeatureChange(toggleIp, toggleHttps, !toggleKeywords)}
              >
                {toggleKeywords ? '🔑 Inject Phishing Keywords' : '🔑 Clean Query Strings'}
              </button>
            </div>
          </div>

          <div className="report-grid">
            {/* ORIGINAL CARD */}
            <div className={`report-header ${originalScan.verdict?.toLowerCase()}`} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className="badge safe" style={{ marginBottom: '8px' }}>ORIGINAL TARGET</div>
              <h2 className={originalScan.verdict?.toLowerCase()}>{originalScan.verdict}</h2>
              <div className="verdict-url" style={{ marginBottom: '12px' }}>{originalScan.url}</div>
              <div style={{ fontSize: '28px', fontWeight: '900', fontFamily: "'JetBrains Mono', monospace" }}>
                Risk Score: <span className={`score-badge ${originalScan.risk_score <= 30 ? 'low' : originalScan.risk_score <= 70 ? 'medium' : 'high'}`}>{originalScan.risk_score}/100</span>
              </div>
            </div>

            {/* SIMULATED CARD */}
            <div className={`report-header ${simulatedScan.verdict?.toLowerCase()}`} style={{ flexDirection: 'column', alignItems: 'flex-start', borderStyle: 'dashed' }}>
              <div className="badge suspicious" style={{ marginBottom: '8px' }}>SIMULATED TARGET</div>
              <h2 className={simulatedScan.verdict?.toLowerCase()}>{simulatedScan.verdict}</h2>
              <div className="verdict-url" style={{ marginBottom: '12px' }}>{simulatedScan.url}</div>
              <div style={{ fontSize: '28px', fontWeight: '900', fontFamily: "'JetBrains Mono', monospace" }}>
                Risk Score: <span className={`score-badge ${simulatedScan.risk_score <= 30 ? 'low' : simulatedScan.risk_score <= 70 ? 'medium' : 'high'}`}>{simulatedScan.risk_score}/100</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
