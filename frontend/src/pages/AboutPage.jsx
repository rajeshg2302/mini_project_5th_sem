import { motion } from 'framer-motion';
import { HiShieldCheck, HiChip, HiLightningBolt, HiCode, HiLockClosed, HiDatabase, HiCheckCircle } from 'react-icons/hi';

export default function AboutPage() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '56px', color: 'var(--accent-cyan)', marginBottom: '16px' }}>
          <HiShieldCheck style={{ filter: 'drop-shadow(0 0 20px rgba(6,182,212,0.4))' }} />
        </div>
        <h1 className="page-title" style={{ fontSize: '36px' }}>About PhishGuard</h1>
        <p className="page-subtitle" style={{ maxWidth: '640px', margin: '0 auto' }}>
          AI-Based Phishing Website Detection & Explainable Cyber Threat Analysis platform built for real-time security research.
        </p>
      </div>

      {/* Core Principles */}
      <motion.div
        className="stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '40px' }}
      >
        <div className="stat-card cyan">
          <div style={{ fontSize: '28px', color: 'var(--accent-cyan)', marginBottom: '12px' }}><HiChip /></div>
          <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>22-Feature Engine</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Extracts structural, domain, and lexical URL characteristics purely using string analytics.
          </div>
        </div>

        <div className="stat-card purple">
          <div style={{ fontSize: '28px', color: 'var(--accent-purple)', marginBottom: '12px' }}><HiLightningBolt /></div>
          <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Verified ML Ensemble</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Combines Random Forest, Gradient Boosting, Logistic Regression, and Decision Trees.
          </div>
        </div>

        <div className="stat-card green">
          <div style={{ fontSize: '28px', color: 'var(--accent-green)', marginBottom: '12px' }}><HiLockClosed /></div>
          <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Privacy-First Scan</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Zero third-party network requests made during feature extraction — 100% local URL analysis.
          </div>
        </div>
      </motion.div>

      {/* Architecture Overview */}
      <motion.div
        className="report-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ marginBottom: '32px' }}
      >
        <h3>⚙️ Technical Architecture</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '16px' }}>
          <div className="card-glass">
            <h4 style={{ color: 'var(--accent-cyan)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HiCode /> Frontend Layer
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              React 18 + Vite, Recharts visualization library, Framer Motion animations, and Axios HTTP client connected to REST APIs.
            </p>
          </div>

          <div className="card-glass">
            <h4 style={{ color: 'var(--accent-purple)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HiDatabase /> Backend & Database
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Python FastAPI server, SQLAlchemy ORM, SQLite embedded database for history & persistent report storage.
            </p>
          </div>

          <div className="card-glass">
            <h4 style={{ color: 'var(--accent-green)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HiChip /> Machine Learning Pipeline
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              scikit-learn, joblib serialization, SHAP-inspired explainability matrix generating human-readable risk factors.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Verification Checklist */}
      <div className="report-section">
        <h3>✅ Verified System Capabilities</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          {[
            'Real-time scanning sequence with zero false external API network dependency.',
            'Clamped risk scores (0–100) mapped to Safe, Suspicious, or Phishing threat levels.',
            'SHAP-inspired feature impact rankings for individual predictions.',
            'Exportable JSON security reports with complete technical metadata.',
            'Searchable and filterable scan history powered by SQLite database.'
          ].map((item, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <HiCheckCircle style={{ color: 'var(--accent-green)', fontSize: '18px', flexShrink: 0 }} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
