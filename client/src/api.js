import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ai-finance-tracker-production-0d48.up.railway.app/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
