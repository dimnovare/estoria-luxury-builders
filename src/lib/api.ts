import axios from 'axios';
import i18n from '@/i18n';

const looksLikeHtmlDocument = (value: unknown) =>
  typeof value === 'string' && /<!doctype html>|<html[\s>]/i.test(value);

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

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('estoria-admin-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use((response) => {
  if (looksLikeHtmlDocument(response.data)) {
    return Promise.reject(new Error('API returned HTML instead of JSON.'));
  }
  return response;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('estoria-admin-token');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
