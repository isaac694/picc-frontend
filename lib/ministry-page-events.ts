'use client';

import { useEffect, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { parseEventForm, parseEventTickets, type EventFormSchema, type EventTicket } from '@/lib/event-forms';

export type MinistryPageEvent = {
  id: string;
  category: 'event';
  title: string;
  description: string | null;
  label: string | null;
  imageUrl: string | null;
  sortOrder: number;
  location: string | null;
  acceptsOnlinePayment?: boolean;
  paymentAmount?: number | null;
  paymentCurrency?: string | null;
  paymentAccount?: string | null;
  requiresRegistration?: boolean;
  registrationForm?: EventFormSchema | null;
  paymentForm?: EventFormSchema | null;
  tickets?: EventTicket[];
};

function formatEventDate(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function resolveImage(value: unknown) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw || raw.includes('placeholder-event')) return null;
  if (raw.startsWith('/uploads')) return apiUrl(raw);
  return raw;
}

export async function fetchMinistryPageEvents(ministryKey: string): Promise<MinistryPageEvent[]> {
  const response = await apiFetch(`/api/events?ministry=${encodeURIComponent(ministryKey)}`);
  if (!response.ok) return [];
  const data = await response.json().catch(() => null);
  const events = Array.isArray(data?.events) ? data.events : [];

  return events
    .filter((event): event is Record<string, unknown> => {
      if (!event || typeof event !== 'object') return false;
      return (event as Record<string, unknown>).isPublished !== false;
    })
    .map((event, index) => {
      const start = formatEventDate(event.startDate || event.date);
      const end = formatEventDate(event.endDate);
      const dateLabel = start && end && start !== end ? `${start} - ${end}` : start;
      const time = typeof event.time === 'string' ? event.time.trim() : '';
      const amount = typeof event.paymentAmount === 'number' ? event.paymentAmount : Number(event.paymentAmount);
      return {
        id: String(event.id ?? `ministry-event-${index + 1}`),
        category: 'event' as const,
        title: typeof event.title === 'string' && event.title.trim() ? event.title.trim() : 'Event',
        description: typeof event.description === 'string' ? event.description : null,
        label: [dateLabel, time].filter(Boolean).join(' | ') || null,
        imageUrl: resolveImage(event.imageUrl || event.image),
        sortOrder: index,
        location: typeof event.location === 'string' ? event.location : null,
        acceptsOnlinePayment: Boolean(event.acceptsOnlinePayment),
        paymentAmount: Number.isFinite(amount) ? amount : null,
        paymentCurrency: typeof event.paymentCurrency === 'string' ? event.paymentCurrency : 'MWK',
        paymentAccount: ministryKey === 'youth-church' ? 'youth' : 'main',
        requiresRegistration: Boolean(event.requiresRegistration),
        registrationForm: parseEventForm(event.registrationForm),
        paymentForm: parseEventForm(event.paymentForm),
        tickets: parseEventTickets(event.tickets),
      };
    });
}

export function eventLocation(item: object, fallback: string) {
  const value = 'location' in item ? (item as { location?: string | null }).location : '';
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function useMinistryPageEvents(ministryKey: string) {
  const [events, setEvents] = useState<MinistryPageEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchMinistryPageEvents(ministryKey)
      .then((items) => {
        if (!cancelled) setEvents(items);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [ministryKey]);

  return events;
}
