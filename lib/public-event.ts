import { apiFetch, apiUrl } from '@/lib/api';
import { ministryNameForKey, parseEventForm, parseEventTickets, type EventFormSchema, type EventTicket } from '@/lib/event-forms';

export type PublicEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  time: string;
  image: string;
  ministryKey: string;
  ministryName: string;
  requiresRegistration: boolean;
  acceptsOnlinePayment: boolean;
  paymentAmount: number | null;
  paymentCurrency: string;
  paymentAccount: string;
  registrationForm: EventFormSchema | null;
  paymentForm: EventFormSchema | null;
  tickets: EventTicket[];
  acceptsCoupons: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const PUBLIC_FRONTEND_URL = 'https://www.piccworldwide.org';

export function publicSiteOrigin() {
  if (typeof window === 'undefined') return PUBLIC_FRONTEND_URL;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return PUBLIC_FRONTEND_URL;
  return window.location.origin.replace(/\/+$/, '');
}

export function publicEventPath(id: unknown) {
  const value = String(id ?? '').trim();
  if (!value || /^\d+$/.test(value) || value === 'fallback') return '';
  return `/events/${encodeURIComponent(value)}`;
}

export function openPublicEvent(id: unknown) {
  const path = publicEventPath(id);
  if (!path || typeof window === 'undefined') return false;
  window.location.assign(path);
  return true;
}

function resolveImage(value: unknown) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '/hero/hero-store.jpg';
  if (raw.startsWith('/uploads')) return apiUrl(raw);
  return raw;
}

export function normalizePublicEvent(value: unknown): PublicEvent | null {
  if (!isRecord(value)) return null;
  const id = String(value.id ?? '').trim();
  if (!publicEventPath(id) || value.isPublished === false) return null;
  const amount = Number(value.paymentAmount);
  const ministryKey = typeof value.ministryKey === 'string' ? value.ministryKey : '';
  const ministryName =
    typeof value.ministryName === 'string' && value.ministryName.trim()
      ? value.ministryName.trim()
      : ministryNameForKey(ministryKey);
  return {
    id,
    title: typeof value.title === 'string' && value.title.trim() ? value.title.trim() : 'Event',
    description: typeof value.description === 'string' ? value.description.trim() : '',
    location: typeof value.location === 'string' && value.location.trim() ? value.location.trim() : 'Location to be announced',
    startDate: typeof value.startDate === 'string' ? value.startDate : typeof value.date === 'string' ? value.date : '',
    endDate: typeof value.endDate === 'string' ? value.endDate : '',
    time: typeof value.time === 'string' ? value.time.trim() : '',
    image: resolveImage(value.imageUrl || value.image),
    ministryKey,
    ministryName,
    requiresRegistration: Boolean(value.requiresRegistration),
    acceptsOnlinePayment: Boolean(value.acceptsOnlinePayment),
    paymentAmount: Number.isFinite(amount) && amount > 0 ? amount : null,
    paymentCurrency: typeof value.paymentCurrency === 'string' && value.paymentCurrency ? value.paymentCurrency : 'MWK',
    paymentAccount: ministryKey === 'youth-church' ? 'youth' : 'main',
    registrationForm: parseEventForm(value.registrationForm),
    paymentForm: parseEventForm(value.paymentForm),
    tickets: parseEventTickets(value.tickets),
    acceptsCoupons: value.acceptsCoupons === true,
  };
}

export async function fetchPublicEvent(id: string): Promise<PublicEvent | null> {
  const direct = await apiFetch(`/api/events/${encodeURIComponent(id)}`);
  if (direct.ok) {
    const data = await direct.json().catch(() => null);
    const event = isRecord(data) && isRecord(data.event) ? data.event : data;
    const normalized = normalizePublicEvent(event);
    if (normalized) return normalized;
  }

  const list = await apiFetch('/api/events?take=200');
  if (!list.ok) return null;
  const data = await list.json().catch(() => null);
  const events = isRecord(data) && Array.isArray(data.events) ? data.events : Array.isArray(data) ? data : [];
  const match = events.find((event) => isRecord(event) && String(event.id) === id);
  return normalizePublicEvent(match);
}
