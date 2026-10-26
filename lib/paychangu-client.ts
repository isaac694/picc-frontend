'use client';

import type { PaychanguConfig } from 'paychangu-js';
import { apiFetch } from '@/lib/api';
import {
  buildPaychanguReturnUrls,
  listenForPaychanguReturn,
  resolvePaychanguCheckoutOrigin,
} from '@/lib/paychangu-popup-bridge';
export type PaychanguAccountKey = 'main' | 'youth';

/** Stored on giving records; channel is chosen inside PayChangu checkout. */
export const PAYCHANGU_CHECKOUT_METHOD = 'paychangu';

export type ProcessPaychanguPaymentInput = {
  /** Reference segment in tx_ref (giving id, store order id, charge id, etc.). */
  givingId: string;
  amount: number;
  currency: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  reason: string;
  account?: PaychanguAccountKey | string;
  /** Page to return to after checkout (defaults to current path). */
  returnPath?: string;
  /** Default `PICC`; use `STORE` for Hope Stores checkout. */
  txRefPrefix?: 'PICC' | 'STORE';
  /** Use this exact PayChangu reference instead of generating one. */
  txRef?: string;
  meta?: Record<string, string | undefined>;
};

export type BankTransferDetails = {
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  account_expiration_timestamp?: number;
};

function resolvePublicKeyFromBundle(account?: string): string {
  const key = (account || 'main').toLowerCase();
  if (key === 'youth') {
    return process.env.NEXT_PUBLIC_PAYCHANGU_PUBLIC_KEY_YOUTH?.trim() || '';
  }
  return (
    process.env.NEXT_PUBLIC_PAYCHANGU_PUBLIC_KEY_MAIN?.trim() ||
    process.env.NEXT_PUBLIC_PAYCHANGU_PUBLIC_KEY?.trim() ||
    ''
  );
}

async function loadPublicKey(account?: string): Promise<string> {
  const fromBundle = resolvePublicKeyFromBundle(account);
  if (fromBundle) return fromBundle;

  const params = new URLSearchParams({ account: (account || 'main').toLowerCase() });
  const response = await fetch(`/api/paychangu/public-key?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  const data = (await response.json().catch(() => ({}))) as { publicKey?: string; error?: string };
  if (response.ok && typeof data.publicKey === 'string' && data.publicKey.trim()) {
    return data.publicKey.trim();
  }
  throw new Error(
    data.error ||
      'PayChangu public key is not configured. Add PAYCHANGU_PUBLIC_KEY_MAIN or NEXT_PUBLIC_PAYCHANGU_PUBLIC_KEY_MAIN to .env.',
  );
}

function generateTxRef(): string {
  return `TX${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
}

/** PayChangu's hosted popup.js mounts the checkout iframe on `#wrapper`. */
function ensurePaychanguWrapper(): void {
  if (typeof document === 'undefined' || document.getElementById('wrapper')) {
    return;
  }
  const wrapper = document.createElement('div');
  wrapper.id = 'wrapper';
  document.body.appendChild(wrapper);
}

function openPaychanguCheckoutFrame(checkoutUrl: string) {
  ensurePaychanguWrapper();
  document.getElementById('iframe1')?.remove();
  const iframe = document.createElement('iframe');
  iframe.id = 'iframe1';
  iframe.src = checkoutUrl;
  iframe.title = 'PayChangu checkout';
  iframe.setAttribute('class', 'checkout-iframe-block');
  Object.assign(iframe.style, {
    position: 'fixed',
    top: '0',
    right: '0',
    bottom: '0',
    width: '100%',
    height: '100%',
    border: 'none',
    margin: '0',
    padding: '0',
    overflow: 'hidden',
    zIndex: '9999',
  });
  document.getElementById('wrapper')?.appendChild(iframe);
}

async function invokePaychanguCheckout(config: PaychanguConfig, account?: string): Promise<void> {
  const response = await fetch('/api/paychangu/popup', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      account,
      tx_ref: config.tx_ref,
      amount: config.amount,
      currency: config.currency,
      callback_url: config.callback_url,
      return_url: config.return_url,
      customer: config.customer,
      customization: config.customization,
      meta: config.meta,
    }),
  });
  const data = (await response.json().catch(() => null)) as { checkoutUrl?: string; error?: string } | null;
  if (!response.ok || !data?.checkoutUrl) {
    throw new Error(data?.error || 'Unable to open PayChangu checkout.');
  }
  openPaychanguCheckoutFrame(data.checkoutUrl);
}

