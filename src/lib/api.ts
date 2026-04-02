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

api.interceptors.response.use((response) => {
  if (looksLikeHtmlDocument(response.data)) {
    return Promise.reject(new Error('API returned HTML instead of JSON.'));
  }

  return response;
});

export default api;
