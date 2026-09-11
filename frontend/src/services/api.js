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

export default api;

