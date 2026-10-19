'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import {
  cleanupPaychanguCheckoutOverlay,
  notifyPaychanguReturn,
} from '@/lib/paychangu-popup-bridge';

function PaychanguReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const rawNext = searchParams.get('next') || '/give';
    const nextPath = rawNext.startsWith('/') ? rawNext : '/give';
    const inIframe = window.self !== window.top;

    const txRef =
      searchParams.get('tx_ref') ||
      searchParams.get('txRef') ||
      searchParams.get('charge_id') ||
      '';
    let pendingTx = txRef;
    let pendingAccount = searchParams.get('account') || '';
    try {
      const stored = JSON.parse(sessionStorage.getItem('picc-paychangu-pending') || 'null') as { txRef?: string; account?: string } | null;
      pendingTx = pendingTx || stored?.txRef || '';
      pendingAccount = pendingAccount || stored?.account || '';
    } catch {
      pendingTx = txRef;
    }

    if (pendingTx) {
      void apiFetch('/api/paychangu/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tx_ref: pendingTx,
          account: pendingAccount || 'main',
          status: searchParams.get('status') || 'success',
        }),
      }).finally(() => {
        sessionStorage.removeItem('picc-paychangu-pending');
      });
    }

    cleanupPaychanguCheckoutOverlay();
    notifyPaychanguReturn(nextPath);

    if (inIframe) {
      return;
    }

    const paychangu = searchParams.get('paychangu');
    const target = paychangu
      ? `${nextPath}${nextPath.includes('?') ? '&' : '?'}paychangu=${encodeURIComponent(paychangu)}`
      : nextPath;
    router.replace(target);
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-6 text-center text-sm text-slate-700">
      Payment received. Closing checkout…
    </main>
  );
}

export default function PaychanguReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white p-6 text-sm text-slate-600">
          Loading…
        </main>
      }
    >
      <PaychanguReturnContent />
    </Suspense>
  );
}
