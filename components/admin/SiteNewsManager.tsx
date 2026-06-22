'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetch, apiUrl } from '@/lib/api';
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

async function uploadImage(token: string, file: File, setStatus: (value: string) => void) {
  if (!file.type.startsWith('image/')) {
    setStatus('Please upload an image file.');
    return null;
  }

  if (file.size > 1_000_000) {
    setStatus('Your image file size is too big. Please compress it first before re uploading. Only pictures less than 1MB are allowed.');
    return null;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiFetch('/api/uploads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      setStatus('Image upload failed.');
      return null;
    }

    const data = await response.json().catch(() => null);
    return typeof data?.url === 'string' ? data.url : null;
  } catch {
    setStatus('Image upload failed.');
    return null;
  }
}

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

  const resetDraft = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setUploadName('');
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

    setStatus('');
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

    const ok = await saveAll(nextItems);
    if (!ok) {
      setStatus(editingId ? 'Unable to update news.' : 'Unable to add news.');
      return;
    }
    setItems(nextItems);
    resetDraft();
    setStatus(editingId ? 'News updated.' : 'News added.');
  };

  const remove = async (item: EditableNewsItem) => {
    const nextItems = items.filter((existing) => existing.id !== item.id);
    const ok = await saveAll(nextItems);
    if (!ok) {
      setStatus('Unable to delete news.');
      return;
    }
    setItems(nextItems);
    if (editingId === item.id) resetDraft();
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-foreground/70">{description}</p>
      </div>
      {status ? (
        <div className={`rounded-xl p-4 text-sm ${status.includes('Unable') || status.includes('Please') || status.includes('Only') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          {status}
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
                  <h3 className="text-lg font-semibold text-foreground">{editingId ? 'Edit News Item' : 'Create News Item'}</h3>
                  <p className="text-sm text-foreground/60">{imageHelpText}</p>
                  {typeof maxItems === 'number' ? (
                    <p className={`mt-2 text-xs font-semibold ${items.length >= maxItems ? 'text-destructive' : 'text-primary'}`}>
                      {Math.min(items.length, maxItems)} / {maxItems} news items used. {items.length >= maxItems ? 'Delete one before adding another.' : `Up to ${maxItems} news items can be shown.`}
                    </p>
                  ) : null}
                </div>
                {editingId ? (
              <Button variant="outline" onClick={resetDraft} disabled={typeof maxItems === 'number' && items.length >= maxItems}>
                New Item
              </Button>
            ) : null}
          </div>
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
                  const url = await uploadImage(token, file, setStatus);
                  if (!url) return;
                  setDraft((prev) => ({ ...prev, imageUrl: url }));
                  setUploadName(file.name);
                }}
                className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
              />
              {uploadName ? <p className="mt-2 text-xs text-foreground/60">Selected: {uploadName}</p> : null}
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
          <div className="flex flex-wrap gap-3 border-t border-border/60 pt-4">
            <Button onClick={save} className="gap-2" disabled={!editingId && typeof maxItems === 'number' && items.length >= maxItems}>
              <Save className="h-4 w-4" />
              {editingId ? 'Save News Item' : 'Add News Item'}
            </Button>
            <Button variant="outline" onClick={resetDraft}>
              Clear
            </Button>
          </div>
        </div>
        <div className="h-fit max-h-[780px] space-y-3 overflow-y-auto rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">Current News</h3>
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 transition ${editingId === item.id ? 'border-primary bg-primary/5' : 'border-border/60 bg-background'}`}
            >
              {item.imageUrl ? (
                <div className="relative mb-3 h-28 overflow-hidden rounded-lg border border-border/60">
                  <Image src={toPreviewUrl(item.imageUrl)} alt={item.title} fill className="object-cover" unoptimized />
                </div>
              ) : null}
              <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                {[item.badge, item.date].filter(Boolean).join(' - ') || 'News Item'}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">{item.title || 'Untitled news item'}</p>
              {item.description ? <p className="mt-2 line-clamp-2 text-xs text-foreground/60">{item.description}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => edit(item)}>
                  {editingId === item.id ? 'Editing' : 'Edit'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => requestRemove(item)} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
