'use client';

import type { ReactNode } from 'react';
import { canAccessRight } from '@/lib/admin-pages';
import { useAdminAuth } from '@/hooks/use-admin-auth';

type CanProps = {
  right: string;
  children: ReactNode;
  fallback?: ReactNode;
};

export default function Can({ right, children, fallback = null }: CanProps) {
  const { user } = useAdminAuth();
  return canAccessRight(user, right) ? children : fallback;
}
