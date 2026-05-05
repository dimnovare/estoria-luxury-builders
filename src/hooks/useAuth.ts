import { useState } from 'react';
import api from '@/lib/api';

const TOKEN_KEY = 'estoria-admin-token';
const EMAIL_KEY = 'estoria-admin-email';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem(TOKEN_KEY)
  );
  const [email, setEmail] = useState<string | null>(
    localStorage.getItem(EMAIL_KEY)
  );

  const login = async (emailVal: string, password: string) => {
    const { data } = await api.post('/auth/login', { email: emailVal, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(EMAIL_KEY, data.email);
    setIsAuthenticated(true);
    setEmail(data.email);
    return data;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setIsAuthenticated(false);
    setEmail(null);
  };

  return { isAuthenticated, email, login, logout };
}
