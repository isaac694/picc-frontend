'use client';

import { useSyncExternalStore } from 'react';

export type AdminTheme = 'light' | 'dark';

export const ADMIN_THEME_STORAGE_KEY = 'picc-admin-theme';

function readTheme(): AdminTheme {
  if (typeof window === 'undefined') return 'light';
  const raw = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
  return raw === 'dark' ? 'dark' : 'light';
}

function getSnapshot(): AdminTheme {
  return readTheme();
}

function getServerSnapshot(): AdminTheme {
  return 'light';
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key !== ADMIN_THEME_STORAGE_KEY) return;
    callback();
  };

  const onLocalChange = () => callback();

  window.addEventListener('storage', onStorage);
  window.addEventListener('admin-theme-change', onLocalChange as EventListener);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('admin-theme-change', onLocalChange as EventListener);
  };
}

function writeTheme(theme: AdminTheme) {
  window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new Event('admin-theme-change'));
}

export function useAdminTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Avoid SSR/client mismatches: only consider "mounted" after hydration.
  const mounted = typeof window !== 'undefined';

  const setTheme = (nextTheme: AdminTheme) => writeTheme(nextTheme);
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return {
    mounted,
    theme,
    isDark: mounted && theme === 'dark',
    setTheme,
    toggleTheme,
  };
}
