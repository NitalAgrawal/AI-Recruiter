import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || '/api';

// Self-healing: if VITE_API_URL is set but lacks /api suffix, append it
if (baseURL && baseURL.startsWith('http') && !baseURL.endsWith('/api') && !baseURL.endsWith('/api/')) {
  baseURL = baseURL.replace(/\/+$/, '') + '/api';
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamic base URL for media assets and files, stripping the '/api' prefix
export const BACKEND_URL = baseURL.startsWith('http')
  ? baseURL.replace(/\/api\/?$/, '')
  : window.location.origin;

// Add a request interceptor to inject the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
