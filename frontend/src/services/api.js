import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const SERVER_BASE = API_BASE.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Health / Status API ────────────────────────────────
export const getHealth = async () => {
  try {
    const response = await axios.get(`${SERVER_BASE}/health`, { timeout: 5000 });
    return response.data;
  } catch (err) {
    return { status: 'offline', models_loaded: false };
  }
};

export const getStatus = async () => {
  const response = await api.get('/status');
  return response.data;
};

// ─── Scanner API ────────────────────────────────────────
export const scanURL = async (url) => {
  const response = await api.post('/scan', { url });
  return response.data;
};

// ─── History API ────────────────────────────────────────
export const getHistory = async (params = {}) => {
  const response = await api.get('/history', { params });
  return response.data;
};

export const getReport = async (scanId) => {
  const response = await api.get(`/report/${scanId}`);
  return response.data;
};

export const deleteScan = async (scanId) => {
  const response = await api.delete(`/history/${scanId}`);
  return response.data;
};

export const clearHistory = async () => {
  const response = await api.delete('/history');
  return response.data;
};

// ─── Analytics API ──────────────────────────────────────
export const getAnalytics = async () => {
  const response = await api.get('/analytics');
  return response.data;
};

// ─── Models API ─────────────────────────────────────────
export const getModelComparison = async () => {
  const response = await api.get('/models/compare');
  return response.data;
};

export const getFeatureImportance = async () => {
  const response = await api.get('/models/feature-importance');
  return response.data;
};

// ─── Threat Cases API ───────────────────────────────────
export const getCases = async (params = {}) => {
  const response = await api.get('/cases', { params });
  return response.data;
};

export const getCase = async (caseId) => {
  const response = await api.get(`/cases/${caseId}`);
  return response.data;
};

export const createCase = async (caseData) => {
  const response = await api.post('/cases', caseData);
  return response.data;
};

export const updateCase = async (caseId, updateData) => {
  const response = await api.put(`/cases/${caseId}`, updateData);
  return response.data;
};

export const deleteCase = async (caseId) => {
  const response = await api.delete(`/cases/${caseId}`);
  return response.data;
};

export const reopenCase = async (caseId) => {
  const response = await api.post(`/cases/${caseId}/reopen`);
  return response.data;
};

export const getCaseStats = async () => {
  const response = await api.get('/cases/stats');
  return response.data;
};

export const getCaseReport = async (caseId, format = 'pdf') => {
  if (format === 'json') {
    const response = await api.get(`/cases/${caseId}/report`, { params: { format: 'json' } });
    return response.data;
  }
  const response = await api.get(`/cases/${caseId}/report`, {
    params: { format: 'pdf' },
    responseType: 'blob',
  });
  return response.data;
};

// ─── Security Audit Logs API ────────────────────────────
export const getAuditLogs = async (params = {}) => {
  const response = await api.get('/audit-logs', { params });
  return response.data;
};

export const createAuditLog = async (logData) => {
  const response = await api.post('/audit-logs', logData);
  return response.data;
};

// ─── Research Lab API ───────────────────────────────────
export const getDatasetsInfo = async () => {
  const response = await api.get('/research/datasets');
  return response.data;
};

export const getResearchModelComparison = async () => {
  const response = await api.get('/research/model-comparison');
  return response.data;
};

export const getResearchFeatureImportance = async () => {
  const response = await api.get('/research/feature-importance');
  return response.data;
};

export const runCrossValidation = async (payload) => {
  const response = await api.post('/research/cross-validation', payload);
  return response.data;
};

export const runThresholdAnalysis = async (payload) => {
  const response = await api.post('/research/threshold-analysis', payload);
  return response.data;
};

export const getRocCurve = async () => {
  const response = await api.get('/research/roc-curve');
  return response.data;
};

export const getPrCurve = async () => {
  const response = await api.get('/research/pr-curve');
  return response.data;
};

export const runRobustnessTest = async (payload) => {
  const response = await api.post('/research/robustness', payload);
  return response.data;
};

export const runStabilityTest = async (payload) => {
  const response = await api.post('/research/stability', payload);
  return response.data;
};

export const getLeakageCheck = async () => {
  const response = await api.get('/research/leakage-check');
  return response.data;
};

export const getResearchSummary = async () => {
  const response = await api.get('/research/research-summary');
  return response.data;
};

export const getExperiments = async (params = {}) => {
  const response = await api.get('/research/experiments', { params });
  return response.data;
};

export const getExperiment = async (id) => {
  const response = await api.get(`/research/experiments/${id}`);
  return response.data;
};

export const saveExperiment = async (payload) => {
  const response = await api.post('/research/experiments', payload);
  return response.data;
};

export default api;

