'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, apiFetch } from '@/lib/api';
import { useSessionManagement } from './use-session-management';
import { canAccessRight, getAdminUserAccessRights, type AdminUser } from '@/lib/admin-pages';

const TOKEN_KEY = 'admin_token';
const EMAIL_KEY = 'admin_email';
const USER_KEY = 'admin_user';
const LOGIN_RESPONSE_KEY = 'admin_login_response';
const PUBLIC_TOKEN_KEY = 'token';
const PUBLIC_USER_KEY = 'user';
const ACCESS_RIGHTS_KEY = 'accessRights';
const ACCESS_RIGHTS_UPDATED_EVENT = 'admin-access-rights-updated';
const BACKEND_ACCESS_RIGHTS_UPDATED_EVENT = 'access-rights.updated';

type AdminLoginResponse = {
  token?: string;
  user?: AdminUser | null;
};

type AccessRightsUpdatedEvent = CustomEvent<{
  roleId?: string | null;
  accessRights?: string[];
}>;

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
  updateUser: (partial: Partial<AdminUser>) => void;
  permissions: string[];
  can: (right: string) => boolean;
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

const safeParseLoginResponse = (value: string | null): AdminLoginResponse | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as AdminLoginResponse;
  } catch {
    return null;
  }
};

const storage = () => (typeof window === 'undefined' ? null : window.localStorage);

const persistAdminSession = (data: AdminLoginResponse, email: string) => {
  const store = storage();
  if (!store) return;

  if (data.token) store.setItem(TOKEN_KEY, data.token);
  if (data.token) store.setItem(PUBLIC_TOKEN_KEY, data.token);
  store.setItem(EMAIL_KEY, email);
  if (data.user) {
    store.setItem(USER_KEY, JSON.stringify(data.user));
    store.setItem(PUBLIC_USER_KEY, JSON.stringify(data.user));
    store.setItem(ACCESS_RIGHTS_KEY, JSON.stringify(data.user.accessRights || []));
  }
  store.setItem(LOGIN_RESPONSE_KEY, JSON.stringify(data));
};

const clearStoredAdminSession = () => {
  const store = storage();
  if (!store) return;

  [TOKEN_KEY, EMAIL_KEY, USER_KEY, LOGIN_RESPONSE_KEY, PUBLIC_TOKEN_KEY, PUBLIC_USER_KEY, ACCESS_RIGHTS_KEY].forEach((key) => {
    store.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

const updateStoredUser = (nextUser: AdminUser | null) => {
  const store = storage();
  if (!store) return;

  if (!nextUser) {
    store.removeItem(USER_KEY);
    store.removeItem(PUBLIC_USER_KEY);
    store.removeItem(ACCESS_RIGHTS_KEY);
    const saved = safeParseLoginResponse(store.getItem(LOGIN_RESPONSE_KEY));
    if (saved) {
      store.setItem(LOGIN_RESPONSE_KEY, JSON.stringify({ ...saved, user: null }));
    }
    return;
  }

  store.setItem(USER_KEY, JSON.stringify(nextUser));
  store.setItem(PUBLIC_USER_KEY, JSON.stringify(nextUser));
  store.setItem(ACCESS_RIGHTS_KEY, JSON.stringify(nextUser.accessRights || []));
  const saved = safeParseLoginResponse(store.getItem(LOGIN_RESPONSE_KEY));
  store.setItem(LOGIN_RESPONSE_KEY, JSON.stringify({ ...(saved || {}), user: nextUser }));
};

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const { extendSession } = useSessionManagement();

  const clearAdminSession = useCallback(() => {
    clearStoredAdminSession();
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

      const data = await response.json();
      const me = data?.user ?? data;
      updateStoredUser(me);
      setUser(me);
    } catch {
      // Keep the current session if the validation request cannot reach the API.
    }
  }, [clearAdminSession, token]);

  const updateUser = useCallback((partial: Partial<AdminUser>) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...partial };
      updateStoredUser(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const store = storage();
    if (!store) return;

    const savedLogin = safeParseLoginResponse(store.getItem(LOGIN_RESPONSE_KEY));
    const storedToken =
      store.getItem(PUBLIC_TOKEN_KEY) ||
      store.getItem(TOKEN_KEY) ||
      savedLogin?.token ||
      sessionStorage.getItem(TOKEN_KEY);
    const storedEmail = store.getItem(EMAIL_KEY) || sessionStorage.getItem(EMAIL_KEY);
    const storedUser =
      safeParseUser(store.getItem(PUBLIC_USER_KEY)) ||
      safeParseUser(store.getItem(USER_KEY)) ||
      savedLogin?.user ||
      safeParseUser(sessionStorage.getItem(USER_KEY));

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

    const events = new EventSource(
      `${API_BASE_URL}/api/auth/access-rights/events?token=${encodeURIComponent(token)}`
    );

    const handleBackendAccessRightsUpdated = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as {
          roleId?: string | null;
          role?: AdminUser['assignedRole'];
          accessRightNames?: string[];
        };

        if (!data.roleId || !Array.isArray(data.accessRightNames)) return;

        setUser((current) => {
          if (!current) return current;

          const currentRoleId = current.roleId || current.assignedRole?.id || null;
          if (String(currentRoleId || '') !== String(data.roleId)) return current;

          const next = {
            ...current,
            assignedRole: data.role ?? current.assignedRole,
            accessRights: data.accessRightNames,
          };
          updateStoredUser(next);
          window.dispatchEvent(new CustomEvent(BACKEND_ACCESS_RIGHTS_UPDATED_EVENT, { detail: next }));
          return next;
        });
      } catch {
        // Ignore malformed event payloads and keep the current session.
      }
    };

    events.addEventListener(BACKEND_ACCESS_RIGHTS_UPDATED_EVENT, handleBackendAccessRightsUpdated);

    return () => {
      events.removeEventListener(BACKEND_ACCESS_RIGHTS_UPDATED_EVENT, handleBackendAccessRightsUpdated);
      events.close();
    };
  }, [token]);

  useEffect(() => {
    const handleAccessRightsUpdated = (event: Event) => {
      const customEvent = event as AccessRightsUpdatedEvent;
      const roleId = customEvent.detail?.roleId;
      const accessRights = customEvent.detail?.accessRights;

      if (!roleId || !Array.isArray(accessRights)) return;

      setUser((current) => {
        if (!current) return current;

        const currentRoleId = current.roleId || current.assignedRole?.id || null;
        if (String(currentRoleId || '') !== String(roleId)) return current;

        const next = { ...current, accessRights };
        updateStoredUser(next);
        return next;
      });
    };

    window.addEventListener(ACCESS_RIGHTS_UPDATED_EVENT, handleAccessRightsUpdated);
    return () => window.removeEventListener(ACCESS_RIGHTS_UPDATED_EVENT, handleAccessRightsUpdated);
  }, []);

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
      persistAdminSession(data, email);

      if (data.user) {
        setUser(data.user);
      } else {
        updateStoredUser(null);
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

  const permissions = useMemo(() => getAdminUserAccessRights(user), [user]);
  const can = useCallback((right: string) => canAccessRight(user, right), [user]);

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
      updateUser,
      permissions,
      can,
    }),
    [token, user, email, password, loginError, handleLogin, handleLogout, refreshMe, updateUser, permissions, can]
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