function readPendingPaychanguCheckout(): { txRef?: string; account?: string } | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    return JSON.parse(sessionStorage.getItem('picc-paychangu-pending') || 'null') as {
      txRef?: string;
      account?: string;
    } | null;
  } catch {
    return null;
  }
}

/** Ask the API to verify a PayChangu charge and mark the matching payment paid. */
export async function confirmPaychanguCheckout(
  txRef: string,
  account?: string,
  status = 'success',
): Promise<void> {
  const reference = txRef.trim();
  if (!reference) return;
  await apiFetch('/api/paychangu/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tx_ref: reference,
      account: account || 'main',
      status,
    }),
  });
}

/**
 * PayChangu hosted popup ([paychangu-js](https://www.npmjs.com/package/paychangu-js)).
 * User picks Airtel, Mpamba, bank, or card inside PayChangu — not on our form.
 */
export async function openPaychanguPopupCheckout(input: ProcessPaychanguPaymentInput): Promise<void> {
  const publicKey = await loadPublicKey(input.account);

  const returnPath =
    input.returnPath ||
    (typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/give');

  const checkoutOrigin = resolvePaychanguCheckoutOrigin();
  if (checkoutOrigin.startsWith('http://') && publicKey.startsWith('pub-live-')) {
    console.warn(
      'PayChangu live checkout return URLs should use HTTPS. Set NEXT_PUBLIC_APP_URL to your public https site (e.g. production URL or an HTTPS tunnel) to avoid a blocked return page after payment.',
    );
  }

  const account = String(input.account || 'main').toLowerCase();
  // PayChangu redirects the browser to callback_url after a successful payment.
  // The return page then asks our API to verify the charge and save it.
  const { callback_url, return_url } = buildPaychanguReturnUrls(returnPath, { account });

  ensurePaychanguWrapper();

  const txPrefix = input.txRefPrefix === 'STORE' ? 'STORE' : 'PICC';
  const txRef = input.txRef || `${txPrefix}-${input.givingId}-${generateTxRef()}`;
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('picc-paychangu-pending', JSON.stringify({ txRef, account }));
  }

  const stopListening = listenForPaychanguReturn((_next, pending) => {
    const stored = readPendingPaychanguCheckout();
    const pendingTx = pending?.txRef || stored?.txRef || txRef;
    const pendingAccount = pending?.account || stored?.account || account;
    if (!pendingTx) return;
    void confirmPaychanguCheckout(pendingTx, pendingAccount, pending?.status || 'success');
  });
  window.setTimeout(stopListening, 60 * 60 * 1000);
  const defaultMeta =
    txPrefix === 'STORE'
      ? { storeOrderId: input.givingId, phone: input.phone }
      : { givingId: input.givingId, phone: input.phone };

  const config: PaychanguConfig = {
    public_key: publicKey,
    tx_ref: txRef,
    amount: input.amount,
    currency: input.currency,
    callback_url,
    return_url,
    customer: {
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
    },
    customization: {
      title: input.reason || (txPrefix === 'STORE' ? 'Hope Stores' : 'PICC Payment'),
      description:
        input.reason ||
        (txPrefix === 'STORE' ? 'Thank you for your purchase.' : 'Thank you for your generosity.'),
    },
    meta: {
      ...defaultMeta,
      ...input.meta,
    },
  };

  await invokePaychanguCheckout(config, account);
}

/** After a giving record is saved, launch PayChangu popup checkout (all payment channels). */
export async function processPaychanguPayment(
  input: ProcessPaychanguPaymentInput,
): Promise<{ mode: 'popup' }> {
  await openPaychanguPopupCheckout(input);
  return { mode: 'popup' };
}
