'use client';

export interface GivingNotificationPayload {
  userEmail?: string;
  churchEmail: string;
  fullName: string;
  amount: number | string;
  currency: string;
  phone: string;
  phoneCountry: string;
  paymentMethod: string;
  reason: string;
  givingType?: string;
  specialRecipient?: string;
  givingDate?: string;
  bookletNumber?: string;
}

export async function sendGivingNotification(payload: GivingNotificationPayload) {
  const response = await fetch('/api/send-giving-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'Failed to send giving notification email');
  }

  return response.json();
}
