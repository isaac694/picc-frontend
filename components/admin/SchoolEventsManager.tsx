'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

type EventItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  createdAt: string;
};

type Draft = {
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl: string;
  isPublished: boolean;
};

export default function SchoolEventsManager({
  token,
  schoolKey,
}: {
  token: string;
  schoolKey: string;
  schoolName: string;
}) {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<EventItem | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [draft, setDraft] = useState<Draft>({
    title: '',
    description: '',
    date: '',
    location: '',
    imageUrl: '',
    isPublished: true,
  });

  const baseUrl = useMemo(() => `/api/admin/schools/${encodeURIComponent(schoolKey)}/events`, [schoolKey]);

  const refresh = async () => {
    setIsLoading(true);
    setStatus('');
    try {
      const response = await apiFetch(baseUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setEvents([]);
        setStatus('Unable to load events.');
        return;
      }
      const data = await response.json().catch(() => ({}));
      setEvents(Array.isArray(data?.events) ? data.events : []);
    } catch {
      setEvents([]);
      setStatus('Unable to load events.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, token]);

  const handleEdit = (item: EventItem) => {
    setEditingItem(item);
    setUploadName('');
    // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
    const date = new Date(item.date);
    const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setDraft({
      title: item.title,
      description: item.description,
      date: formattedDate,
      location: item.location || '',
      imageUrl: item.imageUrl || '',
      isPublished: item.isPublished,
    });
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setUploadName('');
    setDraft({
      title: '',
      description: '',
      date: '',
      location: '',
      imageUrl: '',
      isPublished: true,
    });
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatus('Please upload an image file.');
      return null;
    }

    if (file.size > 1_000_000) {
      setStatus('Your image file size is too big. Please compress it first before re uploading. Only pictures less than 1MB are allowed.');
      return null;
    }

    setStatus('');
    setUploadName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiFetch('/api/uploads', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setStatus('Image upload failed.');
        return null;
      }

      const data = await response.json().catch(() => null);
      const rawUrl = typeof data?.url === 'string' ? data.url : typeof data?.imageUrl === 'string' ? data.imageUrl : '';

      if (!rawUrl) {
        setStatus('Image upload failed.');
        return null;
      }

      return rawUrl.startsWith('http') ? rawUrl : apiUrl(rawUrl);
    } catch {
      setStatus('Image upload failed.');
      return null;
    }
  };

  const save = async () => {
    if (!draft.title.trim()) {
      setStatus('Please enter a title.');
      return;
    }
    if (!draft.description.trim()) {
      setStatus('Please enter a description.');
      return;
    }
    if (!draft.date) {
      setStatus('Please select a date.');
      return;
    }

    setSavingId(editingItem ? editingItem.id : 'new');
    setStatus('');
    
    try {
      const url = editingItem ? `${baseUrl}/${encodeURIComponent(editingItem.id)}` : baseUrl;
      const method = editingItem ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: draft.title.trim(),
          description: draft.description.trim(),
          date: new Date(draft.date).toISOString(),
          location: draft.location.trim() || null,
          imageUrl: draft.imageUrl.trim() || null,
          isPublished: draft.isPublished,
        }),
      });

      if (!response.ok) {
        setStatus(`Unable to ${editingItem ? 'update' : 'add'} event.`);
        return;
      }

      setDraft({ title: '', description: '', date: '', location: '', imageUrl: '', isPublished: true });
      setUploadName('');
      setEditingItem(null);
      
      await refresh();
      setStatus(`Event ${editingItem ? 'updated' : 'added'}.`);
    } catch {
      setStatus(`Unable to ${editingItem ? 'update' : 'add'} event.`);
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (id: string) => {
    setStatus('');
    try {
      const response = await apiFetch(`${baseUrl}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok && response.status !== 204) {
        setStatus('Unable to delete event.');
        return;
      }
      
      if (editingItem?.id === id) {
        handleAddNew();
      }
      
      await refresh();
      setStatus('Event deleted.');
    } catch {
      setStatus('Unable to delete event.');
    }
  };

  const requestRemove = (item: EventItem) => {
    const toastId = toast('Delete this event?', {
      description: item.title,
      duration: Infinity,
      action: {
        label: 'Delete',
        onClick: () => {
          toast.dismiss(toastId);
          void remove(item.id);
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => toast.dismiss(toastId),
      },
    });
  };

  const filteredEvents = useMemo(() => {
    if (!searchTerm.trim()) return events;
    const lower = searchTerm.toLowerCase();
    return events.filter(e => 
      e.title.toLowerCase().includes(lower) || 
      e.description.toLowerCase().includes(lower) ||
      (e.location || '').toLowerCase().includes(lower)
    );
  }, [events, searchTerm]);

  if (isLoading && events.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {status && (
        <div
          className={`p-4 rounded-xl text-sm ${
            status.includes('Unable') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          }`}
        >
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
        {/* Left Side: Form */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {editingItem ? 'Update Event' : 'Add New Event'}
              </h2>
              <p className="text-sm text-foreground/70 mt-1">
                {editingItem ? 'Update the details for this event.' : 'Create a new event entry for your school.'}
              </p>
            </div>
            {editingItem && (
              <Button variant="outline" onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
                Title *
              </label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Event title"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
                Description *
              </label>
              <textarea
                value={draft.description}
                onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Event description..."
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={draft.date}
                  onChange={(e) => setDraft((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
                  Location
                </label>
                <input
                  type="text"
                  value={draft.location}
                  onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Event location"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
                Event Image <span className="text-[11px] font-normal text-foreground/50">(Max 1MB allowed)</span>
              </label>
              <input
                type="file"
                accept="image/*,.heic,.heif,.avif"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
                onChange={async (e) => {
                  const input = e.currentTarget;
                  const file = input.files?.[0];
                  if (!file) return;
                  const url = await uploadImage(file);
                  if (url) {
                    setDraft((prev) => ({ ...prev, imageUrl: url }));
                  }
                  input.value = '';
                }}
              />
              {uploadName && (
                <p className="mt-2 text-xs text-foreground/60">Selected: {uploadName}</p>
              )}
              {draft.imageUrl && (
                <div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-background">
                  <div className="relative h-40">
                    <Image
                      src={draft.imageUrl}
                      alt={draft.title || 'Event preview'}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <p className="break-all px-3 py-2 text-xs text-foreground/50">Current image: {draft.imageUrl}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-background/50">
              <input
                type="checkbox"
                id="isPublished"
                checked={draft.isPublished}
                onChange={(e) => setDraft((prev) => ({ ...prev, isPublished: e.target.checked }))}
                className="rounded border-border"
              />
              <label htmlFor="isPublished" className="text-sm font-medium text-foreground cursor-pointer">
                Published (Visible on site)
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border/60">
              <Button onClick={save} disabled={savingId !== null} className="gap-2">
                {savingId !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingItem ? 'Update Event' : 'Add Event'}
              </Button>
              {editingItem && (
                <Button variant="destructive" onClick={() => requestRemove(editingItem)} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
              {(editingItem || draft.title || draft.description) && (
                <Button variant="outline" onClick={handleAddNew}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: List */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm flex flex-col h-fit max-h-[800px]">
          <h2 className="text-lg font-semibold text-foreground mb-4">Current Events</h2>
          
          <div className="relative mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search events..."
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 transition outline-none"
            />
          </div>

          <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl border-border/60">
                <p className="text-sm text-foreground/60">
                  {searchTerm ? 'No events match your search.' : 'No events yet.'}
                </p>
              </div>
            ) : (
              filteredEvents.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleEdit(item)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    editingItem?.id === item.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border/60 bg-background hover:border-primary/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">{item.title}</h3>
                    {!item.isPublished && (
                      <span className="text-[10px] uppercase font-bold text-destructive px-1.5 py-0.5 rounded bg-destructive/10">
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] text-primary font-bold uppercase tracking-wider">
                      {new Date(item.date).toLocaleDateString()} @ {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {item.location && <p className="text-[10px] text-foreground/50 italic">📍 {item.location}</p>}
                    <p className="text-xs text-foreground/60 line-clamp-2 mt-1">{item.description}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
