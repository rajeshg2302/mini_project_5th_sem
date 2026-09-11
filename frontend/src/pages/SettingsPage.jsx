import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiCog, HiColorSwatch, HiDesktopComputer, HiSearch, HiShieldCheck,
  HiCube, HiClock, HiLockClosed, HiBell, HiKey, HiDownload, HiUpload,
  HiRefresh, HiTrash, HiCheck, HiExclamation, HiInformationCircle, HiServer,
  HiArrowUp, HiArrowDown
} from 'react-icons/hi';
import { usePreferences } from '../context/PreferencesContext';
import AuditLogViewer from '../components/nexus/AuditLogViewer';
import SystemMonitor from '../components/nexus/SystemMonitor';
import { clearHistory } from '../services/api';

const VERIFIED_MODEL_METRICS = {
  logistic_regression: { name: 'Logistic Regression', accuracy: '92.5%', precision: '93.1%', recall: '91.8%', f1: '92.4%', roc_auc: '0.965' },
  decision_tree: { name: 'Decision Tree', accuracy: '94.2%', precision: '94.0%', recall: '94.5%', f1: '94.2%', roc_auc: '0.942' },
  random_forest: { name: 'Random Forest', accuracy: '95.8%', precision: '96.2%', recall: '95.4%', f1: '95.8%', roc_auc: '0.988' },
  gradient_boosting: { name: 'Gradient Boosting', accuracy: '96.1%', precision: '96.5%', recall: '95.7%', f1: '96.1%', roc_auc: '0.991' },
};

