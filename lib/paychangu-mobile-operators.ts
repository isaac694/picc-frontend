import { apiFetch } from '@/lib/api';

/** PayChangu `short_code` → operator ref (fallback when operators API is unavailable). */
export const FALLBACK_MOBILE_MONEY_OPERATOR_REFS: Record<string, string> = {
  airtel: '20be6c20-adeb-4b5b-a7ba-0769820df4fb',
  tnm: '27494cb5-ba9e-437f-a114-4e7a7686bcca',
};

export type MobileMoneyOperator = {
  id: number;
  name: string;
  ref_id: string;
  short_code: string;
};

let cachedRefByShortCode: Map<string, string> | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export function paymentMethodToOperatorShortCode(paymentMethod: string): string | null {
  switch (paymentMethod) {
    case 'airtel':
      return 'airtel';
    case 'mpamba':
      return 'tnm';
    default:
      return null;
  }
}

function normalizeOperatorsPayload(payload: unknown): MobileMoneyOperator[] {
  if (!payload || typeof payload !== 'object') return [];
  const root = payload as Record<string, unknown>;
  const data = root.data;
  if (Array.isArray(data)) {
    return data.filter((item): item is MobileMoneyOperator => {
      if (!item || typeof item !== 'object') return false;
      const row = item as Record<string, unknown>;
      return (
        typeof row.ref_id === 'string' &&
        typeof row.short_code === 'string' &&
        row.ref_id.trim().length > 0
      );
    });
  }
  if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown[] }).data)) {
    return normalizeOperatorsPayload({ data: (data as { data: unknown[] }).data });
  }
  return [];
}

export async function loadMobileMoneyOperatorRefMap(): Promise<Map<string, string>> {
  const now = Date.now();
  if (cachedRefByShortCode && now < cacheExpiresAt) {
    return cachedRefByShortCode;
  }

  const map = new Map<string, string>(Object.entries(FALLBACK_MOBILE_MONEY_OPERATOR_REFS));

  const operatorPaths = ['/api/paychangu/mobile-money/operators', '/api/paychangu/operators'];

  for (const path of operatorPaths) {
    try {
      const response =
        path.startsWith('/api/paychangu/mobile-money') && typeof window !== 'undefined'
          ? await fetch(`${window.location.origin}${path}`, { headers: { Accept: 'application/json' } })
          : await apiFetch(path);
      if (!response.ok) continue;
      const payload = await response.json().catch(() => null);
      const operators = normalizeOperatorsPayload(payload);
      for (const operator of operators) {
        map.set(operator.short_code.trim().toLowerCase(), operator.ref_id.trim());
      }
      if (operators.length > 0) break;
    } catch {
      // try next path or fall back to defaults
    }
  }

  cachedRefByShortCode = map;
  cacheExpiresAt = now + CACHE_TTL_MS;
  return map;
}

export async function resolveMobileMoneyOperatorRefId(
  paymentMethod: string,
): Promise<string | undefined> {
  const shortCode = paymentMethodToOperatorShortCode(paymentMethod);
  if (!shortCode) return undefined;

  const map = await loadMobileMoneyOperatorRefMap();
  return map.get(shortCode) || FALLBACK_MOBILE_MONEY_OPERATOR_REFS[shortCode];
}

export async function enrichPaychanguInitializeBody<T extends Record<string, unknown>>(
  body: T,
): Promise<T & { operatorRefId?: string }> {
  const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod : '';
  if (paymentMethod !== 'airtel' && paymentMethod !== 'mpamba') {
    return body;
  }

  const operatorRefId = await resolveMobileMoneyOperatorRefId(paymentMethod);
  if (!operatorRefId) return body;

  return {
    ...body,
    operatorRefId,
    mobile_money_operator_ref_id: operatorRefId,
  };
}
