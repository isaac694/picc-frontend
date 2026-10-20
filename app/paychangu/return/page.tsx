'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPaychanguCheckout } from '@/lib/paychangu-client';
import {
  cleanupPaychanguCheckoutOverlay,
  notifyPaychanguReturn,
} from '@/lib/paychangu-popup-bridge';

function PaychanguReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const rawNext = searchParams.get('next') || '/give';
    const nextPath = rawNext.startsWith('/') ? rawNext : '/give';
    const inIframe = window.self !== window.top;
    const status = searchParams.get('status') || 'success';

    const txRef =
      searchParams.get('tx_ref') ||
      searchParams.get('txRef') ||
      searchParams.get('charge_id') ||
      searchParams.get('transaction_id') ||
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

    void (async () => {
      if (pendingTx) {
        await confirmPaychanguCheckout(pendingTx, pendingAccount || 'main', status);
        sessionStorage.removeItem('picc-paychangu-pending');
      }

      cleanupPaychanguCheckoutOverlay();
      notifyPaychanguReturn(nextPath, {
        txRef: pendingTx,
        account: pendingAccount || 'main',
        status,
      });

      if (inIframe) return;

      const paychangu = searchParams.get('paychangu');
      const target = paychangu
        ? `${nextPath}${nextPath.includes('?') ? '&' : '?'}paychangu=${encodeURIComponent(paychangu)}`
        : nextPath;
      router.replace(target);
    })();
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
