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

type NewsItem = {
  id: string;
  badge: string | null;
  title: string;
  content: string;
  imageUrl: string | null;
  isPublished: boolean;
  createdAt: string;
  isFallback?: boolean;
  displayDate?: string;
};

type Draft = {
  badge: string;
  title: string;
  content: string;
  imageUrl: string;
  isPublished: boolean;
};

type FallbackNewsItem = {
  badge: string;
  date: string;
  title: string;
  content: string;
  imageUrl: string;
  isPublished?: boolean;
};

const EMPTY_DRAFT: Draft = {
  badge: 'Updates',
  title: '',
  content: '',
  imageUrl: '',
  isPublished: true,
};

export default function SchoolNewsManager({
  token,
  schoolKey,
  schoolName,
  fallbackNews = [],
}: {
  token: string;
  schoolKey: string;
  schoolName: string;
  fallbackNews?: FallbackNewsItem[];
}) {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [uploadName, setUploadName] = useState('');
  const { runUpload, progress, uploading } = useMediaUpload();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  const baseUrl = useMemo(() => `/api/admin/schools/${encodeURIComponent(schoolKey)}/news`, [schoolKey]);
  const normalizedFallbackNews = useMemo<NewsItem[]>(
    () =>
      fallbackNews.map((item, index) => ({
        id: `fallback-${schoolKey}-${index}`,
        badge: item.badge,
        title: item.title,
        content: item.content,
        imageUrl: item.imageUrl,
        isPublished: item.isPublished ?? true,
        createdAt: new Date(2026, 0, Math.max(1, fallbackNews.length - index)).toISOString(),
        isFallback: true,
        displayDate: item.date,
      })),
    [fallbackNews, schoolKey],
  );

  const refresh = async () => {
    setIsLoading(true);
    setStatus('');
    try {
      const response = await apiFetch(baseUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setNews(normalizedFallbackNews);
        setStatus('Unable to load news.');
        return;
      }
      const data = await response.json().catch(() => ({}));
      const loadedNews = Array.isArray(data?.news) ? data.news : [];
      setNews(loadedNews.length > 0 ? loadedNews : normalizedFallbackNews);
    } catch {
      setNews(normalizedFallbackNews);
      setStatus('Unable to load news.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial list fetch
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, token]);

  const isPersistedEdit = Boolean(editingItem && !editingItem.isFallback);
  const isFallbackSelection = Boolean(editingItem?.isFallback);

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

  const openEditDialog = (item: NewsItem) => {
    setEditingItem(item);
    setUploadName('');
    setDraft({
      badge: item.badge || 'Updates',
      title: item.title,
      content: item.content,
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
    if (!draft.badge.trim()) {
      setStatus('Please enter a badge.');
      return;
    }
    if (!draft.title.trim()) {
      setStatus('Please enter a title.');
      return;
    }
    if (!draft.content.trim()) {
      setStatus('Please enter content.');
      return;
    }

    setSaving(true);
    setStatus('');

    try {
      const url = isPersistedEdit && editingItem ? `${baseUrl}/${encodeURIComponent(editingItem.id)}` : baseUrl;
      const method = isPersistedEdit ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          badge: draft.badge.trim(),
          title: draft.title.trim(),
          content: draft.content.trim(),
          imageUrl: draft.imageUrl.trim() || null,
          isPublished: draft.isPublished,
        }),
      });

      if (!response.ok) {
        setStatus(`Unable to ${isPersistedEdit ? 'update' : 'add'} news.`);
        return;
      }

      const wasPersistedEdit = isPersistedEdit;
      closeDialog();
      await refresh();
      setStatus(`News ${wasPersistedEdit ? 'updated' : 'added'}.`);
    } catch {
      setStatus(`Unable to ${isPersistedEdit ? 'update' : 'add'} news.`);
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
        setStatus('Unable to delete news.');
        return;
      }
      if (editingItem?.id === id) closeDialog();
      await refresh();
      setStatus('News deleted.');
    } catch {
      setStatus('Unable to delete news.');
    }
  };

  const requestRemove = (item: NewsItem) => {
    if (item.isFallback) return;
    confirmDeleteToast({
      title: 'Delete this news item?',
      description: item.title,
      onConfirm: () => void remove(item.id),
    });
  };

  const filteredNews = useMemo(() => {
    if (!searchTerm.trim()) return news;
    const lower = searchTerm.toLowerCase();
    return news.filter(
      (n) =>
        (n.badge || '').toLowerCase().includes(lower) ||
        n.title.toLowerCase().includes(lower) ||
        n.content.toLowerCase().includes(lower),
    );
  }, [news, searchTerm]);

  const formFields = (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">Badge *</label>
        <input
          type="text"
          value={draft.badge}
          onChange={(e) => setDraft((prev) => ({ ...prev, badge: e.target.value }))}
          placeholder="Updates"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">Title *</label>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="News title"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">Content *</label>
        <textarea
          value={draft.content}
          onChange={(e) => setDraft((prev) => ({ ...prev, content: e.target.value }))}
          placeholder="News content..."
          rows={8}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
          News image <span className="font-normal normal-case text-foreground/50">(max 1MB)</span>
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
              <Image src={draft.imageUrl} alt={draft.title || 'News preview'} fill className="object-cover" unoptimized />
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3">
        <input
          type="checkbox"
          id="news-isPublished"
          checked={draft.isPublished}
          onChange={(e) => setDraft((prev) => ({ ...prev, isPublished: e.target.checked }))}
          className="rounded border-border"
        />
        <label htmlFor="news-isPublished" className="cursor-pointer text-sm font-medium text-foreground">
          Published (visible on site)
        </label>
      </div>
    </div>
  );

  if (isLoading && news.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const dialogTitle = isPersistedEdit
    ? 'Edit news'
    : isFallbackSelection
      ? 'Create news from template'
      : 'Add news';
  const dialogDescription = isPersistedEdit
    ? `Update this ${schoolName} news item.`
    : isFallbackSelection
      ? `This fallback item is only a template. Saving will create a new ${schoolName} news entry.`
      : `Create a new news entry for ${schoolName}.`;
  const saveLabel = isPersistedEdit ? 'Save changes' : isFallbackSelection ? 'Create news' : 'Add news';

  return (
    <div className="space-y-6">
      <SchoolAdminStatusBanner status={status} />

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-foreground">Current news</h2>
          <Button type="button" className="gap-2 shrink-0" onClick={openAddDialog}>
            <Plus className="h-4 w-4" />
            Add news
          </Button>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search news..."
          className="mb-4 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/20"
        />

        {filteredNews.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground/60">
            {searchTerm ? 'No news match your search.' : 'No news items yet.'}
          </p>
        ) : (
          <div className="overflow-auto rounded-xl border border-border/70">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-foreground/60">
                <tr>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNews.map((item) => (
                  <tr key={item.id} className="border-t border-border/60 align-top">
                    <td className="px-3 py-2">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-foreground/60">{item.content}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-foreground/70">
                      {[item.badge || 'Updates', item.displayDate || new Date(item.createdAt).toLocaleDateString()].join(' · ')}
                    </td>
                    <td className="px-3 py-2 text-foreground/70">
                      {!item.isPublished ? 'Draft' : item.isFallback ? 'Template' : 'Published'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${item.title}`} onClick={() => openEditDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!item.isFallback ? (
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
                        ) : null}
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
        title={dialogTitle}
        description={dialogDescription}
        saving={saving}
        saveLabel={saveLabel}
        onSave={() => void save()}
        onCancel={closeDialog}
        maxWidthClass="sm:max-w-2xl"
      >
        {formFields}
      </SchoolAdminDialogShell>
    </div>
  );
}
