/**
 * Client API KIVU — appels au backend Node ou Flask
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

function headers() {
  const token = localStorage.getItem('kivu.token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export const api = {
  async get(path) {
    const res = await fetch(`${API_BASE}${path}`, { headers: headers() });
    return res.ok ? res.json() : null;
  },
  async post(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body)
    });
    return res.ok ? res.json() : null;
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
  }
};
