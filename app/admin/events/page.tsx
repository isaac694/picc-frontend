'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useMediaUpload } from '@/hooks/use-media-upload';
import MediaUploadProgress from '@/components/admin/MediaUploadProgress';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import Image from 'next/image';
import EventFormBuilder from '@/components/events/EventFormBuilder';
import {
  EMPTY_EVENT_FORM_DRAFT,
  EVENT_MINISTRIES,
  draftToPayload,
  eventFormForApi,
  formToDraft,
  ensureRegistrationDraft,
  ministryNameForKey,
  parseEventForm,
  parseEventTickets,
  ticketsToDraft,
  type EventFormDraft,
  type EventFormSchema,
  type EventTicket,
  type EventTicketDraft,
} from '@/lib/event-forms';

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
  acceptsOnlinePayment: boolean;
  paymentAmount: string;
  paymentCurrency: string;
  tickets: EventTicket[];
  ministryKey: string;
  ministryName: string;
  registrationForm: EventFormSchema | null;
  paymentForm: EventFormSchema | null;
  isPublished: boolean;
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
  acceptsOnlinePayment: false,
  paymentAmount: '',
  paymentCurrency: 'MWK',
  tickets: [] as EventTicketDraft[],
  ministryKey: '',
  registrationForm: { ...EMPTY_EVENT_FORM_DRAFT, fields: [] } as EventFormDraft,
  paymentForm: { ...EMPTY_EVENT_FORM_DRAFT, fields: [] } as EventFormDraft,
};