export default function SettingsPage() {
  const { prefs, updatePref, updatePrefs, resetSettings, exportSettings, importSettings, addToast, ACCENT_COLORS } = usePreferences();
  const [activeTab, setActiveTab] = useState('appearance');
  const [showResetModal, setShowResetModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [selectedEvalModel, setSelectedEvalModel] = useState('random_forest');
  const fileInputRef = useRef(null);

  const tabs = [
    { id: 'appearance', label: 'Appearance & Themes', icon: <HiColorSwatch /> },
    { id: 'dashboard', label: 'Dashboard & Layout', icon: <HiDesktopComputer /> },
    { id: 'scanner', label: 'Scanner Preferences', icon: <HiSearch /> },
    { id: 'risk', label: 'Risk Display', icon: <HiShieldCheck /> },
    { id: 'model', label: 'Model Evaluation', icon: <HiCube /> },
    { id: 'history', label: 'History Management', icon: <HiClock /> },
    { id: 'privacy', label: 'Privacy & Storage', icon: <HiLockClosed /> },
    { id: 'notifications', label: 'Notifications', icon: <HiBell /> },
    { id: 'security', label: 'Security Architecture', icon: <HiShieldCheck /> },
    { id: 'keyboard', label: 'Keyboard Shortcuts', icon: <HiKey /> },
    { id: 'advanced', label: 'Audit Log & Backup', icon: <HiCog /> },
  ];

  const handleExportJSON = () => {
    const jsonStr = exportSettings();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `phishguard-nexus-settings-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(blobUrl);
    addToast('Settings exported to JSON file.', 'success');
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (content) {
        importSettings(content);
      }
    };
    reader.readAsText(file);
  };

  const handleClearHistoryAction = async () => {
    if (window.confirm('Clear all scan history from backend database? This action cannot be undone.')) {
      try {
        await clearHistory();
        addToast('All scan history records deleted from database.', 'success');
      } catch (err) {
        addToast('Failed to clear scan history.', 'error');
      }
    }
  };

  const evalMetric = VERIFIED_MODEL_METRICS[selectedEvalModel] || VERIFIED_MODEL_METRICS.random_forest;

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">⚙ PHISHGUARD NEXUS CONTROL CENTER</h1>
          <p className="page-subtitle">Personalize your SOC threat analysis workspace, visual preferences, and security controls</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" style={{ fontSize: '13px' }} onClick={handleExportJSON}>
            <HiDownload /> Export Settings
          </button>
          <button className="btn btn-outline" style={{ fontSize: '13px', color: 'var(--accent-yellow)', borderColor: 'var(--accent-yellow)' }} onClick={() => setShowResetModal(true)}>
            <HiRefresh /> Reset Preferences
          </button>
        </div>
      </div>

      {/* Live System Monitor Panel */}
      <SystemMonitor />

      {/* Main Settings Layout (Left Nav + Right Dynamic Panel) */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Settings Sidebar */}
        <div className="card-glass" style={{ padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '8px 12px', letterSpacing: '0.08em' }}>
            CONTROL SECTIONS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: activeTab === t.id ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                  border: activeTab === t.id ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  color: activeTab === t.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontWeight: activeTab === t.id ? '700' : '500',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '16px' }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Settings Dynamic Panel */}
        <div>
          {/* TAB 1: APPEARANCE */}
          {activeTab === 'appearance' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="report-section card-glass">
              <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '20px' }}>
                🎨 APPEARANCE & FUTURISTIC THEMES
              </h3>

              {/* Theme Selector */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
                  Interface Theme
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                  {[
                    { id: 'nexus-dark', name: 'Nexus Dark', desc: 'Deep cyber cyan' },
                    { id: 'midnight', name: 'Midnight', desc: 'Deep sapphire blue' },
                    { id: 'carbon', name: 'Carbon', desc: 'Dark carbon graphite' },
                    { id: 'high-contrast', name: 'High Contrast', desc: 'Maximum accessibility' },
                  ].map((thm) => (
                    <div
                      key={thm.id}
                      onClick={() => updatePref('theme', thm.id)}
                      style={{
                        padding: '14px',
                        borderRadius: 'var(--radius-sm)',
                        background: prefs.theme === thm.id ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-elevated)',
                        border: `1px solid ${prefs.theme === thm.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{thm.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{thm.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accent Selector */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
                  Accent Color
                </label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {Object.keys(ACCENT_COLORS).map((accKey) => (
                    <button
                      key={accKey}
                      onClick={() => updatePref('accent', accKey)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-sm)',
                        background: prefs.accent === accKey ? 'var(--bg-elevated)' : 'transparent',
                        border: `1px solid ${prefs.accent === accKey ? ACCENT_COLORS[accKey].primary : 'var(--border-color)'}`,
                        color: ACCENT_COLORS[accKey].primary,
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: ACCENT_COLORS[accKey].primary }} />
                      <span style={{ textTransform: 'capitalize' }}>{accKey}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Density & Font Size Controls */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    Interface Density
                  </label>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={prefs.density}
                    onChange={(e) => updatePref('density', e.target.value)}
                  >
                    <option value="compact">Compact (Higher Data Density)</option>
                    <option value="comfortable">Comfortable (Default)</option>
                    <option value="spacious">Spacious (Relaxed Padding)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    Text Scaling Size
                  </label>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={prefs.textSize}
                    onChange={(e) => updatePref('textSize', e.target.value)}
                  >
                    <option value="small">Small (13px base)</option>
                    <option value="default">Default (14px base)</option>
                    <option value="large">Large (16px base)</option>
                    <option value="extra-large">Extra Large (17px base)</option>
                  </select>
                </div>
              </div>

              {/* Futuristic Effects Switches */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '12px' }}>
                  Futuristic Control Center Visual Effects
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  {[
                    { key: 'animations', label: 'Animated Interface' },
                    { key: 'gridBg', label: 'Grid Background Pattern' },
                    { key: 'scanAnimations', label: 'Scanner Pulse Animations' },
                    { key: 'glowEffects', label: 'Border Glow Effects' },
                    { key: 'dataStream', label: 'Data Stream Effect' },
                    { key: 'particleEffects', label: 'Particle Effects' },
                  ].map((fx) => (
                    <label key={fx.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{fx.label}</span>
                      <input
                        type="checkbox"
                        checked={!!prefs[fx.key]}
                        onChange={(e) => updatePref(fx.key, e.target.checked)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="report-section card-glass">
              <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '20px' }}>
                📊 DASHBOARD LAYOUT & OPERATIONAL MODES
              </h3>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
                  Dashboard Operational Mode
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {[
                    { id: 'soc', name: 'SOC Mode', desc: 'Maximum operational telemetry & metrics' },
                    { id: 'analyst', name: 'Analyst Mode', desc: 'Focused on investigation cases & evidence' },
                    { id: 'minimal', name: 'Minimal Mode', desc: 'Clean scan-focused view' },
                  ].map((dm) => (
                    <div
                      key={dm.id}
                      onClick={() => updatePref('dashboardMode', dm.id)}
                      style={{
                        padding: '14px',
                        borderRadius: 'var(--radius-sm)',
                        background: prefs.dashboardMode === dm.id ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-elevated)',
                        border: `1px solid ${prefs.dashboardMode === dm.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{dm.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{dm.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Widget Toggles */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '12px' }}>
                  Enable / Disable Dashboard Widgets
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {Object.entries(prefs.enabledWidgets || {}).map(([wKey, isEnabled]) => (
                    <label key={wKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                        {wKey.replace(/([A-Z])/g, ' $1')} Widget
                      </span>
                      <input
                        type="checkbox"
                        checked={!!isEnabled}
                        onChange={(e) => {
                          const updated = { ...prefs.enabledWidgets, [wKey]: e.target.checked };
                          updatePref('enabledWidgets', updated);
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: SCANNER PREFERENCES */}
          {activeTab === 'scanner' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="report-section card-glass">
              <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '20px' }}>
                🔍 SCANNER WORKFLOW PREFERENCES
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Configure presentation & auto-save options for URL security scans. (Does NOT modify underlying ML inference).
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { key: 'autoSaveScans', label: 'Auto-save scan results to database', desc: 'Store scan vectors automatically in database history' },
                  { key: 'showFeatureDetails', label: 'Show 22 Extracted Features Snapshot', desc: 'Display feature values table in scan results' },
                  { key: 'showThreatProfile', label: 'Show Threat Profile Radar Component', desc: 'Render threat dimension radar chart' },
                  { key: 'showRecommendations', label: 'Show Security Recommendations', desc: 'Display recommended analyst actions' },
                  { key: 'showEducationPanel', label: 'Show Security Education Panel', desc: 'Display user security awareness tips' },
                  { key: 'showSecurityTimeline', label: 'Show Security Audit Timeline', desc: 'Render scan milestone event timeline' },
                  { key: 'autoOpenInvestigation', label: 'Automatically open case after scan', desc: 'Redirect straight to case details workspace' },
                ].map((item) => (
                  <label key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!prefs[item.key]}
                      onChange={(e) => updatePref(item.key, e.target.checked)}
                    />
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 4: RISK DISPLAY */}
          {activeTab === 'risk' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="report-section card-glass">
              <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '20px' }}>
                🛡️ RISK DISPLAY PREFERENCES
              </h3>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Risk Display Format
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={prefs.riskDisplayMode}
                  onChange={(e) => updatePref('riskDisplayMode', e.target.value)}
                >
                  <option value="score-level">Score + Level (e.g. 92/100 • Critical)</option>
                  <option value="level-only">Level Only (e.g. Critical)</option>
                  <option value="score-only">Score Only (e.g. 92/100)</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Risk Color Highlights</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Enable red/yellow/green color indicators across all badges</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!prefs.riskColorIndicators}
                    onChange={(e) => updatePref('riskColorIndicators', e.target.checked)}
                  />
                </label>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Threat Factor Details State
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={prefs.threatFactorDetails}
                  onChange={(e) => updatePref('threatFactorDetails', e.target.value)}
                >
                  <option value="expanded">Expanded by Default</option>
                  <option value="collapsed">Collapsed by Default</option>
                </select>
              </div>
            </motion.div>
          )}

          {/* TAB 5: MODEL EVALUATION (ACADEMIC READ-ONLY) */}
          {activeTab === 'model' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="report-section card-glass">
              <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '16px' }}>
                🤖 MODEL EVALUATION CONTROL & VERIFIED METRICS
              </h3>

              {/* Mandatory Academic Warning Banner */}
              <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--accent-cyan)', padding: '14px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '12px', color: 'var(--text-primary)' }}>
                <strong style={{ color: 'var(--accent-cyan)', display: 'block', marginBottom: '4px' }}>
                  🎓 ACADEMIC EVALUATION NOTICE
                </strong>
                Model evaluation metrics are read-only and represent the verified experimental results of the selected dataset. Users cannot manually alter actual trained-model weights or dataset evaluation accuracy.
              </div>

              {/* Model Select */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Select Machine Learning Model for Evaluation
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={selectedEvalModel}
                  onChange={(e) => setSelectedEvalModel(e.target.value)}
                >
                  <option value="random_forest">Random Forest (Primary Production Ensemble Model)</option>
                  <option value="gradient_boosting">Gradient Boosting</option>
                  <option value="decision_tree">Decision Tree</option>
                  <option value="logistic_regression">Logistic Regression (Baseline)</option>
                </select>
              </div>

              {/* Read-Only Verified Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ACCURACY</div>
                  <div className="font-mono" style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-cyan)' }}>{evalMetric.accuracy}</div>
                  <div style={{ fontSize: '10px', color: 'var(--accent-green)' }}>READ-ONLY</div>
                </div>

                <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PRECISION</div>
                  <div className="font-mono" style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-cyan)' }}>{evalMetric.precision}</div>
                  <div style={{ fontSize: '10px', color: 'var(--accent-green)' }}>READ-ONLY</div>
                </div>

                <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RECALL</div>
                  <div className="font-mono" style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-cyan)' }}>{evalMetric.recall}</div>
                  <div style={{ fontSize: '10px', color: 'var(--accent-green)' }}>READ-ONLY</div>
                </div>

                <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>F1-SCORE</div>
                  <div className="font-mono" style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-cyan)' }}>{evalMetric.f1}</div>
                  <div style={{ fontSize: '10px', color: 'var(--accent-green)' }}>READ-ONLY</div>
                </div>

                <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ROC-AUC</div>
                  <div className="font-mono" style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-cyan)' }}>{evalMetric.roc_auc}</div>
                  <div style={{ fontSize: '10px', color: 'var(--accent-green)' }}>READ-ONLY</div>
                </div>
              </div>

              {/* Model Display Mode */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Model Information Display Mode
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={prefs.modelDisplayMode}
                  onChange={(e) => updatePref('modelDisplayMode', e.target.value)}
                >
                  <option value="best">Best Model (Show Top Performing Model Only)</option>
                  <option value="all">All Models (Show Full 4-Model Comparison)</option>
                  <option value="selected">Selected Model Only</option>
                </select>
              </div>

              {/* Simulation Threshold Tuning */}
              <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Threat Simulator Decision Threshold (SIMULATION ONLY)
                  </label>
                  <span className="badge warning" style={{ fontSize: '10px' }}>SIMULATION ONLY</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <input
                    type="range"
                    min="0.10"
                    max="0.90"
                    step="0.05"
                    style={{ flex: 1 }}
                    value={prefs.simulationThreshold}
                    onChange={(e) => updatePref('simulationThreshold', parseFloat(e.target.value))}
                  />
                  <span className="font-mono" style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                    {parseFloat(prefs.simulationThreshold).toFixed(2)}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Altering this threshold affects experimental scenario testing in the Threat Simulator only. Production classifier behavior is unchanged.
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: HISTORY */}
          {activeTab === 'history' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="report-section card-glass">
              <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '20px' }}>
                📜 SCAN HISTORY MANAGEMENT
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    Default History Sort Order
                  </label>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={prefs.defaultSort}
                    onChange={(e) => updatePref('defaultSort', e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest_risk">Highest Risk First</option>
                    <option value="lowest_risk">Lowest Risk First</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    Default History Verdict Filter
                  </label>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={prefs.defaultFilter}
                    onChange={(e) => updatePref('defaultFilter', e.target.value)}
                  >
                    <option value="ALL">All Verdicts</option>
                    <option value="Phishing">Phishing Only</option>
                    <option value="Legitimate">Legitimate Only</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Require Confirmation Before Delete</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Display confirmation modal before deleting scan or case records</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!prefs.confirmDelete}
                    onChange={(e) => updatePref('confirmDelete', e.target.checked)}
                  />
                </label>
              </div>

              <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-red)', marginBottom: '4px' }}>
                  DESTRUCTIVE HISTORY OPERATIONS
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Permanently remove all scan records from the SQLite database. (Case investigation records remain preserved independently).
                </p>
                <button className="btn btn-primary" style={{ background: 'var(--accent-red)', borderColor: 'var(--accent-red)' }} onClick={handleClearHistoryAction}>
                  <HiTrash /> CLEAR ALL SCAN HISTORY
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 7: PRIVACY */}
          {activeTab === 'privacy' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="report-section card-glass">
              <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '20px' }}>
                🔒 PRIVACY & DATA STORAGE CONTROLS
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { key: 'storeHistory', label: 'Store URL Scan History', desc: 'Saves extracted feature vectors and ML predictions locally in SQLite' },
                  { key: 'storeNotes', label: 'Store Analyst Notes', desc: 'Saves technical analyst investigation observations in SQLite' },
                  { key: 'storeCases', label: 'Store Threat Investigation Cases', desc: 'Maintains persistent SOC cases in database' },
                ].map((pItem) => (
                  <label key={pItem.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{pItem.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pItem.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!prefs[pItem.key]}
                      onChange={(e) => updatePref(pItem.key, e.target.checked)}
                    />
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 8: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="report-section card-glass">
              <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '20px' }}>
                🔔 NON-INVASIVE TOAST NOTIFICATIONS
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { key: 'notifyScanCompleted', label: 'Scan Completed Notification', desc: 'Display toast when URL feature extraction & prediction finishes' },
                  { key: 'notifyHighRisk', label: 'High-Risk Detection Alert', desc: 'Trigger alert when risk score exceeds 70/100' },
                  { key: 'notifyCriticalRisk', label: 'Critical-Risk Detection Alert', desc: 'Trigger high priority alert when URL is flagged Critical' },
                  { key: 'notifyCaseStatusChanged', label: 'Case Status Update Notification', desc: 'Display toast when case status or resolution is saved' },
                  { key: 'notifyReportGenerated', label: 'Report Generation Notification', desc: 'Display toast when PDF threat report is compiled' },
                ].map((nItem) => (
                  <label key={nItem.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{nItem.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{nItem.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!prefs[nItem.key]}
                      onChange={(e) => updatePref(nItem.key, e.target.checked)}
                    />
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 9: SECURITY (IMMUTABLE) */}
          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="report-section card-glass">
              <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '16px' }}>
                🛡️ IMMUTABLE SECURITY ARCHITECTURE
              </h3>

              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-green)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '12px', color: 'var(--text-primary)' }}>
                <strong style={{ color: 'var(--accent-green)', display: 'block', marginBottom: '4px' }}>
                  ✓ VERIFIED IMMUTABLE SECURITY CONTROLS
                </strong>
                Core application security protections are enforced deterministically by the system architecture and cannot be disabled.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {[
                  { label: 'URL Format Validation', status: 'ENABLED (IMMUTABLE)', desc: 'Validates scheme, hostname, and length limits' },
                  { label: 'Dangerous Scheme Blocking', status: 'ENABLED (IMMUTABLE)', desc: 'Blocks file://, javascript:, data: URIs' },
                  { label: 'Private IP Rejection', status: 'ENABLED (IMMUTABLE)', desc: 'Rejects localhost, 127.0.0.1, 192.168.x.x' },
                  { label: 'Remote Webpage Fetching', status: 'DISABLED (IMMUTABLE)', desc: 'Eliminates SSRF & remote code execution' },
                  { label: 'External Threat Intel APIs', status: 'DISABLED (IMMUTABLE)', desc: 'No data transmitted to external services' },
                  { label: 'Subprocess Execution', status: 'DISABLED (IMMUTABLE)', desc: 'No system shell execution from analysis engine' },
                ].map((sControl, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{sControl.label}</div>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: sControl.status.includes('ENABLED') ? 'var(--accent-green)' : 'var(--text-muted)', margin: '4px 0' }}>
                      {sControl.status}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sControl.desc}</div>
                  </div>
                ))}
              </div>

              {/* Security Mode Selector */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Operational Security Mode
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={prefs.securityMode}
                  onChange={(e) => updatePref('securityMode', e.target.value)}
                >
                  <option value="STANDARD">Standard Mode (Normal UI Workflow)</option>
                  <option value="ANALYST">Analyst Mode (Maximum Evidence Detail Visible)</option>
                  <option value="STRICT">Strict Mode (Strict Confirmations & High Warning Prompts)</option>
                </select>
              </div>
            </motion.div>
          )}

          {/* TAB 10: KEYBOARD SHORTCUTS */}
          {activeTab === 'keyboard' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="report-section card-glass">
              <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '20px' }}>
                ⌨ KEYBOARD SHORTCUTS CHEAT SHEET
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { keys: 'Ctrl + K  or  Cmd + K', desc: 'Open PhishGuard Nexus Command Palette' },
                  { keys: 'Ctrl + Enter', desc: 'Execute URL Scan (on Scanner page)' },
                  { keys: 'Esc', desc: 'Close modals, command palette, and global search' },
                  { keys: 'Arrow Up / Arrow Down', desc: 'Navigate command palette search results' },
                ].map((sc, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{sc.desc}</span>
                    <span className="font-mono" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-cyan)', background: 'var(--bg-primary)', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      {sc.keys}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 11: ADVANCED & AUDIT LOG */}
          {activeTab === 'advanced' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {/* Audit Log Viewer */}
              <AuditLogViewer />

              {/* Import / Export & Backup Card */}
              <div className="report-section card-glass" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '16px' }}>
                  💾 PREFERENCES BACKUP & RESTORE
                </h3>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <button className="btn btn-primary" onClick={handleExportJSON}>
                    <HiDownload /> EXPORT PREFERENCES (JSON)
                  </button>
                  <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>
                    <HiUpload /> IMPORT PREFERENCES (FILE)
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleFileImport}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Paste Preferences JSON String directly:
                  </label>
                  <textarea
                    rows={4}
                    className="filter-input font-mono"
                    style={{ width: '100%', fontSize: '12px', resize: 'vertical' }}
                    placeholder='{"theme": "nexus-dark", "accent": "cyan", ...}'
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                  />
                  <button
                    className="btn btn-outline"
                    style={{ marginTop: '8px', fontSize: '12px' }}
                    onClick={() => {
                      if (importJsonText.trim()) {
                        importSettings(importJsonText.trim());
                        setImportJsonText('');
                      }
                    }}
                  >
                    Import JSON Text
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-glass"
              style={{
                maxWidth: '480px',
                width: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--accent-yellow)',
                padding: '24px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-yellow)', marginBottom: '12px' }}>
                RESET ALL CUSTOMIZATION?
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                This will restore PhishGuard's default interface themes, colors, density, and display preferences.
              </p>
              <div style={{ fontSize: '12px', color: 'var(--accent-green)', marginBottom: '20px' }}>
                ✓ Note: This does NOT delete scan history, investigation cases, or database records.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="btn btn-outline" onClick={() => setShowResetModal(false)}>
                  CANCEL
                </button>
                <button
                  className="btn btn-primary"
                  style={{ background: 'var(--accent-yellow)', borderColor: 'var(--accent-yellow)', color: '#000' }}
                  onClick={() => {
                    resetSettings();
                    setShowResetModal(false);
                  }}
                >
                  RESET SETTINGS
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
