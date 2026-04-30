'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';

type EventScope = 'general' | 'discipleship' | 'hope-school';

type AdminEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  image: string;
  scope: EventScope;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeScope = (value: unknown): EventScope => {
  const normalized = String(value ?? 'general').toLowerCase().replace(/_/g, '-');
  if (normalized === 'discipleship') return 'discipleship';
  if (normalized === 'hope-school' || normalized === 'hopeschool') return 'hope-school';
  return 'general';
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
  const [eventDraft, setEventDraft] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    time: '',
    location: '',
    description: '',
    image: '',
    scope: 'general' as EventScope,
  });
  const [uploadNames, setUploadNames] = useState<Record<string, string>>({});

  const updateUploadName = (key: string, name: string) => {
    setUploadNames((prev) => ({ ...prev, [key]: name }));
  };

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
        .map((event) => ({
          id: typeof event.id === 'string' ? event.id : String(event.id ?? ''),
          title: typeof event.title === 'string' ? event.title : '',
          date: event.date ? String(event.date).slice(0, 10) : '',
          time: typeof event.time === 'string' ? event.time : '',
          location: typeof event.location === 'string' ? event.location : '',
          description: typeof event.description === 'string' ? event.description : '',
          image:
            typeof event.image === 'string'
              ? event.image
              : typeof event.imageUrl === 'string'
                ? event.imageUrl
                : '',
          scope: normalizeScope(event.scope),
        }))
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

  const handleAddEvent = async () => {
    if (!eventDraft.title || !eventDraft.date || !eventDraft.time) {
      setStatus('Please fill in title, date, and time.');
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
          title: eventDraft.title,
          date: eventDraft.date,
          time: eventDraft.time,
          location: eventDraft.location,
          description: eventDraft.description,
          imageUrl: eventDraft.image,
          scope: eventDraft.scope,
        }),
      });
      if (!response.ok) {
        setStatus('Unable to add event.');
        return;
      }
      setEventDraft({
        title: '',
        date: new Date().toISOString().slice(0, 10),
        time: '',
        location: '',
        description: '',
        image: '',
        scope: 'general',
      });
      updateUploadName('event-draft', '');
      await refreshEvents();
      setStatus('Event added.');
    } catch {
      setStatus('Unable to add event.');
    }
  };

  const handleUpdateEvent = async (event: AdminEvent) => {
    setStatus('');
    try {
      const response = await apiFetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: event.title,
          date: event.date,
          time: event.time,
          location: event.location,
          description: event.description,
          imageUrl: event.image,
          scope: event.scope,
        }),
      });
      if (!response.ok) {
        setStatus('Unable to update event.');
        return;
      }
      await refreshEvents();
      setStatus('Event updated.');
    } catch {
      setStatus('Unable to update event.');
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
          <h2 className="text-lg font-semibold text-foreground">
            Add Event
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Event title"
              value={eventDraft.title}
              onChange={(event) => setEventDraft((prev) => ({ ...prev, title: event.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
            <input
              type="date"
              value={eventDraft.date}
              onChange={(event) => setEventDraft((prev) => ({ ...prev, date: event.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
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
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const url = await uploadImage(file);
                if (url) {
                  setEventDraft((prev) => ({ ...prev, image: url }));
                  updateUploadName('event-draft', file.name);
                }
              }}
              className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
            />
          </div>
          <div>
            <Button
              variant="outline"
              onClick={() => {
                setEventDraft((prev) => ({ ...prev, image: '' }));
                updateUploadName('event-draft', '');
              }}
            >
              Remove Event Image
            </Button>
          </div>
          {eventDraft.image && (
            <div className="rounded-xl border border-border/60 bg-background p-3">
              <div
                className="h-32 rounded-lg bg-cover bg-center"
                style={{ backgroundImage: `url(${eventDraft.image})` }}
              />
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
          <Button onClick={handleAddEvent}>Add Event</Button>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Current Events
          </h2>
          {events.length === 0 ? (
            <p className="text-sm text-foreground/60">No events yet.</p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="rounded-xl border border-border/60 bg-background p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={event.title || ''}
                      onChange={(e) =>
                        setEvents((prev) =>
                          prev.map((item) => (item.id === event.id ? { ...item, title: e.target.value } : item))
                        )
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                    />
                    <input
                      type="date"
                      value={event.date || ''}
                      onChange={(e) =>
                        setEvents((prev) =>
                          prev.map((item) => (item.id === event.id ? { ...item, date: e.target.value } : item))
                        )
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Time (e.g., 8:00 AM - 4:00 PM)"
                      value={event.time || ''}
                      onChange={(e) =>
                        setEvents((prev) =>
                          prev.map((item) => (item.id === event.id ? { ...item, time: e.target.value } : item))
                        )
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                    />
                    <select
                      value={event.scope || 'general'}
                      onChange={(e) =>
                        setEvents((prev) =>
                          prev.map((item) =>
                            item.id === event.id ? { ...item, scope: e.target.value } : item
                          )
                        )
                      }
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
                      value={event.location || ''}
                      onChange={(e) =>
                        setEvents((prev) =>
                          prev.map((item) => (item.id === event.id ? { ...item, location: e.target.value } : item))
                        )
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.25em] text-foreground/50 mb-2">
                      Upload Image <span className="text-[10px] font-normal lowercase tracking-normal">(Max 1MB allowed)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = await uploadImage(file);
                        if (!url) return;
                        setEvents((prev) =>
                          prev.map((item) => (item.id === event.id ? { ...item, image: url } : item))
                        );
                        updateUploadName(`event-${event.id}`, file.name);
                      }}
                      className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                    />
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEvents((prev) =>
                          prev.map((item) => (item.id === event.id ? { ...item, image: '' } : item))
                        );
                        updateUploadName(`event-${event.id}`, '');
                      }}
                    >
                      Remove Event Image
                    </Button>
                  </div>
                  {event.image && (
                    <div className="rounded-xl border border-border/60 bg-background p-3">
                      <div
                        className="h-28 rounded-lg bg-cover bg-center"
                        style={{ backgroundImage: `url(${event.image})` }}
                      />
                      <p className="mt-2 text-xs text-foreground/60">
                        {uploadNames[`event-${event.id}`]
                          ? `Selected: ${uploadNames[`event-${event.id}`]}`
                          : 'Current image'}
                      </p>
                    </div>
                  )}
                  <textarea
                    value={event.description || ''}
                    onChange={(e) =>
                      setEvents((prev) =>
                        prev.map((item) => (item.id === event.id ? { ...item, description: e.target.value } : item))
                      )
                    }
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => handleUpdateEvent(event)}>Update</Button>
                    <Button variant="outline" onClick={() => handleDeleteEvent(event.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
