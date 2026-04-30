'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
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

  const refreshMe = async () => {
    if (!token) return;

    try {
      const response = await apiFetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;
      const me = await response.json();
      sessionStorage.setItem(USER_KEY, JSON.stringify(me));
      setUser(me);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const storedToken = sessionStorage.getItem(TOKEN_KEY);
    const storedEmail = sessionStorage.getItem(EMAIL_KEY);
    const storedUser = safeParseUser(sessionStorage.getItem(USER_KEY));

    if (storedToken) {
      setToken(storedToken);
      if (storedEmail) setEmail(storedEmail);
      if (storedUser) setUser(storedUser);
      extendSession();
    }
  }, [extendSession]);

  useEffect(() => {
    if (!token) return;
    if (user) return;
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
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
  };

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EMAIL_KEY);
    sessionStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setEmail('');
    setPassword('');
  };

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
    [token, user, email, password, loginError]
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