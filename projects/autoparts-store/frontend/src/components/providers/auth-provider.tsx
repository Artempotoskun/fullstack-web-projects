'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';

type AuthContextValue = {
  user: User | null; token: string | null; loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => Promise<void>;
  authenticatedFetch: <T>(path: string, options?: RequestInit) => Promise<T>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    try {
      const refreshed = await api<{ accessToken: string }>('/auth/refresh', { method: 'POST' });
      const profile = await api<User>('/users/me', {}, refreshed.accessToken);
      setToken(refreshed.accessToken); setUser(profile);
    } catch { setToken(null); setUser(null); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void hydrate(); }, [hydrate]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api<{ user: User; accessToken: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setUser(result.user); setToken(result.accessToken);
  }, []);
  const register = useCallback(async (input: { email: string; password: string; firstName: string; lastName: string }) => {
    const result = await api<{ user: User; accessToken: string }>('/auth/register', { method: 'POST', body: JSON.stringify(input) });
    setUser(result.user); setToken(result.accessToken);
  }, []);
  const logout = useCallback(async () => {
    if (token) await api('/auth/logout', { method: 'POST' }, token).catch(() => undefined);
    setUser(null); setToken(null);
  }, [token]);
  const authenticatedFetch = useCallback(async <T,>(path: string, options: RequestInit = {}) => {
    if (token) return api<T>(path, options, token);
    const refreshed = await api<{ accessToken: string }>('/auth/refresh', { method: 'POST' });
    setToken(refreshed.accessToken);
    return api<T>(path, options, refreshed.accessToken);
  }, [token]);

  const value = useMemo(() => ({ user, token, loading, login, register, logout, authenticatedFetch }), [user, token, loading, login, register, logout, authenticatedFetch]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
