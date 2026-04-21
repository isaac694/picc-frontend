'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useSessionManagement } from './use-session-management';

const TOKEN_KEY = 'admin_token';
const EMAIL_KEY = 'admin_email';

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

  const { extendSession } = useSessionManagement();

  useEffect(() => {
    const storedToken = sessionStorage.getItem(TOKEN_KEY);
    const storedEmail = sessionStorage.getItem(EMAIL_KEY);

    if (storedToken) {
      setToken(storedToken);
      if (storedEmail) {
        setEmail(storedEmail);
      }
      // Start session management when token is found
      extendSession();
    }
  }, [extendSession]);

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
      setToken(data.token);
      setPassword('');

      // Start session management after successful login
      extendSession();
    } catch (error) {
      setLoginError('Unable to log in right now.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EMAIL_KEY);
    setToken(null);
    setEmail('');
    setPassword('');
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
