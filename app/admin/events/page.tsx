'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { Search } from 'lucide-react';
import Image from 'next/image';

type EventScope = 'general' | 'discipleship' | 'hope-school';

type AdminEvent = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  time: string;
  location: string;
  description: string;
  image: string;
  requiresRegistration: boolean;
  registrationEmail: string;
  acceptsOnlinePayment: boolean;
  paymentAmount: string;
  paymentCurrency: string;
  scope: EventScope;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const DEFAULT_EVENT_DRAFT = {
  title: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  time: '',
  location: '',
  description: '',
  image: '',
  requiresRegistration: false,
  registrationEmail: '',
  acceptsOnlinePayment: false,
  paymentAmount: '',
  paymentCurrency: 'MWK',
  scope: 'general' as EventScope,
};

const normalizeScope = (value: unknown): EventScope => {
  const normalized = String(value ?? 'general').toLowerCase().replace(/_/g, '-');
  if (normalized === 'discipleship') return 'discipleship';
  if (normalized === 'hope-school' || normalized === 'hopeschool') return 'hope-school';
  return 'general';
};

const normalizeEventImageUrl = (value?: string | null) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return '';
  if (trimmed.startsWith('http')) return trimmed;
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  return trimmed;
};

const buildSearchableDateParts = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return [trimmed.toLowerCase()];

  return [
    trimmed.toLowerCase(),
    parsed.toLocaleDateString('en-US').toLowerCase(),
    parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toLowerCase(),
    parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase(),
    parsed.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toLowerCase(),
    String(parsed.getFullYear()).toLowerCase(),
  ];
};

