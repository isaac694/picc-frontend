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

export interface TestimonyNotificationPayload {
  churchEmail: string;
  fullName: string;
  phone?: string;
  area?: string;
  situation: string;
  testimony: string;
}

export interface MembershipNotificationPayload {
  churchEmail: string;
  fullName: string;
  gender: string;
  email: string;
  phone: string;
  city: string;
  country: string;
}

export interface PrayerNotificationPayload {
  churchEmail: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  bornAgain?: string;
  areaOfNeed?: string;
  request: string;
}

export interface EventRegistrationNotificationPayload {
  churchEmail: string;
  eventTitle: string;
  eventDate?: string;
  fullName: string;
  residence: string;
  phone: string;
  email: string;
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

export async function sendTestimonyNotification(payload: TestimonyNotificationPayload) {
  const response = await fetch('/api/send-testimony-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'Failed to send testimony email');
  }

  return response.json();
}

export async function sendMembershipNotification(payload: MembershipNotificationPayload) {
  const response = await fetch('/api/send-membership-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'Failed to send membership email');
  }

  return response.json();
}

export async function sendPrayerNotification(payload: PrayerNotificationPayload) {
  const response = await fetch('/api/send-prayer-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'Failed to send prayer email');
  }

  return response.json();
}

export async function sendEventRegistrationNotification(payload: EventRegistrationNotificationPayload) {
  const response = await fetch('/api/send-event-registration-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'Failed to send event registration email');
  }

  return response.json();
}
