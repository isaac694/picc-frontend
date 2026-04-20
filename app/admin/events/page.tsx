'use client';

import { useEffect, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';

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
  const [events, setEvents] = useState<any[]>([]);
  const [eventDraft, setEventDraft] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    location: '',
    description: '',
    imageUrl: '',
  });
  const [uploadNames, setUploadNames] = useState<Record<string, string>>({});

  const updateUploadName = (key: string, name: string) => {
    setUploadNames((prev) => ({ ...prev, [key]: name }));
  };

  const uploadImage = async (file: File) => {
    if (!token) return null;
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
      return apiUrl(data.url);
    } catch (error) {
      setStatus('Image upload failed.');
      return null;
    }
  };

  const refreshEvents = async () => {
    try {
      const response = await apiFetch('/api/events?take=200');
      if (!response.ok) return;
      const data = await response.json();
      const normalized = (data.events || []).map((event: any) => ({
        ...event,
        date: event.date ? String(event.date).slice(0, 10) : '',
        imageUrl: event.imageUrl
          ? event.imageUrl.startsWith('http')
            ? event.imageUrl
            : apiUrl(event.imageUrl)
          : '',
      }));
      setEvents(normalized);
    } catch (error) {
      setEvents([]);
    }
  };

  useEffect(() => {
    if (!token) return;
    refreshEvents();
  }, [token]);

  const handleAddEvent = async () => {
    if (!eventDraft.title || !eventDraft.date) {
      setStatus('Please fill event title and date.');
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
          location: eventDraft.location,
          description: eventDraft.description,
          imageUrl: eventDraft.imageUrl,
        }),
      });
      if (!response.ok) {
        setStatus('Unable to add event.');
        return;
      }
      setEventDraft({
        title: '',
        date: new Date().toISOString().slice(0, 10),
        location: '',
        description: '',
        imageUrl: '',
      });
      updateUploadName('event-draft', '');
      await refreshEvents();
      setStatus('Event added.');
    } catch (error) {
      setStatus('Unable to add event.');
    }
  };

  const handleUpdateEvent = async (event: any) => {
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
          location: event.location,
          description: event.description,
          imageUrl: event.imageUrl,
        }),
      });
      if (!response.ok) {
        setStatus('Unable to update event.');
        return;
      }
      await refreshEvents();
      setStatus('Event updated.');
    } catch (error) {
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
    } catch (error) {
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
          <input
            type="text"
            placeholder="Location"
            value={eventDraft.location}
            onChange={(event) => setEventDraft((prev) => ({ ...prev, location: event.target.value }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Upload Event Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const url = await uploadImage(file);
                if (url) {
                  setEventDraft((prev) => ({ ...prev, imageUrl: url }));
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
                setEventDraft((prev) => ({ ...prev, imageUrl: '' }));
                updateUploadName('event-draft', '');
              }}
            >
              Remove Event Image
            </Button>
          </div>
          {eventDraft.imageUrl && (
            <div className="rounded-xl border border-border/60 bg-background p-3">
              <div
                className="h-32 rounded-lg bg-cover bg-center"
                style={{ backgroundImage: `url(${eventDraft.imageUrl})` }}
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
                  <input
                    type="text"
                    value={event.location || ''}
                    onChange={(e) =>
                      setEvents((prev) =>
                        prev.map((item) => (item.id === event.id ? { ...item, location: e.target.value } : item))
                      )
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                  <div>
                    <label className="block text-xs uppercase tracking-[0.25em] text-foreground/50 mb-2">
                      Upload Image
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
                          prev.map((item) => (item.id === event.id ? { ...item, imageUrl: url } : item))
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
                          prev.map((item) => (item.id === event.id ? { ...item, imageUrl: '' } : item))
                        );
                        updateUploadName(`event-${event.id}`, '');
                      }}
                    >
                      Remove Event Image
                    </Button>
                  </div>
                  {event.imageUrl && (
                    <div className="rounded-xl border border-border/60 bg-background p-3">
                      <div
                        className="h-28 rounded-lg bg-cover bg-center"
                        style={{ backgroundImage: `url(${event.imageUrl})` }}
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