export default function EventsAdminPage() {
  const {
    token,
    email,
    password,
    loginError,
    setEmail,
    setPassword,
    handleLogin,
    handleLogout,
  } = useAdminAuth();

  const [status, setStatus] = useState('');
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventDraft, setEventDraft] = useState(DEFAULT_EVENT_DRAFT);
  const [uploadNames, setUploadNames] = useState<Record<string, string>>({});
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const updateUploadName = (key: string, name: string) => {
    setUploadNames((prev) => ({ ...prev, [key]: name }));
  };

  const formatEventDateLabel = (event: Pick<AdminEvent, 'startDate' | 'endDate'>) =>
    event.startDate === event.endDate ? event.startDate : `${event.startDate} - ${event.endDate}`;

  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const aTime = new Date(a.startDate || a.endDate).getTime();
        const bTime = new Date(b.startDate || b.endDate).getTime();
        return bTime - aTime;
      }),
    [events],
  );

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sortedEvents;

    return sortedEvents.filter((event) => {
      const title = event.title.toLowerCase();
      const dateParts = [
        ...buildSearchableDateParts(event.startDate),
        ...buildSearchableDateParts(event.endDate),
        formatEventDateLabel(event).toLowerCase(),
      ];
      return title.includes(query) || dateParts.some((part) => part.includes(query));
    });
  }, [searchQuery, sortedEvents]);

  const uploadImage = async (file: File) => {
    if (!token) return null;

    // Check file size (1MB = 1024 * 1024 bytes)
    if (file.size > 1024 * 1024) {
      setStatus('Your image file size is too big. Please compress it first before re uploading. Only pictures less than 1MB are allowed.');
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await apiFetch('/api/uploads', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        setStatus('Image upload failed.');
        return null;
      }
      const data = await response.json();
      return data.url;
    } catch {
      setStatus('Image upload failed.');
      return null;
    }
  };

  const refreshEvents = useCallback(async () => {
    try {
      const response = await apiFetch('/api/events');
      if (!response.ok) return;
      const data = (await response.json().catch(() => null)) as unknown;
      const list: unknown[] = Array.isArray(data)
        ? data
        : isRecord(data) && Array.isArray(data.events)
          ? (data.events as unknown[])
          : [];

      const normalized: AdminEvent[] = list
        .filter(isRecord)
        .map((event) => {
          const rawImage =
            typeof event.image === 'string'
              ? event.image
              : typeof event.imageUrl === 'string'
                ? event.imageUrl
                : '';

          return {
            id: typeof event.id === 'string' ? event.id : String(event.id ?? ''),
            title: typeof event.title === 'string' ? event.title : '',
            startDate:
              event.startDate
                ? String(event.startDate).slice(0, 10)
                : event.date
                  ? String(event.date).slice(0, 10)
                  : '',
            endDate:
              event.endDate
                ? String(event.endDate).slice(0, 10)
                : event.date
                  ? String(event.date).slice(0, 10)
                  : '',
            time: typeof event.time === 'string' ? event.time : '',
            location: typeof event.location === 'string' ? event.location : '',
            description: typeof event.description === 'string' ? event.description : '',
            image: normalizeEventImageUrl(rawImage),
            requiresRegistration: Boolean(event.requiresRegistration),
            registrationEmail: typeof event.registrationEmail === 'string' ? event.registrationEmail : '',
            acceptsOnlinePayment: Boolean(event.acceptsOnlinePayment),
            paymentAmount:
              typeof event.paymentAmount === 'number'
                ? String(event.paymentAmount)
                : typeof event.paymentAmount === 'string'
                  ? event.paymentAmount
                  : '',
            paymentCurrency: typeof event.paymentCurrency === 'string' ? event.paymentCurrency : 'MWK',
            scope: normalizeScope(event.scope),
          };
        })
        .filter((event) => Boolean(event.id));

      setEvents(normalized);
    } catch {
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(() => {
      void refreshEvents();
    }, 0);
    return () => clearTimeout(id);
  }, [token, refreshEvents]);

  const handleSelectEvent = (event: AdminEvent) => {
    setSelectedEventId(event.id);
    setEventDraft({
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      time: event.time,
      location: event.location,
      description: event.description,
      image: event.image,
      requiresRegistration: event.requiresRegistration,
      registrationEmail: event.registrationEmail,
      acceptsOnlinePayment: event.acceptsOnlinePayment,
      paymentAmount: event.paymentAmount,
      paymentCurrency: event.paymentCurrency,
      scope: event.scope,
    });
    updateUploadName('event-draft', '');
  };

  const handleClearSelection = () => {
    setSelectedEventId(null);
    setEventDraft(DEFAULT_EVENT_DRAFT);
    updateUploadName('event-draft', '');
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleSaveEvent = async () => {
    if (!eventDraft.title || !eventDraft.startDate || !eventDraft.endDate || !eventDraft.time) {
      setStatus('Please fill in title, start date, end date, and time.');
      return;
    }
    if (eventDraft.endDate < eventDraft.startDate) {
      setStatus('End date cannot be earlier than start date.');
      return;
    }
    if (eventDraft.requiresRegistration && !eventDraft.registrationEmail.trim()) {
      setStatus('Please enter the registration email for events that require registration.');
      return;
    }
    if (eventDraft.acceptsOnlinePayment && (!Number(eventDraft.paymentAmount) || Number(eventDraft.paymentAmount) <= 0)) {
      setStatus('Please enter the event payment amount.');
      return;
    }
    setStatus('');
    try {
      const response = await apiFetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...(selectedEventId && { id: selectedEventId }),
          title: eventDraft.title,
          date: eventDraft.startDate,
          startDate: eventDraft.startDate,
          endDate: eventDraft.endDate,
          time: eventDraft.time,
          location: eventDraft.location,
          description: eventDraft.description,
          imageUrl: eventDraft.image,
          requiresRegistration: eventDraft.requiresRegistration,
          registrationEmail: eventDraft.requiresRegistration ? eventDraft.registrationEmail.trim() : null,
          acceptsOnlinePayment: eventDraft.acceptsOnlinePayment,
          paymentAmount: eventDraft.acceptsOnlinePayment ? Number(eventDraft.paymentAmount) : null,
          paymentCurrency: eventDraft.acceptsOnlinePayment ? eventDraft.paymentCurrency : 'MWK',
          scope: eventDraft.scope,
        }),
      });
      if (!response.ok) {
        setStatus(selectedEventId ? 'Unable to update event.' : 'Unable to add event.');
        return;
      }
      if (!selectedEventId) {
        setEventDraft(DEFAULT_EVENT_DRAFT);
        updateUploadName('event-draft', '');
        setStatus('Event added.');
      } else {
        setStatus('Event updated.');
      }
      await refreshEvents();
    } catch {
      setStatus(selectedEventId ? 'Unable to update event.' : 'Unable to add event.');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    setStatus('');
    try {
      const response = await apiFetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        setStatus('Unable to delete event.');
        return;
      }
      await refreshEvents();
      setStatus('Event deleted.');
    } catch {
      setStatus('Unable to delete event.');
    }
  };

  const requestDeleteEvent = (eventId: string) => {
    const eventTitle = events.find((event) => event.id === eventId)?.title || eventDraft.title;
    confirmDeleteToast({
      title: 'Delete this event?',
      description: eventTitle || 'This event will be permanently removed.',
      onConfirm: () => handleDeleteEvent(eventId),
    });
  };

  if (!token) {
    return (
      <AdminLoginCard
        email={email}
        password={password}
        loginError={loginError}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">
            Admin
          </p>
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground">
            Events
          </h1>
          <p className="text-foreground/70 mt-3 max-w-2xl">
            Publish upcoming events and update visuals.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      {status && <p className="text-sm text-foreground/70">{status}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {selectedEventId ? 'Edit Event' : 'Add Event'}
              </h2>
              <p className="text-sm text-foreground/60">
                {selectedEventId
                  ? 'Update the selected event and save your changes.'
                  : 'Create a new event and publish it to the site.'}
              </p>
            </div>
            {selectedEventId && (
              <Button variant="outline" onClick={handleClearSelection}>
                Clear selection
              </Button>
            )}
          </div>

          <input
            type="text"
            placeholder="Event title"
            value={eventDraft.title}
            onChange={(event) => setEventDraft((prev) => ({ ...prev, title: event.target.value }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="grid gap-2 text-sm text-foreground/70">
              <span>Start date</span>
              <input
                type="date"
                value={eventDraft.startDate}
                onChange={(event) => setEventDraft((prev) => ({ ...prev, startDate: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                aria-label="Start date"
              />
            </label>
            <label className="grid gap-2 text-sm text-foreground/70">
              <span>End date</span>
              <input
                type="date"
                value={eventDraft.endDate}
                onChange={(event) => setEventDraft((prev) => ({ ...prev, endDate: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                aria-label="End date"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Time (e.g., 8:00 AM - 4:00 PM)"
              value={eventDraft.time}
              onChange={(event) => setEventDraft((prev) => ({ ...prev, time: event.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
            <select
              value={eventDraft.scope}
              onChange={(event) => setEventDraft((prev) => ({ ...prev, scope: event.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              aria-label="Event scope"
            >
              <option value="general">General</option>
              <option value="discipleship">Discipleship</option>
              <option value="hope-school">Hope School</option>
            </select>
            <input
              type="text"
              placeholder="Location"
              value={eventDraft.location}
              onChange={(event) => setEventDraft((prev) => ({ ...prev, location: event.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Upload Event Image <span className="text-[11px] font-normal text-foreground/50">(Max 1MB allowed)</span>
            </label>
            <input
              type="file"
              accept="image/*,.heic,.heif,.avif"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const url = await uploadImage(file);
                if (url) {
                  setEventDraft((prev) => ({ ...prev, image: normalizeEventImageUrl(url) }));
                  updateUploadName('event-draft', file.name);
                }
              }}
              className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
            />
          </div>
          {uploadNames['event-draft'] ? (
            <div>
              <Button
                variant="outline"
                onClick={() => {
                  setEventDraft((prev) => ({ ...prev, image: '' }));
                  updateUploadName('event-draft', '');
                }}
              >
                Remove Uploaded Image
              </Button>
            </div>
          ) : null}
          {eventDraft.image && (
            <div className="rounded-xl border border-border/60 bg-background p-3">
              <div className="relative h-32 overflow-hidden rounded-lg">
                <Image
                  src={eventDraft.image}
                  alt={eventDraft.title ? `${eventDraft.title} event image` : 'Current event image'}
                  fill
                  sizes="(max-width: 768px) 100vw, 520px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <p className="mt-2 text-xs text-foreground/60">
                {uploadNames['event-draft'] ? `Selected: ${uploadNames['event-draft']}` : 'Current image'}
              </p>
            </div>
          )}
          <textarea
            placeholder="Description"
            value={eventDraft.description}
            onChange={(event) => setEventDraft((prev) => ({ ...prev, description: event.target.value }))}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
          />
          <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={eventDraft.requiresRegistration}
              onChange={(event) =>
                setEventDraft((prev) => ({
                  ...prev,
                  requiresRegistration: event.target.checked,
                  registrationEmail: event.target.checked ? prev.registrationEmail : '',
                }))
              }
              className="h-4 w-4"
            />
            <span>This event requires registration</span>
          </label>
          {eventDraft.requiresRegistration ? (
            <input
              type="email"
              placeholder="Registration email recipient"
              value={eventDraft.registrationEmail}
              onChange={(event) => setEventDraft((prev) => ({ ...prev, registrationEmail: event.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
          ) : null}
          <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={eventDraft.acceptsOnlinePayment}
              onChange={(event) =>
                setEventDraft((prev) => ({
                  ...prev,
                  acceptsOnlinePayment: event.target.checked,
                  paymentAmount: event.target.checked ? prev.paymentAmount : '',
                  paymentCurrency: event.target.checked ? prev.paymentCurrency : 'MWK',
                }))
              }
              className="h-4 w-4"
            />
            <span>Allow users to pay for this event on the website</span>
          </label>
          {eventDraft.acceptsOnlinePayment ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[140px_1fr]">
              <select
                value={eventDraft.paymentCurrency}
                onChange={(event) => setEventDraft((prev) => ({ ...prev, paymentCurrency: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                aria-label="Event payment currency"
              >
                <option value="MWK">MWK</option>
                <option value="USD">USD</option>
              </select>
              <input
                type="number"
                min="1"
                step="any"
                placeholder="Event payment amount"
                value={eventDraft.paymentAmount}
                onChange={(event) => setEventDraft((prev) => ({ ...prev, paymentAmount: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSaveEvent}>
              {selectedEventId ? 'Save Event' : 'Add Event'}
            </Button>
            {selectedEventId && (
              <Button variant="outline" onClick={handleClearSelection}>
                Cancel
              </Button>
            )}
            {selectedEventId && (
              <Button variant="destructive" onClick={() => requestDeleteEvent(selectedEventId)}>
                Delete Event
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Current Events
          </h2>
          <div className="mb-4 space-y-2">
            <label htmlFor="event-search" className="sr-only">
              Search current events by title or date
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
                <input
                  id="event-search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder="Search by event name or date"
                  className="w-full rounded-xl border border-border/60 bg-background py-3 pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button variant="secondary" size="sm" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>
          {events.length === 0 ? (
            <p className="text-sm text-foreground/60">No events yet.</p>
          ) : filteredEvents.length === 0 ? (
            <p className="text-sm text-foreground/60">No events match your search.</p>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
              {filteredEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => handleSelectEvent(event)}
                  className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-left hover:border-primary/60 transition"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                    {formatEventDateLabel(event)}
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    {event.title || 'Untitled event'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
