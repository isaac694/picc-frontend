'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import { apiFetch, apiUrl } from '@/lib/api';
import { useMediaUpload } from '@/hooks/use-media-upload';
import MediaUploadProgress from '@/components/admin/MediaUploadProgress';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import type { NewsSectionItem } from '@/components/NewsSection';

type EditableNewsItem = {
  id: string;
  badge: string;
  date: string;
  title: string;
  description: string;
  imageUrl: string;
};

const emptyDraft: Omit<EditableNewsItem, 'id'> = {
  badge: '',
  date: '',
  title: '',
  description: '',
  imageUrl: '',
};

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `news-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const toPreviewUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  return trimmed;
};

const parseItems = (body: unknown): unknown[] => {
  if (typeof body !== 'string' || !body) return [];
  try {
    const parsed = JSON.parse(body) as unknown;
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { items?: unknown[] }).items)) {
      return (parsed as { items: unknown[] }).items;
    }
  } catch {
    return [];
  }
  return [];
};

export default function SiteNewsManager({
  token,
  contentKey,
  title,
  description,
  fallbackItems,
  imageHelpText = 'Use existing ministry news photos or upload a replacement image.',
  imagePlaceholder = '/ministries/youth-church/news-1.JPG',
  maxItems,
}: {
  token: string;
  contentKey: string;
  title: string;
  description: string;
  fallbackItems: NewsSectionItem[];
  imageHelpText?: string;
  imagePlaceholder?: string;
  maxItems?: number;
}) {
  const fallbackNews = useMemo<EditableNewsItem[]>(
    () =>
      fallbackItems.map((item, index) => ({
        id: `fallback-news-${index}`,
        badge: item.badge,
        date: item.date,
        title: item.title,
        description: item.description,
        imageUrl: item.image,
      })),
    [fallbackItems],
  );
  const [items, setItems] = useState<EditableNewsItem[]>(fallbackNews);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { runUpload, progress, uploading } = useMediaUpload();

  const resetDraft = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setUploadName('');
  };

  const closeDialog = () => {
    setDialogOpen(false);
    resetDraft();
  };

  const openAddDialog = () => {
    if (typeof maxItems === 'number' && items.length >= maxItems) {
      setStatus(`Only ${maxItems} news items can be shown on this page. Delete one before adding another.`);
      return;
    }
    resetDraft();
    setStatus('');
    setDialogOpen(true);
  };

  const openEditDialog = (item: EditableNewsItem) => {
    edit(item);
    setStatus('');
    setDialogOpen(true);
  };

  const saveAll = async (nextItems: EditableNewsItem[]) => {
    if (typeof maxItems === 'number' && nextItems.length > maxItems) {
      setStatus(`Only ${maxItems} news items can be shown on this page. Delete one before adding another.`);
      return false;
    }

    const response = await apiFetch(`/api/site-content/${contentKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ body: JSON.stringify({ items: nextItems }) }),
    });
    return response.ok;
  };

  const refresh = async () => {
    setIsLoading(true);
    setStatus('');
    try {
      const response = await apiFetch(`/api/site-content/${contentKey}`);
      if (response.status === 404) {
        setItems(fallbackNews);
        return;
      }
      if (!response.ok) {
        setStatus('Unable to load news.');
        setItems(fallbackNews);
        return;
      }
      const record = await response.json().catch(() => null);
      const loaded = parseItems(record?.body)
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map((item, index) => ({
          id: typeof item.id === 'string' ? item.id : `news-${index}`,
          badge: typeof item.badge === 'string' ? item.badge : '',
          date: typeof item.date === 'string' ? item.date : '',
          title: typeof item.title === 'string' ? item.title : '',
          description: typeof item.description === 'string' ? item.description : '',
          imageUrl:
            typeof item.imageUrl === 'string'
              ? item.imageUrl
              : typeof item.image === 'string'
                ? item.image
                : '',
        }));
      const nextItems = loaded.length > 0 ? loaded : fallbackNews;
      setItems(typeof maxItems === 'number' ? nextItems.slice(0, maxItems) : nextItems);
    } catch {
      setStatus('Unable to load news.');
      setItems(fallbackNews);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey, token, fallbackNews]);

  const edit = (item: EditableNewsItem) => {
    setEditingId(item.id);
    setDraft({
      badge: item.badge,
      date: item.date,
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
    });
    setUploadName('');
  };

  const save = async () => {
    if (!editingId && typeof maxItems === 'number' && items.length >= maxItems) {
      setStatus(`Only ${maxItems} news items can be shown on this page. Delete one before adding another.`);
      return;
    }
    if (!draft.title.trim()) {
      setStatus('Please add a news title.');
      return;
    }
    if (!draft.imageUrl.trim()) {
      setStatus('Please add a news image.');
      return;
    }

    setSaving(true);
    setStatus('');
    const wasEdit = Boolean(editingId && !editingId.startsWith('fallback-'));
    const nextItem: EditableNewsItem = {
      id: editingId && !editingId.startsWith('fallback-') ? editingId : newId(),
      ...draft,
      badge: draft.badge.trim() || 'Update',
      date: draft.date.trim(),
      title: draft.title.trim(),
      description: draft.description.trim(),
      imageUrl: draft.imageUrl.trim(),
    };
    const nextItems =
      editingId && !editingId.startsWith('fallback-')
        ? items.map((item) => (item.id === editingId ? nextItem : item))
        : [...items.filter((item) => item.id !== editingId), nextItem];

    try {
      const ok = await saveAll(nextItems);
      if (!ok) {
        setStatus(wasEdit ? 'Unable to update news.' : 'Unable to add news.');
        return;
      }
      setItems(nextItems);
      closeDialog();
      setStatus(wasEdit ? 'News updated.' : 'News added.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: EditableNewsItem) => {
    const nextItems = items.filter((existing) => existing.id !== item.id);
    const ok = await saveAll(nextItems);
    if (!ok) {
      setStatus('Unable to delete news.');
      return;
    }
    setItems(nextItems);
    if (editingId === item.id) closeDialog();
    setStatus('News deleted.');
  };

  const requestRemove = (item: EditableNewsItem) => {
    confirmDeleteToast({
      title: 'Delete this news item?',
      description: item.title,
      onConfirm: () => remove(item),
    });
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const limitReached = typeof maxItems === 'number' && items.length >= maxItems;

  const newsFormFields = (
    <div className="space-y-5">
          <p className="text-sm text-foreground/60">{imageHelpText}</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[0.8fr_1fr_1.4fr]">
            <input
              type="text"
              placeholder="Badge"
              value={draft.badge}
              onChange={(event) => setDraft((prev) => ({ ...prev, badge: event.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
            <input
              type="text"
              placeholder="Date, e.g. June 2026"
              value={draft.date}
              onChange={(event) => setDraft((prev) => ({ ...prev, date: event.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
            <input
              type="text"
              placeholder="Headline"
              value={draft.title}
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
          </div>
          <textarea
            value={draft.description}
            onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
            rows={5}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            placeholder="Write a short summary for this news item."
          />
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Image path or upload</label>
              <input
                type="text"
                value={draft.imageUrl}
                onChange={(event) => setDraft((prev) => ({ ...prev, imageUrl: event.target.value }))}
                placeholder={imagePlaceholder}
                className="mb-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
              <input
                type="file"
                accept="image/*,.heic,.heif,.avif"
                onChange={async (event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = '';
                  if (!file) return;
                  if (file.size > 1_000_000) {
                    setStatus('Your image file size is too big. Please compress it first before re uploading. Only pictures less than 1MB are allowed.');
                    return;
                  }
                  try {
                    const url = await runUpload(file, 'news');
                    setDraft((prev) => ({ ...prev, imageUrl: url }));
                    setUploadName(file.name);
                    setStatus('');
                  } catch (error) {
                    setStatus(error instanceof Error ? error.message : 'Image upload failed.');
                  }
                }}
                className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
              />
              {uploadName ? <p className="mt-2 text-xs text-foreground/60">Selected: {uploadName}</p> : null}
              <MediaUploadProgress uploading={uploading} progress={progress} className="mt-2" />
            </div>
            <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
              {draft.imageUrl ? (
                <div className="relative h-40">
                  <Image src={toPreviewUrl(draft.imageUrl)} alt={draft.title || 'News preview'} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-foreground/50">No image selected</div>
              )}
            </div>
          </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-foreground/70">{description}</p>
          {typeof maxItems === 'number' ? (
            <p className={`mt-2 text-xs font-semibold ${limitReached ? 'text-destructive' : 'text-primary'}`}>
              {Math.min(items.length, maxItems)} / {maxItems} news items used.{' '}
              {limitReached ? 'Delete one before adding another.' : `Up to ${maxItems} news items can be shown.`}
            </p>
          ) : null}
        </div>
        <Button type="button" onClick={openAddDialog} disabled={limitReached} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Add news
        </Button>
      </div>
      {status ? (
        <div
          className={`rounded-xl p-4 text-sm ${status.includes('Unable') || status.includes('Please') || status.includes('Only') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}
        >
          {status}
        </div>
      ) : null}

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetDraft();
        }}
        title={editingId ? 'Edit news item' : 'Add news item'}
        description={imageHelpText}
        saving={saving}
        saveLabel={editingId ? 'Save changes' : 'Add news'}
        onSave={() => void save()}
        onCancel={closeDialog}
        maxWidthClass="sm:max-w-2xl"
      >
        {newsFormFields}
      </SchoolAdminDialogShell>

      <div className="max-h-[780px] overflow-auto rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-foreground">Current news</h3>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-foreground/60">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-border/60 align-top">
                <td className="whitespace-nowrap px-3 py-2 text-foreground/70">
                  {[item.badge, item.date].filter(Boolean).join(' - ') || 'News item'}
                </td>
                <td className="px-3 py-2">
                  <p className="font-medium text-foreground">{item.title || 'Untitled news item'}</p>
                  {item.description ? <p className="mt-1 line-clamp-2 text-foreground/60">{item.description}</p> : null}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Edit ${item.title || 'news item'}`}
                      onClick={() => openEditDialog(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Delete ${item.title || 'news item'}`}
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
    </div>
  );
}
