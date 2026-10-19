'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useMediaUpload } from '@/hooks/use-media-upload';
import MediaUploadProgress from '@/components/admin/MediaUploadProgress';
import { Button } from '@/components/ui/button';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { SchoolAdminDialogShell, SchoolAdminStatusBanner } from '@/components/admin/school-admin-dialog-shell';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';

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

const EMPTY_DRAFT: Draft = {
  title: '',
  description: '',
  date: '',
  location: '',
  imageUrl: '',
  isPublished: true,
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
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<EventItem | null>(null);
  const [uploadName, setUploadName] = useState('');
  const { runUpload, progress, uploading } = useMediaUpload();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial list fetch
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, token]);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setUploadName('');
    setDraft(EMPTY_DRAFT);
  };

  const openAddDialog = () => {
    setEditingItem(null);
    setUploadName('');
    setDraft(EMPTY_DRAFT);
    setDialogOpen(true);
  };

  const openEditDialog = (item: EventItem) => {
    setEditingItem(item);
    setUploadName('');
    const date = new Date(item.date);
    const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setDraft({
      title: item.title,
      description: item.description,
      date: formattedDate,
      location: item.location || '',
      imageUrl: item.imageUrl || '',
      isPublished: item.isPublished,
    });
    setDialogOpen(true);
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatus('Please upload an image file.');
      return null;
    }
    if (file.size > 1_000_000) {
      setStatus(
        'Your image file size is too big. Please compress it first before re uploading. Only pictures less than 1MB are allowed.',
      );
      return null;
    }
    setStatus('');
    setUploadName(file.name);
    try {
      return await runUpload(file, 'school');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Image upload failed.');
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

    setSaving(true);
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

      const wasEdit = Boolean(editingItem);
      closeDialog();
      await refresh();
      setStatus(`Event ${wasEdit ? 'updated' : 'added'}.`);
    } catch {
      setStatus(`Unable to ${editingItem ? 'update' : 'add'} event.`);
    } finally {
      setSaving(false);
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
      if (editingItem?.id === id) closeDialog();
      await refresh();
      setStatus('Event deleted.');
    } catch {
      setStatus('Unable to delete event.');
    }
  };

  const requestRemove = (item: EventItem) => {
    confirmDeleteToast({
      title: 'Delete this event?',
      description: item.title,
      onConfirm: () => void remove(item.id),
    });
  };

  const filteredEvents = useMemo(() => {
    if (!searchTerm.trim()) return events;
    const lower = searchTerm.toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(lower) ||
        e.description.toLowerCase().includes(lower) ||
        (e.location || '').toLowerCase().includes(lower),
    );
  }, [events, searchTerm]);

  const formFields = (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">Title *</label>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Event title"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">Description *</label>
        <textarea
          value={draft.description}
          onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Event description..."
          rows={4}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">Date & time *</label>
          <input
            type="datetime-local"
            value={draft.date}
            onChange={(e) => setDraft((prev) => ({ ...prev, date: e.target.value }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">Location</label>
          <input
            type="text"
            value={draft.location}
            onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
            placeholder="Event location"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
          Event image <span className="font-normal normal-case text-foreground/50">(max 1MB)</span>
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
            if (url) setDraft((prev) => ({ ...prev, imageUrl: url }));
            input.value = '';
          }}
        />
        {uploadName ? <p className="mt-2 text-xs text-foreground/60">Selected: {uploadName}</p> : null}
        <MediaUploadProgress uploading={uploading} progress={progress} className="mt-2" />
        {draft.imageUrl ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-background">
            <div className="relative h-40">
              <Image src={draft.imageUrl} alt={draft.title || 'Event preview'} fill className="object-cover" unoptimized />
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3">
        <input
          type="checkbox"
          id="event-isPublished"
          checked={draft.isPublished}
          onChange={(e) => setDraft((prev) => ({ ...prev, isPublished: e.target.checked }))}
          className="rounded border-border"
        />
        <label htmlFor="event-isPublished" className="cursor-pointer text-sm font-medium text-foreground">
          Published (visible on site)
        </label>
      </div>
    </div>
  );

  if (isLoading && events.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SchoolAdminStatusBanner status={status} />

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-foreground">Current events</h2>
          <Button type="button" className="gap-2 shrink-0" onClick={openAddDialog}>
            <Plus className="h-4 w-4" />
            Add event
          </Button>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search events..."
          className="mb-4 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/20"
        />

        {filteredEvents.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground/60">
            {searchTerm ? 'No events match your search.' : 'No events yet.'}
          </p>
        ) : (
          <div className="overflow-auto rounded-xl border border-border/70">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-foreground/60">
                <tr>
                  <th className="px-3 py-2 font-medium">Event</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Location</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((item) => (
                  <tr key={item.id} className="border-t border-border/60">
                    <td className="px-3 py-2 font-medium text-foreground">{item.title}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-foreground/70">
                      {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-2 text-foreground/70">{item.location || '—'}</td>
                    <td className="px-3 py-2 text-foreground/70">{item.isPublished ? 'Published' : 'Draft'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${item.title}`} onClick={() => openEditDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Delete ${item.title}`}
                          onClick={() => requestRemove(item)}
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

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingItem(null);
            setUploadName('');
            setDraft(EMPTY_DRAFT);
          }
        }}
        title={editingItem ? 'Edit event' : 'Add event'}
        description={editingItem ? 'Update this school event.' : 'Create a new event for your school.'}
        saving={saving}
        saveLabel={editingItem ? 'Save changes' : 'Add event'}
        onSave={() => void save()}
        onCancel={closeDialog}
        maxWidthClass="sm:max-w-2xl"
      >
        {formFields}
      </SchoolAdminDialogShell>
    </div>
  );
}
