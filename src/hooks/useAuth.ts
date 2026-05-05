import { useState } from 'react';
import api from '@/lib/api';

const TOKEN_KEY = 'estoria-admin-token';
const USER_KEY  = 'estoria-admin-user';

export type UserRole = 'Admin' | 'Agent' | 'Editor' | 'Marketing';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  photoUrl?: string;
  languages?: string[];
}

interface LoginResponse {
  token: string;
  user: AuthUser;
  expiresAt: string;
}

const readUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(readUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem(TOKEN_KEY) && !!user
  );

  const login = async (emailVal: string, password: string) => {
    const { data } = await api.post<LoginResponse>('/auth/login', { email: emailVal, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY,  JSON.stringify(data.user));
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasRole = (role: UserRole) => !!user?.roles.includes(role);
  const hasAnyRole = (...roles: UserRole[]) => !!user?.roles.some((r) => roles.includes(r));

  return {
    isAuthenticated,
    user,
    email: user?.email ?? null,
    roles: user?.roles ?? [],
    login,
    logout,
    hasRole,
    hasAnyRole,
  };
}
