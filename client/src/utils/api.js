import axios from 'axios';

const isMobile = window.location.protocol === 'capacitor:';
const API = axios.create({
  baseURL: isMobile ? 'https://kirana-profit-manager.onrender.com/api' : '/api',
  headers: { 'Content-Type': 'application/json' }
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('kirana_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kirana_token');
      localStorage.removeItem('kirana_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
