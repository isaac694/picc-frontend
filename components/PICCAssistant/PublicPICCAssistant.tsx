'use client';

import { usePathname } from 'next/navigation';
import PICCAssistant from './PICCAssistant';

export default function PublicPICCAssistant() {
  const pathname = usePathname();

  // Hide PICC Assistant on all administration pages
  const isAdminPage =
    pathname === '/admin' ||
    pathname.startsWith('/admin/');

  if (isAdminPage) {
    return null;
  }

  return <PICCAssistant />;
}