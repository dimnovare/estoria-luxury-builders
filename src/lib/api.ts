import axios from 'axios';
import i18n from '@/i18n';

const looksLikeHtmlDocument = (value: unknown) =>
  typeof value === 'string' && /<!doctype html>|<html[\s>]/i.test(value);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

/**
 * Auto-pass the user's UI language to GET requests so public-site
 * fetches return the right translations. Restricted to GET-with-no-
 * explicit-lang because:
 *   1. Admin POST/PUT/DELETE either don't care about language OR
 *      send their own enum-friendly lang param (Et/En/Ru). Overwriting
 *      it breaks every admin write.
 *   2. navigator.language returns BCP-47 (en-US, en-GB) which the
 *      backend can't bind to the C# Language enum without normalization.
 */
api.interceptors.request.use((config) => {
  const method = (config.method ?? 'get').toLowerCase();
  if (method !== 'get') return config;

  // Don't clobber an explicit lang the caller already supplied
  const existing = (config.params as Record<string, unknown> | undefined)?.lang;
  if (existing !== undefined) return config;

  // Normalize BCP-47 (en-US) to ISO 639-1 (en) — backend expects 2-letter
  const raw = i18n.language || 'et';
  const lang = raw.split('-')[0].toLowerCase();

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
