'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

const TOKEN_KEY = 'picc_admin_token';

export type AdminAuthState = {
  token: string | null;
  email: string;
  password: string;
  loginError: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  handleLogin: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleLogout: () => void;
  setToken: (value: string | null) => void;
};

export function useAdminAuth(): AdminAuthState {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
    }
  }, []);

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
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setEmail('');
      setPassword('');
    } catch (error) {
      setLoginError('Unable to log in right now.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  return {
    token,
    email,
    password,
    loginError,
    setEmail,
    setPassword,
    handleLogin,
    handleLogout,
    setToken,
  };
}
