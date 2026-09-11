import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiBeaker, HiDatabase, HiCheckCircle, HiExclamation,
  HiDownload, HiRefresh, HiPlay, HiAdjustments, HiShieldCheck
} from 'react-icons/hi';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

import {
  getDatasetsInfo,
  getResearchModelComparison,
  getLeakageCheck,
  getResearchSummary,
  runCrossValidation,
  runThresholdAnalysis,
  getRocCurve,
  getPrCurve,
  runRobustnessTest,
  runStabilityTest,
  getExperiments,
  saveExperiment
} from '../services/api';

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

export default function ResearchLabPage() {
  const [loading, setLoading] = useState(true);
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [leakageCheck, setLeakageCheck] = useState(null);
  const [modelData, setModelData] = useState(null);
  const [rocData, setRocData] = useState(null);
  const [prData, setPrData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [experiments, setExperiments] = useState([]);

  // Cross Validation State
  const [cvModel, setCvModel] = useState('random_forest');
  const [cvMetric, setCvMetric] = useState('f1');
  const [cvResults, setCvResults] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);

  // Threshold State
  const [threshModel, setThreshModel] = useState('random_forest');
  const [threshResults, setThreshResults] = useState(null);
  const [activeThreshold, setActiveThreshold] = useState(0.5);

  // Feature Importance State
  const [featModel, setFeatModel] = useState('random_forest');

  // Robustness State
  const [robustUrl, setRobustUrl] = useState('http://example.com/login');
  const [robustMods, setRobustMods] = useState(['add_subdomain']);
  const [robustResults, setRobustResults] = useState(null);
  const [robustLoading, setRobustLoading] = useState(false);

  // Stability State
  const [stabModel, setStabModel] = useState('random_forest');
  const [stabResults, setStabResults] = useState(null);
  const [stabLoading, setStabLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [dInfo, lCheck, mData, roc, pr, sum, exp] = await Promise.all([
        getDatasetsInfo(),
        getLeakageCheck(),
        getResearchModelComparison(),
        getRocCurve(),
        getPrCurve(),
        getResearchSummary(),
        getExperiments()
      ]);
      setDatasetInfo(dInfo);
      setLeakageCheck(lCheck);
      setModelData(mData);
      setRocData(roc);
      setPrData(pr);
      setSummary(sum);
      setExperiments(exp.experiments || []);
      
      // Load initial interactive tabs
      handleRunCV('random_forest', 'f1');
      handleRunThreshold('random_forest');
    } catch (err) {
      console.error("Failed to load research data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCV = async (model = cvModel, metric = cvMetric) => {
    setCvLoading(true);
    try {
      const res = await runCrossValidation({ model_key: model, metric, n_splits: 5 });
      setCvResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setCvLoading(false);
    }
  };

  const handleRunThreshold = async (model = threshModel) => {
    try {
      const res = await runThresholdAnalysis({ model_key: model });
      setThreshResults(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunRobustness = async () => {
    if (!robustUrl) return;
    setRobustLoading(true);
    try {
      const res = await runRobustnessTest({ url: robustUrl, modifications: robustMods });
      setRobustResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setRobustLoading(false);
    }
  };

  const handleRunStability = async () => {
    setStabLoading(true);
    try {
      const res = await runStabilityTest({ model_key: stabModel, n_runs: 5 });
      setStabResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setStabLoading(false);
    }
  };

  const handleSaveExperiment = async () => {
    try {
      const newExp = await saveExperiment({
        dataset_name: datasetInfo?.active_mode === 'real_world' ? 'Real-World' : 'Synthetic Development',
        model_name: 'All Ensemble',
        split: '80/20 Stratified',
        metrics: modelData?.models || {},
      });
      setExperiments([newExp, ...experiments]);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <span style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Initializing Research Lab...</span>
      </div>
    );
  }

  // --- ROC Curve Formatting ---
  const formatRocData = () => {
    if (!rocData?.curves) return [];
    // We assume all models have the same number of points for this chart
    const rf = rocData.curves.random_forest || { fpr: [], tpr: [] };
    return rf.fpr.map((fpr, i) => {
      const pt = { fpr: fpr };
      Object.keys(rocData.curves).forEach(model => {
        if (!rocData.curves[model].error) {
          pt[model] = rocData.curves[model].tpr[i] || 0;
        }
      });
      return pt;
    });
  };

  // --- PR Curve Formatting ---
  const formatPrData = () => {
    if (!prData?.curves) return [];
    const rf = prData.curves.random_forest || { recall: [], precision: [] };
    return rf.recall.map((rec, i) => {
      const pt = { recall: rec };
      Object.keys(prData.curves).forEach(model => {
        if (!prData.curves[model].error) {
          pt[model] = prData.curves[model].precision[i] || 0;
        }
      });
      return pt;
    });
  };

  // --- Feature Importance Formatting ---
  const formatFeatureImportances = () => {
    if (!modelData?.feature_importances) return [];
    const imp = modelData.feature_importances[featModel] || {};
    return Object.entries(imp)
      .slice(0, 15)
      .map(([name, val]) => ({
        name: name.replace(/_/g, ' '),
        value: featModel === 'logistic_regression' ? val : val * 100
      }));
  };

  return (
    <div className="research-lab-page">
      <div className="page-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '30px' }}>
        <div>
          <h1 className="page-title"><HiBeaker style={{ marginRight: '10px' }} />MODEL RESEARCH LAB</h1>
          <p className="page-subtitle">Academic validation, reproducible experiments, and model robustness testing.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={handleSaveExperiment}>
            <HiDownload /> Snapshot Experiment
          </button>
          <button className="btn btn-primary" onClick={loadInitialData}>
            <HiRefresh /> Refresh Lab
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div className="card stat-card" style={{ padding: '20px' }}>
          <div className="stat-label">Dataset Health</div>
          <div className="stat-value" style={{ color: leakageCheck?.leakage_risk === 'LOW' ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>
            {leakageCheck?.leakage_risk === 'LOW' ? '98%' : 'WARN'}
          </div>
        </div>
        <div className="card stat-card" style={{ padding: '20px' }}>
          <div className="stat-label">Verified Models</div>
          <div className="stat-value">4</div>
        </div>
        <div className="card stat-card" style={{ padding: '20px' }}>
          <div className="stat-label">Validation Status</div>
          <div className="stat-value">5-FOLD CV</div>
        </div>
        <div className="card stat-card" style={{ padding: '20px' }}>
          <div className="stat-label">Real-World Eval</div>
          <div className="stat-value" style={{ fontSize: '1.2rem', marginTop: '10px' }}>
            {datasetInfo?.real_world?.evaluation_status === 'EVALUATED' ? 'PERFORMED' : 'NOT YET PERFORMED'}
          </div>
        </div>
      </div>

      {/* Dataset & Leakage Panel */}
      <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiDatabase className="icon-primary" /> Dataset Evaluation Center
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="metric-row"><span className="text-muted">Active Dataset</span> <span>{datasetInfo?.active_mode?.toUpperCase()}</span></div>
            <div className="metric-row"><span className="text-muted">Total Samples</span> <span>{datasetInfo?.synthetic?.total_samples || 0}</span></div>
            <div className="metric-row"><span className="text-muted">Legitimate</span> <span>{datasetInfo?.synthetic?.legitimate_samples || 0}</span></div>
            <div className="metric-row"><span className="text-muted">Phishing</span> <span>{datasetInfo?.synthetic?.phishing_samples || 0}</span></div>
            <div className="metric-row"><span className="text-muted">Class Balance</span> <span>{datasetInfo?.synthetic?.class_balance || 0}</span></div>
            <div className="metric-row"><span className="text-muted">Features</span> <span>{datasetInfo?.synthetic?.feature_count || 0}</span></div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiShieldCheck className="icon-primary" /> Dataset Integrity Audit
          </h3>
          {leakageCheck?.leakage_risk !== 'LOW' && (
            <div className="alert-box alert-warning" style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
              <HiExclamation style={{ fontSize: '24px' }} />
              <div>
                <strong>RESEARCH WARNING</strong>
                <p>Potential data leakage detected. Evaluation results may be unreliable.</p>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {leakageCheck?.checks && Object.entries(leakageCheck.checks).map(([key, data]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <span style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                <span style={{ color: data.passed ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {data.passed ? <HiCheckCircle /> : <HiExclamation />} {data.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Model Performance Matrix */}
      <div className="card" style={{ padding: '24px', marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '20px' }}>Model Comparison Matrix</h3>
        <div className="table-responsive">
          <table className="nexus-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Model</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1 Score</th>
                <th>ROC-AUC</th>
              </tr>
            </thead>
            <tbody>
              {modelData?.models && Object.entries(modelData.models).map(([name, metrics]) => (
                <tr key={name}>
                  <td><strong>{MODEL_LABELS[name] || name}</strong></td>
                  <td>{metrics.accuracy.toFixed(4)}</td>
                  <td>{metrics.precision.toFixed(4)}</td>
                  <td>{metrics.recall.toFixed(4)}</td>
                  <td style={{ color: 'var(--accent-cyan)' }}>{metrics.f1_score.toFixed(4)}</td>
                  <td>{metrics.auc_roc.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px' }}>ROC Curve</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formatRocData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="fpr" type="number" domain={[0, 1]} stroke="var(--text-muted)" tickFormatter={v => v.toFixed(1)} />
              <YAxis domain={[0, 1]} stroke="var(--text-muted)" tickFormatter={v => v.toFixed(1)} />
              <RechartsTooltip contentStyle={{ background: 'var(--bg-card)' }} />
              <Legend />
              {Object.keys(rocData?.curves || {}).map(model => (
                rocData.curves[model].auc && (
                  <Line key={model} type="monotone" dataKey={model} name={`${MODEL_LABELS[model]} (AUC: ${rocData.curves[model].auc})`} stroke={MODEL_COLORS[model]} dot={false} strokeWidth={2} />
                )
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px' }}>Precision-Recall Curve</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formatPrData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="recall" type="number" domain={[0, 1]} stroke="var(--text-muted)" tickFormatter={v => v.toFixed(1)} />
              <YAxis domain={[0, 1]} stroke="var(--text-muted)" tickFormatter={v => v.toFixed(1)} />
              <RechartsTooltip contentStyle={{ background: 'var(--bg-card)' }} />
              <Legend />
              {Object.keys(prData?.curves || {}).map(model => (
                prData.curves[model].average_precision && (
                  <Line key={model} type="monotone" dataKey={model} name={`${MODEL_LABELS[model]}`} stroke={MODEL_COLORS[model]} dot={false} strokeWidth={2} />
                )
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CV & Threshold Row */}
      <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        
        {/* Cross Validation */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
            5-Fold Cross Validation
            <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => handleRunCV()}>Run</button>
          </h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <select className="nexus-input" value={cvModel} onChange={e => { setCvModel(e.target.value); handleRunCV(e.target.value, cvMetric); }}>
              <option value="logistic_regression">Logistic Regression</option>
              <option value="decision_tree">Decision Tree</option>
              <option value="random_forest">Random Forest</option>
              <option value="gradient_boosting">Gradient Boosting</option>
            </select>
            <select className="nexus-input" value={cvMetric} onChange={e => { setCvMetric(e.target.value); handleRunCV(cvModel, e.target.value); }}>
              <option value="f1">F1 Score</option>
              <option value="accuracy">Accuracy</option>
              <option value="precision">Precision</option>
              <option value="recall">Recall</option>
            </select>
          </div>
          {cvLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" /></div>
          ) : cvResults?.fold_scores ? (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {cvResults.fold_scores.map((score, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '60px', color: 'var(--text-muted)' }}>Fold {i+1}</span>
                    <div style={{ flex: 1, height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${score * 100}%`, height: '100%', background: 'var(--accent-cyan)' }} />
                    </div>
                    <span style={{ width: '50px', textAlign: 'right' }}>{score.toFixed(3)}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>MEAN ± STD DEV</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                  {cvResults.mean.toFixed(4)} ± {cvResults.std.toFixed(4)}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Threshold Simulator */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Threshold Analysis</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <select className="nexus-input" value={threshModel} onChange={e => { setThreshModel(e.target.value); handleRunThreshold(e.target.value); }}>
              <option value="logistic_regression">Logistic Regression</option>
              <option value="decision_tree">Decision Tree</option>
              <option value="random_forest">Random Forest</option>
              <option value="gradient_boosting">Gradient Boosting</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Prediction Threshold</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{activeThreshold.toFixed(2)}</span>
            </div>
            <input 
              type="range" 
              min="0.05" max="0.95" step="0.05" 
              value={activeThreshold} 
              onChange={e => setActiveThreshold(parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {threshResults?.points && (() => {
            const pt = threshResults.points.find(p => Math.abs(p.threshold - activeThreshold) < 0.01) || threshResults.points[9];
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="metric-row"><span>Precision</span> <span style={{ color: 'var(--accent-cyan)' }}>{pt.precision.toFixed(4)}</span></div>
                  <div className="metric-row"><span>Recall</span> <span style={{ color: 'var(--accent-cyan)' }}>{pt.recall.toFixed(4)}</span></div>
                  <div className="metric-row"><span>F1 Score</span> <span style={{ color: 'var(--accent-green)' }}>{pt.f1_score.toFixed(4)}</span></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                  <div className="metric-row"><span>False Positives</span> <span style={{ color: 'var(--accent-yellow)' }}>{pt.false_positives}</span></div>
                  <div className="metric-row"><span>False Negatives</span> <span style={{ color: 'var(--accent-red)' }}>{pt.false_negatives}</span></div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Feature Importance & Robustness Row */}
      <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        
        {/* Feature Importance */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Feature Importance Lab</h3>
          <select className="nexus-input" value={featModel} onChange={e => setFeatModel(e.target.value)} style={{ marginBottom: '20px' }}>
            <option value="random_forest">Random Forest (Gini Importance)</option>
            <option value="gradient_boosting">Gradient Boosting (Importance)</option>
            <option value="logistic_regression">Logistic Regression (Absolute Coefficients)</option>
          </select>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formatFeatureImportances()} layout="vertical" margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis type="number" stroke="var(--text-muted)" />
              <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} width={110} />
              <RechartsTooltip contentStyle={{ background: 'var(--bg-card)' }} />
              <Bar dataKey="value" fill={MODEL_COLORS[featModel] || 'var(--accent-cyan)'} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Robustness Testing */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
            Robustness Lab (Offline)
            <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={handleRunRobustness} disabled={robustLoading}>
              {robustLoading ? 'Running...' : 'Run Test'}
            </button>
          </h3>
          <input 
            type="text" className="nexus-input" 
            value={robustUrl} onChange={e => setRobustUrl(e.target.value)}
            style={{ width: '100%', marginBottom: '16px' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            {['add_subdomain', 'add_keyword', 'use_http', 'add_shortener', 'increase_length', 'suspicious_tld'].map(mod => (
              <label key={mod} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <input 
                  type="checkbox" 
                  checked={robustMods.includes(mod)}
                  onChange={e => {
                    if (e.target.checked) setRobustMods([...robustMods, mod]);
                    else setRobustMods(robustMods.filter(m => m !== mod));
                  }}
                />
                {mod.replace(/_/g, ' ')}
              </label>
            ))}
          </div>

          {robustResults && (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
              <div style={{ flex: 1, padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>ORIGINAL</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: robustResults.original.verdict === 'Safe' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {robustResults.original.verdict}
                </div>
                <div style={{ fontSize: '12px' }}>Risk: {robustResults.original.risk_score}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>→</div>
              <div style={{ flex: 1, padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: robustResults.verdict_changed ? '1px solid var(--accent-yellow)' : 'none' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>MODIFIED</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: robustResults.modified.verdict === 'Safe' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {robustResults.modified.verdict}
                </div>
                <div style={{ fontSize: '12px' }}>Risk: {robustResults.modified.risk_score} <span style={{ color: robustResults.risk_delta > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>({robustResults.risk_delta > 0 ? '+' : ''}{robustResults.risk_delta})</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stability & Experiment History */}
      <div className="card" style={{ padding: '24px', marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HiDatabase className="icon-primary" /> Experiment History
        </h3>
        <div className="table-responsive">
          <table className="nexus-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Experiment ID</th>
                <th>Dataset</th>
                <th>Model</th>
                <th>Split</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {experiments.map(exp => (
                <tr key={exp.experiment_id}>
                  <td style={{ color: 'var(--accent-cyan)' }}>{exp.experiment_id}</td>
                  <td>{exp.dataset_name}</td>
                  <td>{exp.model_name}</td>
                  <td>{exp.split}</td>
                  <td>{new Date(exp.timestamp).toLocaleString()}</td>
                </tr>
              ))}
              {experiments.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    No experiments saved yet. Click "Snapshot Experiment" to record the current state.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Research Conclusions */}
      <div className="card" style={{ padding: '24px', background: 'var(--bg-secondary)' }}>
        <h3 style={{ marginBottom: '20px' }}>EXPERIMENT SUMMARY & CONCLUSIONS</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div>
            <div className="metric-row"><span className="text-muted">Dataset Analyzed</span> <span>{summary?.dataset} ({summary?.total_samples} samples)</span></div>
            <div className="metric-row"><span className="text-muted">Best F1 Score Model</span> <span style={{ color: 'var(--accent-cyan)' }}>{MODEL_LABELS[summary?.best_f1_model?.name]} ({summary?.best_f1_model?.score})</span></div>
            <div className="metric-row"><span className="text-muted">Best Recall Model</span> <span>{MODEL_LABELS[summary?.best_recall_model?.name]}</span></div>
            <div className="metric-row"><span className="text-muted">Most Stable Model (CV)</span> <span>{MODEL_LABELS[summary?.most_stable_model] || 'N/A'}</span></div>
            <div className="metric-row"><span className="text-muted">Real-World Generalization</span> <span style={{ color: summary?.real_world_evaluation === 'PERFORMED' ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{summary?.real_world_evaluation}</span></div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold' }}>RESEARCH LIMITATIONS</div>
            <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
              {summary?.research_limitations?.map((lim, i) => <li key={i}>{lim}</li>)}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