const toIsoDateTime = (dateValue: string, timeValue = '') => {
  const date = dateValue.trim();
  if (!date) return '';
  if (date.includes('T')) {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? date : parsed.toISOString();
  }
  const clock = timeValue.trim().match(/^(\d{1,2}):(\d{2})/);
  if (clock) {
    const hours = clock[1].padStart(2, '0');
    const parsed = new Date(`${date}T${hours}:${clock[2]}:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return `${date}T00:00:00.000Z`;
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
  } = useAdminAuth();

  const [status, setStatus] = useState('');
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventDraft, setEventDraft] = useState(DEFAULT_EVENT_DRAFT);
  const [uploadNames, setUploadNames] = useState<Record<string, string>>({});
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [togglingEventId, setTogglingEventId] = useState<string | null>(null);
  const { runUpload, progress, uploading } = useMediaUpload();

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
      return (
        title.includes(query) ||
        event.ministryName.toLowerCase().includes(query) ||
        dateParts.some((part) => part.includes(query))
      );
    });
  }, [searchQuery, sortedEvents]);

  const uploadImage = async (file: File) => {
    if (file.size > 1024 * 1024) {
      setStatus('Your image file size is too big. Please compress it first before re uploading. Only pictures less than 1MB are allowed.');
      return null;
    }

    try {
      return await runUpload(file, 'events');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Image upload failed.');
      return null;
    }
  };

  const refreshEvents = useCallback(async () => {
    try {
      const response = await apiFetch('/api/admin/events?take=200', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
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
            acceptsOnlinePayment: Boolean(event.acceptsOnlinePayment),
            paymentAmount:
              typeof event.paymentAmount === 'number'
                ? String(event.paymentAmount)
                : typeof event.paymentAmount === 'string'
                  ? event.paymentAmount
                  : '',
            paymentCurrency: typeof event.paymentCurrency === 'string' ? event.paymentCurrency : 'MWK',
            tickets: parseEventTickets(event.tickets),
            ministryKey: typeof event.ministryKey === 'string' ? event.ministryKey : '',
            ministryName:
              typeof event.ministryName === 'string' && event.ministryName
                ? event.ministryName
                : ministryNameForKey(typeof event.ministryKey === 'string' ? event.ministryKey : ''),
            registrationForm: parseEventForm(event.registrationForm),
            paymentForm: parseEventForm(event.paymentForm),
            isPublished: event.isPublished !== false,
          };
        })
        .filter((event) => Boolean(event.id));

      setEvents((current) => {
        const incomingIds = new Set(normalized.map((event) => event.id));
        const keptInactive = current.filter((event) => !event.isPublished && !incomingIds.has(event.id));
        return [...normalized, ...keptInactive];
      });
    } catch {
      setEvents([]);
    }
  }, [token]);

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
      acceptsOnlinePayment: event.acceptsOnlinePayment,
      paymentAmount: event.tickets.length ? '' : event.paymentAmount,
      paymentCurrency: event.paymentCurrency,
      tickets: ticketsToDraft(event.tickets),
      ministryKey: event.ministryKey,
      registrationForm: ensureRegistrationDraft(formToDraft(event.registrationForm)),
      paymentForm: formToDraft(event.paymentForm),
    });
    updateUploadName('event-draft', '');
  };

  const handleClearSelection = () => {
    setSelectedEventId(null);
    setEventDraft(DEFAULT_EVENT_DRAFT);
    updateUploadName('event-draft', '');
  };

  const openAddDialog = () => {
    handleClearSelection();
    setDialogOpen(true);
  };

  const openEditDialog = (event: AdminEvent) => {
    handleSelectEvent(event);
    setDialogOpen(true);
  };

  const closeEventDialog = () => {
    setDialogOpen(false);
    handleClearSelection();
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleSaveEvent = async () => {
    if (!eventDraft.title.trim() || !eventDraft.startDate) {
      setStatus('Please fill in the event title and start date.');
      return;
    }
    if (eventDraft.endDate && eventDraft.endDate < eventDraft.startDate) {
      setStatus('End date cannot be earlier than start date.');
      return;
    }
    const ticketRows = eventDraft.tickets.filter((ticket) => ticket.name.trim() || ticket.price.trim());
    if (eventDraft.acceptsOnlinePayment && ticketRows.length === 0 && (!Number(eventDraft.paymentAmount) || Number(eventDraft.paymentAmount) <= 0)) {
      setStatus('Add a ticket type and price, or enter one payment amount.');
      return;
    }
    if (eventDraft.acceptsOnlinePayment) {
      for (const ticket of ticketRows) {
        if (!ticket.name.trim()) {
          setStatus('Each ticket type needs a name.');
          return;
        }
        if (!Number(ticket.price) || Number(ticket.price) <= 0) {
          setStatus(`Enter a price greater than 0 for ${ticket.name.trim()}.`);
          return;
        }
      }
    }
    if (!eventDraft.ministryKey) {
      setStatus('Please choose the ministry for this event.');
      return;
    }
    const registrationForm = eventDraft.requiresRegistration ? draftToPayload(eventDraft.registrationForm) : { form: null };
    if ('error' in registrationForm) {
      setStatus(registrationForm.error);
      return;
    }
    const paymentForm = eventDraft.acceptsOnlinePayment ? draftToPayload(eventDraft.paymentForm) : { form: null };
    if ('error' in paymentForm) {
      setStatus(paymentForm.error);
      return;
    }
    setStatus('');
    const payload = {
      title: eventDraft.title.trim(),
      startDate: toIsoDateTime(eventDraft.startDate, eventDraft.time),
      ...(eventDraft.endDate ? { endDate: toIsoDateTime(eventDraft.endDate) } : {}),
      ...(eventDraft.time.trim() ? { time: eventDraft.time.trim() } : {}),
      location: eventDraft.location.trim(),
      ...(eventDraft.description.trim() ? { description: eventDraft.description.trim() } : {}),
      ...(eventDraft.image ? { imageUrl: eventDraft.image } : {}),
      ministryKey: eventDraft.ministryKey,
      requiresRegistration: eventDraft.requiresRegistration,
      registrationForm: eventFormForApi(registrationForm.form),
      acceptsOnlinePayment: eventDraft.acceptsOnlinePayment,
      paymentAmount: eventDraft.acceptsOnlinePayment && ticketRows.length === 0 ? Number(eventDraft.paymentAmount) : null,
      paymentCurrency: eventDraft.acceptsOnlinePayment ? eventDraft.paymentCurrency : 'MWK',
      tickets: eventDraft.acceptsOnlinePayment
        ? ticketRows.map((ticket) => ({ name: ticket.name.trim(), price: Number(ticket.price) }))
        : [],
      paymentForm: eventFormForApi(paymentForm.form),
      isPublished: selectedEventId
        ? events.find((event) => event.id === selectedEventId)?.isPublished !== false
        : true,
    };
    try {
      const response = await apiFetch(selectedEventId ? `/api/events/${selectedEventId}` : '/api/events', {
        method: selectedEventId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setStatus(data?.error || (selectedEventId ? 'Unable to update event.' : 'Unable to add event.'));
        return;
      }
      if (!selectedEventId) {
        setStatus('Event added.');
      } else {
        setStatus('Event updated.');
      }
      setDialogOpen(false);
      handleClearSelection();
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
      if (selectedEventId === eventId) {
        setDialogOpen(false);
        handleClearSelection();
      }
      setStatus('Event deleted.');
    } catch {
      setStatus('Unable to delete event.');
    }
  };

  const handleTogglePublished = async (event: AdminEvent, isPublished: boolean) => {
    setStatus('');
    setTogglingEventId(event.id);
    try {
      const response = await apiFetch(isPublished ? `/api/events/${event.id}/activate` : `/api/events/${event.id}/deactivate`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setStatus(data?.error || (isPublished ? 'Unable to activate event.' : 'Unable to deactivate event.'));
        return;
      }
      setEvents((current) => current.map((item) => (item.id === event.id ? { ...item, isPublished } : item)));
      setStatus(isPublished ? 'Event activated.' : 'Event deactivated.');
      await refreshEvents();
    } catch {
      setStatus(isPublished ? 'Unable to activate event.' : 'Unable to deactivate event.');
    } finally {
      setTogglingEventId(null);
    }
  };

  const requestDeleteEvent = (eventId: string) => {
    const eventTitle = events.find((event) => event.id === eventId)?.title || eventDraft.title;
    confirmDeleteToast({
      title: 'Delete this event?',
      description: eventTitle || 'This event will be permanently removed.',
      onConfirm: () => void handleDeleteEvent(eventId),
    });
  };

  const eventFormFields = (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Event title"
        value={eventDraft.title}
        onChange={(event) => setEventDraft((prev) => ({ ...prev, title: event.target.value }))}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
      />
      <label className="grid gap-2 text-sm text-foreground/70">
        <span>Ministry</span>
        <select
          value={eventDraft.ministryKey}
          onChange={(event) => setEventDraft((prev) => ({ ...prev, ministryKey: event.target.value }))}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
          aria-label="Ministry"
        >
          <option value="">Select ministry</option>
          {EVENT_MINISTRIES.map((ministry) => (
            <option key={ministry.key} value={ministry.key}>
              {ministry.name}
            </option>
          ))}
        </select>
      </label>
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
        <input
          type="text"
          placeholder="Location"
          value={eventDraft.location}
          onChange={(event) => setEventDraft((prev) => ({ ...prev, location: event.target.value }))}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground md:col-span-2"
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
        <MediaUploadProgress uploading={uploading} progress={progress} className="mt-2" />
      </div>
      {uploadNames['event-draft'] ? (
        <div>
          <Button
            type="button"
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
      {eventDraft.image ? (
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
      ) : null}
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
              registrationForm: event.target.checked
                ? ensureRegistrationDraft(prev.registrationForm)
                : { ...EMPTY_EVENT_FORM_DRAFT, fields: [] },
            }))
          }
          className="h-4 w-4"
        />
        <span>This event requires registration</span>
      </label>
      {eventDraft.requiresRegistration ? (
        <EventFormBuilder
          heading="Registration form"
          draft={eventDraft.registrationForm}
          onChange={(registrationForm) => setEventDraft((prev) => ({ ...prev, registrationForm }))}
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
              tickets: event.target.checked ? prev.tickets : [],
              paymentForm: event.target.checked ? prev.paymentForm : { ...EMPTY_EVENT_FORM_DRAFT, fields: [] },
            }))
          }
          className="h-4 w-4"
        />
        <span>Allow users to pay for this event on the website</span>
      </label>
      {eventDraft.acceptsOnlinePayment ? (
        <div className="space-y-3">
          <div className="space-y-3 rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">Ticket types</p>
              <select
                value={eventDraft.paymentCurrency}
                onChange={(event) => setEventDraft((prev) => ({ ...prev, paymentCurrency: event.target.value }))}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                aria-label="Event payment currency"
              >
                <option value="MWK">MWK</option>
                <option value="USD">USD</option>
              </select>
            </div>
            {eventDraft.tickets.map((ticket) => (
              <div key={ticket.clientId} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_160px_auto]">
                <input
                  type="text"
                  placeholder="Ticket name"
                  value={ticket.name}
                  onChange={(event) =>
                    setEventDraft((prev) => ({
                      ...prev,
                      tickets: prev.tickets.map((row) =>
                        row.clientId === ticket.clientId ? { ...row, name: event.target.value } : row,
                      ),
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="Price"
                  value={ticket.price}
                  onChange={(event) =>
                    setEventDraft((prev) => ({
                      ...prev,
                      tickets: prev.tickets.map((row) =>
                        row.clientId === ticket.clientId ? { ...row, price: event.target.value } : row,
                      ),
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
                <button
                  type="button"
                  onClick={() =>
                    setEventDraft((prev) => ({
                      ...prev,
                      tickets: prev.tickets.filter((row) => row.clientId !== ticket.clientId),
                    }))
                  }
                  className="rounded-xl border border-border px-4 py-3 text-sm text-foreground"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setEventDraft((prev) => ({
                  ...prev,
                  tickets: [
                    ...prev.tickets,
                    { clientId: `ticket-${Date.now()}-${prev.tickets.length}`, name: '', price: '' },
                  ],
                }))
              }
              className="rounded-full border border-border px-4 py-2 text-sm text-foreground"
            >
              Add ticket type
            </button>
            {eventDraft.tickets.length === 0 ? (
              <input
                type="number"
                min="1"
                step="any"
                placeholder="One price for everyone"
                value={eventDraft.paymentAmount}
                onChange={(event) => setEventDraft((prev) => ({ ...prev, paymentAmount: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
            ) : (
              <p className="text-xs text-foreground/60">Each ticket is charged at its own price.</p>
            )}
          </div>
          <EventFormBuilder
            heading="Payment form"
            draft={eventDraft.paymentForm}
            onChange={(paymentForm) => setEventDraft((prev) => ({ ...prev, paymentForm }))}
          />
        </div>
      ) : null}
    </div>
  );

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
        <Button type="button" onClick={openAddDialog} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add event
        </Button>
      </div>

      {status ? <p className="text-sm text-foreground/70">{status}</p> : null}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) handleClearSelection();
        }}
      >
        <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-border/70 bg-muted/30 px-6 py-5">
            <DialogTitle>{selectedEventId ? 'Edit event' : 'Add event'}</DialogTitle>
            <DialogDescription>
              {selectedEventId
                ? 'Update the event details and save your changes.'
                : 'Create a new event and publish it to the site.'}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[min(60vh,520px)] overflow-y-auto px-6 py-5">{eventFormFields}</div>
          {status ? <p className="px-6 pb-2 text-sm text-destructive">{status}</p> : null}
          {status ? <p className="px-6 pt-3 text-sm text-red-600">{status}</p> : null}
          <DialogFooter className="border-t border-border/70 bg-muted/20 px-6 py-4 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={closeEventDialog}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSaveEvent()}>
              {selectedEventId ? 'Save changes' : 'Add event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-foreground/60">
                  <tr>
                    <th className="px-3 py-2 font-medium">Event</th>
                    <th className="px-3 py-2 font-medium">Ministry</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Location</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="border-t border-border/60 align-middle">
                      <td className="px-3 py-3 font-medium text-foreground">{event.title || 'Untitled event'}</td>
                      <td className="px-3 py-3 text-foreground/70">{event.ministryName || '—'}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-foreground/70">{formatEventDateLabel(event)}</td>
                      <td className="px-3 py-3 text-foreground/70">{event.location || '—'}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            event.isPublished ? 'bg-emerald-500/15 text-emerald-700' : 'bg-muted text-foreground/50'
                          }`}
                        >
                          {event.isPublished ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {event.isPublished ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={togglingEventId === event.id}
                              onClick={() => void handleTogglePublished(event, false)}
                            >
                              {togglingEventId === event.id ? 'Saving...' : 'Deactivate'}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={togglingEventId === event.id}
                              onClick={() => void handleTogglePublished(event, true)}
                            >
                              {togglingEventId === event.id ? 'Saving...' : 'Activate'}
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label={`Edit ${event.title || 'event'}`}
                            onClick={() => openEditDialog(event)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            aria-label={`Delete ${event.title || 'event'}`}
                            onClick={() => requestDeleteEvent(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
