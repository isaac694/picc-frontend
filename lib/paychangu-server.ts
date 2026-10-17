import {
  FALLBACK_MOBILE_MONEY_OPERATOR_REFS,
  paymentMethodToOperatorShortCode,
} from '@/lib/paychangu-mobile-operators';

export const PAYCHANGU_API_ORIGIN = 'https://api.paychangu.com';

export type PaychanguAccountKey = 'main' | 'youth';

export function resolvePaychanguPublicKey(account?: unknown): string | undefined {
  const key = typeof account === 'string' ? account.trim().toLowerCase() : 'main';
  if (key === 'youth') {
    return (
      process.env.NEXT_PUBLIC_PAYCHANGU_PUBLIC_KEY_YOUTH?.trim() ||
      process.env.PAYCHANGU_PUBLIC_KEY_YOUTH?.trim() ||
      undefined
    );
  }
  return (
    process.env.NEXT_PUBLIC_PAYCHANGU_PUBLIC_KEY_MAIN?.trim() ||
    process.env.PAYCHANGU_PUBLIC_KEY_MAIN?.trim() ||
    process.env.NEXT_PUBLIC_PAYCHANGU_PUBLIC_KEY?.trim() ||
    process.env.PAYCHANGU_PUBLIC_KEY?.trim() ||
    undefined
  );
}

export function resolvePaychanguSecretKey(account?: unknown): string | undefined {
  const key = typeof account === 'string' ? account.trim().toLowerCase() : 'main';
  if (key === 'youth') {
    return (
      process.env.PAYCHANGU_SECRET_KEY_YOUTH?.trim() ||
      process.env.PAYCHANGU_SECRET_KEY?.trim() ||
      undefined
    );
  }
  return (
    process.env.PAYCHANGU_SECRET_KEY_MAIN?.trim() ||
    process.env.PAYCHANGU_SECRET_KEY?.trim() ||
    undefined
  );
}

export function resolveMobileMoneyOperatorRefId(body: Record<string, unknown>): string | undefined {
  const operatorRefId =
    (typeof body.operatorRefId === 'string' && body.operatorRefId.trim()) ||
    (typeof body.mobile_money_operator_ref_id === 'string' &&
      body.mobile_money_operator_ref_id.trim()) ||
    '';

  if (operatorRefId) return operatorRefId.trim();

  const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod : '';
  const shortCode = paymentMethodToOperatorShortCode(paymentMethod);
  if (!shortCode) return undefined;

  const fromEnv =
    paymentMethod === 'airtel'
      ? process.env.PAYCHANGU_AIRTEL_REF_ID?.trim()
      : paymentMethod === 'mpamba'
        ? process.env.PAYCHANGU_MPAMBA_REF_ID?.trim()
        : undefined;

  return fromEnv || FALLBACK_MOBILE_MONEY_OPERATOR_REFS[shortCode];
}

export function resolveBackendApiBaseUrl(): string {
  const prod = 'https://backend.piccworldwide.org';
  const local = 'http://localhost:5000';

  if (process.env.NODE_ENV === 'production') {
    return prod;
  }

  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '');
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        if (url.port === '5000' || !url.port) return configured;
      }
      if (url.hostname === 'backend.piccworldwide.org') return configured;
    } catch {
      // fall through
    }
  }

  return local;
}
