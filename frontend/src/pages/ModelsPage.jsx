import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { HiInformationCircle, HiRefresh, HiCheckCircle } from 'react-icons/hi';
import { getModelComparison } from '../services/api';

const MODEL_COLORS = {
  logistic_regression: '#f59e0b',
  decision_tree:       '#10b981',
  random_forest:       '#06b6d4',
  gradient_boosting:   '#8b5cf6',
};

const MODEL_LABELS = {
  logistic_regression: 'Logistic Regression',
  decision_tree:       'Decision Tree',
  random_forest:       'Random Forest',
  gradient_boosting:   'Gradient Boosting',
};

export default function ModelsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getModelComparison();
      setData(result);
    } catch (err) {
      console.error('Failed to load model comparison:', err);
      setError('Failed to fetch model evaluation metrics from backend server.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <span style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading AI model benchmarks...</span>
      </div>
    );
  }

  if (error || !data || !data.models) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🤖</div>
        <h3>Model Comparison Unavailable</h3>
        <p>{error || 'No trained model artifacts found on backend server.'}</p>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={loadData}>
          <HiRefresh /> Retry Connection
        </button>
      </div>
    );
  }

  // Radar Chart Metric Formatting
  const metrics = ['accuracy', 'precision', 'recall', 'f1_score', 'auc_roc'];
  const radarData = metrics.map((metric) => {
    const point = { metric: metric.replace('_', ' ').toUpperCase() };
    Object.keys(data.models).forEach((model) => {
      point[model] = data.models[model][metric] || 0;
    });
    return point;
  });

  // Feature Importance Formatting (Top 12 from Random Forest)
  const rfImportances = data.feature_importances?.random_forest || {};
  const featureChartData = Object.entries(rfImportances)
    .slice(0, 12)
    .map(([feature, importance]) => ({
      feature: feature.replace(/_/g, ' '),
      importance: Number((importance * 100).toFixed(1)),
    }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🤖 AI Model Lab</h1>
          <p className="page-subtitle">Comparative evaluation metrics, confusion matrices, and feature importance rankings for Phase 2 verified models</p>
        </div>
        <button className="btn btn-outline" onClick={loadData}>
          <HiRefresh /> Refresh
        </button>
      </div>

      {/* Mandatory Section 16 Disclaimer Banner */}
      <div className="disclaimer-banner info-banner" style={{ marginBottom: '32px' }}>
        <HiInformationCircle className="disclaimer-icon" />
        <div>
          <strong className="disclaimer-title">Synthetic Dataset Evaluation Notice</strong>
          <p className="disclaimer-text">
            These metrics reflect performance on the current synthetic dataset and should not be interpreted as real-world detection accuracy.
          </p>
        </div>
      </div>

      {/* Model Benchmark Cards */}
      <motion.div
        className="model-cards"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '36px' }}
      >
        {Object.entries(data.models).map(([name, metrics]) => (
          <div key={name} className="model-card">
            <h3>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: MODEL_COLORS[name] || 'var(--accent-cyan)',
                display: 'inline-block',
              }} />
              {MODEL_LABELS[name] || name}
            </h3>

            <div className="metric-row">
              <span className="metric-label">Accuracy</span>
              <span className="metric-value" style={{ color: 'var(--accent-green)' }}>
                {(metrics.accuracy * 100).toFixed(1)}%
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Precision</span>
              <span className="metric-value">{(metrics.precision * 100).toFixed(1)}%</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Recall</span>
              <span className="metric-value">{(metrics.recall * 100).toFixed(1)}%</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">F1 Score</span>
              <span className="metric-value">{(metrics.f1_score * 100).toFixed(1)}%</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">AUC-ROC</span>
              <span className="metric-value" style={{ color: 'var(--accent-cyan)' }}>
                {(metrics.auc_roc * 100).toFixed(1)}%
              </span>
            </div>

            {/* Confusion Matrix Display */}
            {metrics.confusion_matrix && (
              <>
                <h4 style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Confusion Matrix
                </h4>
                <div className="confusion-matrix">
                  <div className="cm-header"></div>
                  <div className="cm-header">Pred Legit</div>
                  <div className="cm-header">Pred Phish</div>
                  <div className="cm-header">Actual Legit</div>
                  <div className="cm-cell cm-tn" title="True Negative">{metrics.confusion_matrix[0][0]}</div>
                  <div className="cm-cell cm-fp" title="False Positive">{metrics.confusion_matrix[0][1]}</div>
                  <div className="cm-header">Actual Phish</div>
                  <div className="cm-cell cm-fn" title="False Negative">{metrics.confusion_matrix[1][0]}</div>
                  <div className="cm-cell cm-tp" title="True Positive">{metrics.confusion_matrix[1][1]}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span><span style={{ color: 'var(--accent-cyan)' }}>■</span> TN: True Neg</span>
                  <span><span style={{ color: 'var(--accent-yellow)' }}>■</span> FP: False Pos</span>
                  <span><span style={{ color: 'var(--accent-red)' }}>■</span> FN: False Neg</span>
                  <span><span style={{ color: 'var(--accent-green)' }}>■</span> TP: True Pos</span>
                </div>
              </>
            )}
          </div>
        ))}
      </motion.div>

      {/* Radar Chart */}
      <motion.div
        className="chart-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3>📈 Model Benchmark Radar Overlay</h3>
        <ResponsiveContainer width="100%" height={340}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="var(--border-color)" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 1]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
            {Object.keys(data.models).map((model) => (
              <Radar
                key={model}
                name={MODEL_LABELS[model] || model}
                dataKey={model}
                stroke={MODEL_COLORS[model] || '#06b6d4'}
                fill={MODEL_COLORS[model] || '#06b6d4'}
                fillOpacity={0.12}
                strokeWidth={2}
              />
            ))}
            <Tooltip
              contentStyle={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Feature Importance Bar Chart */}
      <motion.div
        className="chart-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3>🎯 Feature Importance Distribution (Random Forest)</h3>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={featureChartData} layout="vertical" margin={{ left: 130 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis type="number" stroke="var(--text-muted)" fontSize={12} unit="%" />
            <YAxis
              type="category"
              dataKey="feature"
              stroke="var(--text-muted)"
              fontSize={11}
              width={120}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
              formatter={(val) => [`${val}%`, 'Importance Weight']}
            />
            <Bar dataKey="importance" fill="var(--accent-cyan)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
