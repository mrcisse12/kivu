/**
 * Client API KIVU — appels au backend Python (Flask) par défaut.
 * Surchargeable via VITE_API_URL (ex: pour Render en prod).
 */

const API_BASE =
  import.meta.env.VITE_API_URL ||
  // Dev local: Flask :5000 (où vivent les algos économiques EOQ/WMA/SS)
  'http://localhost:5000/api/v1';

function headers() {
  const token = localStorage.getItem('kivu.token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function handle(res) {
  let body = null;
  try { body = await res.json(); } catch { /* no JSON */ }
  if (!res.ok) {
    const msg = body?.error || body?.message || `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, body);
  }
  return body;
}

export const api = {
  baseUrl: API_BASE,

  async get(path) {
    const res = await fetch(`${API_BASE}${path}`, { headers: headers() });
    return handle(res);
  },

  async post(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body)
    });
    return handle(res);
  },

  async translate(text, from, to) {
    return this.post('/translation/translate', {
      text, sourceLanguage: from, targetLanguage: to
    });
  },

  async listLanguages() {
    return this.get('/languages');
  },

  async listQuests(languageId) {
    return this.get(`/learning/quests${languageId ? `?language=${languageId}` : ''}`);
  },

  // Algorithmes économiques (Backend Python /api/v1/economics/*)
  async eoq(annualDemand, orderingCost, holdingCost) {
    return this.post('/economics/eoq', { annualDemand, orderingCost, holdingCost });
  },
  async wma(values, weights) {
    return this.post('/economics/wma', { values, weights });
  },
  async safetyStock(dailyDemand, leadTimeDays, serviceLevel = 0.95) {
    return this.post('/economics/safety-stock', {
      dailyDemand, leadTimeDays, serviceLevel
    });
  }
};

export { ApiError };
