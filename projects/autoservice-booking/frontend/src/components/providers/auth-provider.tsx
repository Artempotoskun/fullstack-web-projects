'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, refreshAccessToken } from '@/lib/api';
import { User } from '@/lib/types';

type AuthContextValue = {
  user: User | null; loading: boolean;
  login(email: string, password: string): Promise<User>;
  register(input: Record<string, string>): Promise<User>;
  logout(): Promise<void>;
  request<T>(path: string, options?: RequestInit): Promise<T>;
  reloadUser(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback((accessToken: string | null) => {
    setToken(accessToken);
    if (accessToken) sessionStorage.setItem('autoservice_access', accessToken); else sessionStorage.removeItem('autoservice_access');
  }, []);

  const reloadUser = useCallback(async () => {
    let accessToken = token ?? sessionStorage.getItem('autoservice_access');
    try {
      if (!accessToken) { const refreshed = await refreshAccessToken(); accessToken = refreshed.accessToken; persist(accessToken); }
      const profile = await apiRequest<User>('/users/me', { token: accessToken }); setUser(profile);
    } catch { persist(null); setUser(null); }
  }, [persist, token]);

  useEffect(() => { void reloadUser().finally(() => setLoading(false)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const request = useCallback(async <T,>(path: string, options: RequestInit = {}) => {
    let accessToken = token ?? sessionStorage.getItem('autoservice_access') ?? undefined;
    try { return await apiRequest<T>(path, { ...options, token: accessToken }); }
    catch (error) {
      if (!(error instanceof Error) || !('status' in error) || (error as { status: number }).status !== 401) throw error;
      const refreshed = await refreshAccessToken(); accessToken = refreshed.accessToken; persist(accessToken);
      return apiRequest<T>(path, { ...options, token: accessToken });
    }
  }, [persist, token]);

  const value = useMemo<AuthContextValue>(() => ({
    user, loading, request, reloadUser,
    async login(email, password) { const result = await apiRequest<{ user: User; accessToken: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); persist(result.accessToken); setUser(result.user); return result.user; },
    async register(input) { const result = await apiRequest<{ user: User; accessToken: string }>('/auth/register', { method: 'POST', body: JSON.stringify(input) }); persist(result.accessToken); setUser(result.user); return result.user; },
    async logout() { if (token) await apiRequest('/auth/logout', { method: 'POST', token }).catch(() => undefined); persist(null); setUser(null); },
  }), [loading, persist, reloadUser, request, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
