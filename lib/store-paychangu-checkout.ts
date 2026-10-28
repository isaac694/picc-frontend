'use client';

import { PAYCHANGU_CHECKOUT_METHOD, processPaychanguPayment } from '@/lib/paychangu-initialize';

export { PAYCHANGU_CHECKOUT_METHOD };

export function normalizeStorePaychanguPhone(rawPhone: string): string {
  return rawPhone.replace(/\D/g, '').replace(/^0+/, '');
}

export function splitStoreCustomerName(fullName: string, fallbackEmail: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
  }
  const localPart = fallbackEmail.split('@')[0]?.trim() || 'Customer';
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: 'Customer' };
  }
  return { firstName: localPart, lastName: 'Customer' };
}

export function resolveStoreOrderReference(data: Record<string, unknown> | null | undefined): string {
  if (!data) return crypto.randomUUID();

  const payment = data.payment as { chargeId?: string } | undefined;
  const chargeId = data.chargeId ?? payment?.chargeId;
  if (chargeId) return String(chargeId);

  const purchases = data.purchases;
  if (Array.isArray(purchases) && purchases.length > 0) {
    const first = purchases[0] as { id?: string };
    if (first?.id) return String(first.id);
  }

  if (data.orderId) return String(data.orderId);
  if (data.id) return String(data.id);

  return crypto.randomUUID();
}

export async function openStorePaychanguPopup(input: {
  orderReference: string;
  amount: number;
  email: string;
  customerName: string;
  phone: string;
  reason: string;
  returnPath: string;
  format: 'soft' | 'hard';
}): Promise<void> {
  const normalizedPhone = normalizeStorePaychanguPhone(input.phone);
  if (normalizedPhone.length !== 9) {
    throw new Error('Please enter a valid Malawi mobile number with 9 digits.');
  }

  const { firstName, lastName } = splitStoreCustomerName(input.customerName, input.email);

  await processPaychanguPayment({
    givingId: input.orderReference,
    amount: input.amount,
    currency: 'MWK',
    email: input.email,
    firstName,
    lastName,
    phone: normalizedPhone,
    reason: input.reason,
    account: 'main',
    returnPath: input.returnPath,
    txRef: input.orderReference,
    meta: { format: input.format },
  });
}
