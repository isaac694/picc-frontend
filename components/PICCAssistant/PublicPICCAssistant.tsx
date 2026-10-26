'use client';

import { usePathname } from 'next/navigation';
import PICCAssistant from './PICCAssistant';

export default function PublicPICCAssistant() {
  const pathname = usePathname();

  // Hide PICC Assistant on administration and store pages
  const isHiddenPage =
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/store' ||
    pathname.startsWith('/store/');

  if (isHiddenPage) {
    return null;
  }

  return <PICCAssistant />;
}