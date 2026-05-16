import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Don't hard redirect — let the calling code handle auth failures.
      // The AuthContext will properly clear state and navigate via React Router.
    }
    return Promise.reject(error);
  },
);

// ── Search Suggestions ───────────────────────────────────────────
export const getSearchSuggestions = async q => {
  if (!q || q.length < 2) return [];
  const { data } = await api.get('/products/suggestions', { params: { q } });
  return data?.data?.suggestions || [];
};

export default api;
