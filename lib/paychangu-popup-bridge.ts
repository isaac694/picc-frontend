'use client';

export const PAYCHANGU_RETURN_MESSAGE = 'picc-paychangu-return';

/** Origin used in PayChangu return/callback URLs (must be HTTPS in live mode). */
export function resolvePaychanguCheckoutOrigin(): string {
  if (typeof window === 'undefined') return '';

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      /* use current origin */
    }
  }

  return window.location.origin;
}

export function buildPaychanguReturnUrls(
  returnPath: string,
  options?: { account?: string; callbackUrl?: string },
): {
  callback_url: string;
  return_url: string;
} {
  const origin = resolvePaychanguCheckoutOrigin();
  const path = returnPath.startsWith('/') ? returnPath : `/${returnPath}`;

  const callback = new URL('/paychangu/return', origin);
  callback.searchParams.set('next', path);
  callback.searchParams.set('paychangu', 'callback');

  const returnUrl = new URL('/paychangu/return', origin);
  returnUrl.searchParams.set('next', path);
  returnUrl.searchParams.set('paychangu', 'return');
  if (options?.account) {
    callback.searchParams.set('account', options.account);
    returnUrl.searchParams.set('account', options.account);
  }

  return {
    callback_url: options?.callbackUrl || callback.toString(),
    return_url: returnUrl.toString(),
  };
}

export function cleanupPaychanguCheckoutOverlay(): void {
  if (typeof document === 'undefined') return;
  document.querySelector('#iframe1')?.remove();
  document.querySelector('.page-loading')?.remove();
  document.getElementById('myModal')?.remove();
}

export function notifyPaychanguReturn(
  nextPath: string,
  pending?: { txRef?: string; account?: string; status?: string },
): void {
  if (typeof window === 'undefined' || window.parent === window) return;
  window.parent.postMessage(
    { type: PAYCHANGU_RETURN_MESSAGE, next: nextPath, ...pending },
    window.location.origin,
  );
}

export function listenForPaychanguReturn(
  onReturn?: (
    nextPath: string,
    pending?: { txRef?: string; account?: string; status?: string },
  ) => void,
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const handler = (event: MessageEvent) => {
    if (event.data === 'removeIframe') {
      cleanupPaychanguCheckoutOverlay();
      onReturn?.('/give');
      return;
    }

    const payload = event.data as {
      type?: string;
      next?: string;
      txRef?: string;
      account?: string;
      status?: string;
    } | null;
    if (payload?.type === PAYCHANGU_RETURN_MESSAGE) {
      cleanupPaychanguCheckoutOverlay();
      onReturn?.(payload.next || '/give', {
        txRef: payload.txRef,
        account: payload.account,
        status: payload.status,
      });
    }
  };

  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}
