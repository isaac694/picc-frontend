'use client';

import type { PaychanguConfig } from 'paychangu-js';
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

const PAYCHANGU_POPUP_SCRIPT_URL = 'https://in.paychangu.com/js/popup.js';

declare global {
  interface Window {
    PaychanguCheckout?: (config: PaychanguConfig) => void;
  }
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

function loadPaychanguPopupScript(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('PayChangu checkout must run in the browser.'));
  }
  if (typeof window.PaychanguCheckout === 'function') {
    return Promise.resolve();
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${PAYCHANGU_POPUP_SCRIPT_URL}"]`,
  );
  if (!existing) {
    const script = document.createElement('script');
    script.src = PAYCHANGU_POPUP_SCRIPT_URL;
    script.async = true;
    document.head.appendChild(script);
  }

  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 20_000;
    const tick = () => {
      if (typeof window.PaychanguCheckout === 'function') {
        resolve();
        return;
      }
      if (Date.now() >= deadline) {
        reject(new Error('PayChangu checkout script did not load. Check your connection and try again.'));
        return;
      }
      window.setTimeout(tick, 100);
    };
    tick();
  });
}

async function invokePaychanguCheckout(config: PaychanguConfig): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      if (typeof window.PaychanguCheckout !== 'function') {
        throw new Error('PayChanguCheckout is not available.');
      }
      window.PaychanguCheckout(config);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Unable to open PayChangu checkout.');
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

  const { callback_url, return_url } = buildPaychanguReturnUrls(returnPath);

  ensurePaychanguWrapper();
  await loadPaychanguPopupScript();

  const stopListening = listenForPaychanguReturn();
  window.setTimeout(stopListening, 60 * 60 * 1000);

  const txPrefix = input.txRefPrefix === 'STORE' ? 'STORE' : 'PICC';
  const defaultMeta =
    txPrefix === 'STORE'
      ? { storeOrderId: input.givingId, phone: input.phone }
      : { givingId: input.givingId, phone: input.phone };

  const config: PaychanguConfig = {
    public_key: publicKey,
    tx_ref: input.txRef || `${txPrefix}-${input.givingId}-${generateTxRef()}`,
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

  await invokePaychanguCheckout(config);
}

/** After a giving record is saved, launch PayChangu popup checkout (all payment channels). */
export async function processPaychanguPayment(
  input: ProcessPaychanguPaymentInput,
): Promise<{ mode: 'popup' }> {
  await openPaychanguPopupCheckout(input);
  return { mode: 'popup' };
}
