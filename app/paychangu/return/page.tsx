'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
