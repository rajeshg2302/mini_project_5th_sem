import React, { createContext, useContext, useState, useEffect } from 'react';

const DEFAULT_PREFERENCES = {
  theme: 'nexus-dark', // nexus-dark, midnight, carbon, high-contrast
  accent: 'cyan', // cyan, blue, purple, green, amber
  animations: true,
  gridBg: true,
  scanAnimations: true,
  glowEffects: true,
  dataStream: false,
  particleEffects: false,
  density: 'comfortable', // compact, comfortable, spacious
  textSize: 'default', // small, default, large, extra-large
  highContrast: false,
  reduceMotion: false,
  largeText: false,
  focusIndicators: true,
  dashboardMode: 'soc', // soc, analyst, minimal
  enabledWidgets: {
    status: true,
    stats: true,
    activity: true,
    riskDist: true,
    recentScans: true,
    highRiskCases: true,
    threatProfile: true,
    modelOverview: true,
    investigationQueue: true,
  },
  widgetOrder: [
    'status', 'stats', 'activity', 'riskDist',
    'recentScans', 'highRiskCases', 'threatProfile',
    'modelOverview', 'investigationQueue'
  ],
  autoSaveScans: true,
  showFeatureDetails: true,
  showThreatProfile: true,
  showRecommendations: true,
  showEducationPanel: true,
  showSecurityTimeline: true,
  autoOpenInvestigation: false,
  riskDisplayMode: 'score-level', // score-level, level-only, score-only
  riskColorIndicators: true,
  threatFactorDetails: 'expanded', // expanded, collapsed
  modelDisplayMode: 'best', // best, all, selected
  selectedModel: 'random_forest',
  simulationThreshold: 0.50,
  autoSaveHistory: true,
  defaultSort: 'newest',
  defaultFilter: 'ALL',
  confirmDelete: true,
  storeHistory: true,
  storeNotes: true,
  storeCases: true,
  notifyScanCompleted: true,
  notifyHighRisk: true,
  notifyCriticalRisk: true,
  notifyCaseStatusChanged: true,
  notifyReportGenerated: true,
  securityMode: 'STANDARD', // STANDARD, ANALYST, STRICT
  sidebarCollapsed: false,
};

const PreferencesContext = createContext();

const ACCENT_COLORS = {
  cyan: { primary: '#06b6d4', secondary: '#38bdf8', glow: 'rgba(6, 182, 212, 0.35)' },
  blue: { primary: '#3b82f6', secondary: '#60a5fa', glow: 'rgba(59, 130, 246, 0.35)' },
  purple: { primary: '#8b5cf6', secondary: '#a78bfa', glow: 'rgba(139, 92, 246, 0.35)' },
  green: { primary: '#10b981', secondary: '#34d399', glow: 'rgba(16, 185, 129, 0.35)' },
  amber: { primary: '#f59e0b', secondary: '#fbbf24', glow: 'rgba(245, 158, 11, 0.35)' },
};

export function PreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('phishguard_nexus_prefs');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load user preferences from localStorage:', e);
    }
    return DEFAULT_PREFERENCES;
  });

  const [toasts, setToasts] = useState([]);

  // Apply CSS variables and theme classes dynamically to root
  useEffect(() => {
    const root = document.documentElement;

    // Set theme attribute
    root.setAttribute('data-theme', prefs.theme);
    root.setAttribute('data-accent', prefs.accent);
    root.setAttribute('data-density', prefs.density);
    root.setAttribute('data-text-size', prefs.textSize);

    // Apply classes
    root.classList.toggle('reduce-motion', prefs.reduceMotion);
    root.classList.toggle('high-contrast', prefs.highContrast || prefs.theme === 'high-contrast');
    root.classList.toggle('grid-bg', prefs.gridBg);
    root.classList.toggle('glow-effects', prefs.glowEffects);
    root.classList.toggle('focus-indicators', prefs.focusIndicators);

    // Set accent CSS variable values
    const colors = ACCENT_COLORS[prefs.accent] || ACCENT_COLORS.cyan;
    root.style.setProperty('--accent-primary', colors.primary);
    root.style.setProperty('--accent-secondary', colors.secondary);
    root.style.setProperty('--accent-cyan', colors.primary);
    root.style.setProperty('--accent-glow', colors.glow);

    // Save to localStorage
    try {
      localStorage.setItem('phishguard_nexus_prefs', JSON.stringify(prefs));
    } catch (e) {
      console.warn('Failed to save user preferences:', e);
    }
  }, [prefs]);

  const updatePref = (key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const updatePrefs = (partialObj) => {
    setPrefs((prev) => ({ ...prev, ...partialObj }));
  };

  const resetSettings = () => {
    setPrefs(DEFAULT_PREFERENCES);
    addToast('Preferences restored to PhishGuard default settings.', 'info');
  };

  const exportSettings = () => {
    // Exclude any internal functions or non-serializable objects
    const safeExport = {
      phishguard_version: '1.0.0',
      exported_at: new Date().toISOString(),
      preferences: prefs,
    };
    return JSON.stringify(safeExport, null, 2);
  };

  const importSettings = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);

      // Validation check
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid preferences JSON structure.');
      }

      const importedPrefs = parsed.preferences || parsed;

      // Validate known keys
      const sanitized = {};
      Object.keys(DEFAULT_PREFERENCES).forEach((key) => {
        if (key in importedPrefs) {
          sanitized[key] = importedPrefs[key];
        } else {
          sanitized[key] = DEFAULT_PREFERENCES[key];
        }
      });

      setPrefs(sanitized);
      addToast('Preferences imported successfully.', 'success');
      return { success: true };
    } catch (err) {
      console.error('Import settings error:', err);
      addToast(`Import failed: ${err.message}`, 'error');
      return { success: false, error: err.message };
    }
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <PreferencesContext.Provider
      value={{
        prefs,
        updatePref,
        updatePrefs,
        resetSettings,
        exportSettings,
        importSettings,
        toasts,
        addToast,
        removeToast,
        ACCENT_COLORS,
      }}
    >
      {children}

      {/* Non-invasive Toast Notifications Overlay */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '380px',
            width: '100%',
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              onClick={() => removeToast(t.id)}
              className="card-glass"
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)',
                border: `1px solid ${
                  t.type === 'error'
                    ? 'var(--accent-red)'
                    : t.type === 'success'
                    ? 'var(--accent-green)'
                    : 'var(--accent-primary)'
                }`,
                color: 'var(--text-primary)',
                fontSize: '13px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{t.message}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '10px' }}>✕</span>
            </div>
          ))}
        </div>
      )}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
