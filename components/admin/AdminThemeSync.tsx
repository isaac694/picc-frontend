'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ADMIN_THEME_STORAGE_KEY, type AdminTheme } from '@/hooks/use-admin-theme';

function readStoredTheme(): AdminTheme {
  if (typeof window === 'undefined') return 'light';
  const raw = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
  return raw === 'dark' ? 'dark' : 'light';
}

function applyThemeToHtml(theme: AdminTheme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export default function AdminThemeSync() {
  const pathname = usePathname();

  useEffect(() => {
    const isAdminRoute = (pathname || '').startsWith('/admin');

    if (!isAdminRoute) {
      // Ensure admin-only dark mode never bleeds into public pages.
      document.documentElement.classList.remove('dark');
      return;
    }

    applyThemeToHtml(readStoredTheme());

    const onStorage = (event: StorageEvent) => {
      if (event.key !== ADMIN_THEME_STORAGE_KEY) return;
      applyThemeToHtml(readStoredTheme());
    };

    const onLocalChange = () => applyThemeToHtml(readStoredTheme());

    window.addEventListener('storage', onStorage);
    window.addEventListener('admin-theme-change', onLocalChange as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('admin-theme-change', onLocalChange as EventListener);
    };
  }, [pathname]);

  return null;
}

