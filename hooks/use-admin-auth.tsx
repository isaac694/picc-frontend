'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useSessionManagement } from './use-session-management';
import type { AdminUser } from '@/lib/admin-pages';

const TOKEN_KEY = 'admin_token';
const EMAIL_KEY = 'admin_email';
const USER_KEY = 'admin_user';

export type AdminAuthState = {
  token: string | null;
  user: AdminUser | null;
  email: string;
  password: string;
  loginError: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  handleLogin: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleLogout: () => void;
  setToken: (value: string | null) => void;
  refreshMe: () => Promise<void>;
};

type AdminAuthContextValue = AdminAuthState;

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const safeParseUser = (value: string | null): AdminUser | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as AdminUser;
  } catch {
    return null;
  }
};

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const { extendSession } = useSessionManagement();

  const clearAdminSession = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EMAIL_KEY);
    sessionStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setEmail('');
    setPassword('');
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) return;

    try {
      const response = await apiFetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        clearAdminSession();
        return;
      }

      const me = await response.json();
      sessionStorage.setItem(USER_KEY, JSON.stringify(me));
      setUser(me);
    } catch {
      // Keep the current session if the validation request cannot reach the API.
    }
  }, [clearAdminSession, token]);

  useEffect(() => {
    const storedToken = sessionStorage.getItem(TOKEN_KEY);
    const storedEmail = sessionStorage.getItem(EMAIL_KEY);
    const storedUser = safeParseUser(sessionStorage.getItem(USER_KEY));

    if (storedToken) {
      // Restore the browser-only admin session after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(storedToken);
      if (storedEmail) setEmail(storedEmail);
      if (storedUser) setUser(storedUser);
      extendSession();
    }
  }, [extendSession]);

  useEffect(() => {
    if (!token) return;
    // Validate cached tokens as soon as the session is restored.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshMe();
  }, [token, refreshMe]);

  const handleLogin = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setLoginError('Invalid email or password.');
        return;
      }

      const data = await response.json();
      sessionStorage.setItem(TOKEN_KEY, data.token);
      sessionStorage.setItem(EMAIL_KEY, email);

      if (data.user) {
        sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
      } else {
        sessionStorage.removeItem(USER_KEY);
        setUser(null);
      }

      setToken(data.token);
      setPassword('');
      extendSession();
    } catch {
      setLoginError('Unable to log in right now.');
    }
  }, [email, extendSession, password]);

  const handleLogout = useCallback(() => {
    clearAdminSession();
  }, [clearAdminSession]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      token,
      user,
      email,
      password,
      loginError,
      setEmail,
      setPassword,
      handleLogin,
      handleLogout,
      setToken,
      refreshMe,
    }),
    [token, user, email, password, loginError, handleLogin, handleLogout, refreshMe]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthState {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within <AdminAuthProvider>.');
  }
  return ctx;
}
