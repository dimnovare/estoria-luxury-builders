import axios from 'axios';
import i18n from '@/i18n';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const lang = i18n.language || 'et';
  config.params = {
    ...config.params,
    lang,
  };
  return config;
});

export default api;
