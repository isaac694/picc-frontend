'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Eye,
  ExternalLink,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import MediaUploadProgress from '@/components/admin/MediaUploadProgress';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { adminErrorToast, adminSuccessToast, readApiMessage } from '@/components/admin/admin-toast';
import { useMediaUpload } from '@/hooks/use-media-upload';
import { apiFetch, resolveMediaImageUrl } from '@/lib/api';
import { formatNewsDate, parseArticles, type NewsArticle } from '@/lib/news';
import { cn } from '@/lib/utils';

const CATEGORY_SUGGESTIONS = ['Updates', 'Community', 'Outreach', 'Worship', 'Youth', 'Ministry', 'Events', 'Missions', 'Announcements'];

type Draft = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  imageUrl: string;
  gallery: string[];
  publishedAt: string;
  isActive: boolean;
  isFeatured: boolean;
};

const toLocalInput = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const emptyDraft = (): Draft => ({
  title: '',
  excerpt: '',
  content: '',
  category: 'Updates',
  author: '',
  imageUrl: '',
  gallery: [],
  publishedAt: toLocalInput(),
  isActive: true,
  isFeatured: false,
});

type Stats = { total: number; active: number; inactive: number; featured: number; scheduled: number; views: number };

export default function NewsManager({
  token,
  scope,
  title = 'News articles',
  description = 'Write stories, switch them on or off, and feature the lead story.',
}: {
  token: string;
  scope: string;
  title?: string;
  description?: string;
}) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [legacyAvailable, setLegacyAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NewsArticle | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { runUpload, progress, uploading } = useMediaUpload();

  const headers = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }), [token]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/admin/news?scope=${encodeURIComponent(scope)}`, { headers });
      if (!response.ok) {
        adminErrorToast(await readApiMessage(response, { fallback: 'Unable to load news.' }));
        return;
      }
      const data = await response.json();
      setArticles(parseArticles(data.articles));
      setStats(data.stats || null);
      setLegacyAvailable(Boolean(data.legacyImportAvailable));
    } finally {
      setLoading(false);
    }
  }, [headers, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return articles.filter((article) => {
      if (statusFilter === 'active' && !article.isActive) return false;
      if (statusFilter === 'inactive' && article.isActive) return false;
      if (!term) return true;
      return `${article.title} ${article.category} ${article.excerpt}`.toLowerCase().includes(term);
    });
  }, [articles, search, statusFilter]);

  const openNew = () => {
    setEditing(null);
    setDraft(emptyDraft());
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (article: NewsArticle) => {
    setEditing(article);
    setDraft({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content || '',
      category: article.category,
      author: article.author || '',
      imageUrl: article.imageUrl || '',
      gallery: article.gallery,
      publishedAt: toLocalInput(article.publishedAt),
      isActive: article.isActive,
      isFeatured: article.isFeatured,
    });
    setFormError('');
    setDialogOpen(true);
  };

  const uploadImage = async (file: File) => {
    if (file.size > 1_000_000) {
      setFormError('Images must be smaller than 1MB. Please compress the picture and try again.');
      return null;
    }
    try {
      return await runUpload(file, 'news');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Image upload failed.');
      return null;
    }
  };

  const save = async () => {
    if (!draft.title.trim()) return setFormError('Add a headline.');
    if (!draft.content.trim()) return setFormError('Write the story before saving.');
    setSaving(true);
    setFormError('');
    try {
      const body = {
        ...draft,
        scope,
        publishedAt: draft.publishedAt ? new Date(draft.publishedAt).toISOString() : undefined,
      };
      const response = await apiFetch(editing ? `/api/admin/news/${editing.id}` : '/api/admin/news', {
        method: editing ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setFormError(await readApiMessage(response, { fallback: 'Unable to save this story.' }));
        return;
      }
      adminSuccessToast(editing ? 'Story updated.' : 'Story published.');
      setDialogOpen(false);
      void load();
    } finally {
      setSaving(false);
    }
  };

  const action = async (article: NewsArticle, path: string, message: string) => {
    setBusyId(article.id);
    try {
      const response = await apiFetch(`/api/admin/news/${article.id}/${path}`, { method: 'PATCH', headers });
      if (!response.ok) {
        adminErrorToast(await readApiMessage(response, { fallback: 'Unable to update this story.' }));
        return;
      }
      adminSuccessToast(message);
      void load();
    } finally {
      setBusyId(null);
    }
  };

  const remove = (article: NewsArticle) => {
    confirmDeleteToast({
      title: 'Delete this story?',
      description: article.title,
      onConfirm: async () => {
        const response = await apiFetch(`/api/admin/news/${article.id}`, { method: 'DELETE', headers });
        if (!response.ok) {
          adminErrorToast(await readApiMessage(response, { fallback: 'Unable to delete this story.' }));
          return;
        }
        adminSuccessToast('Story deleted.');
        void load();
      },
    });
  };

  const importLegacy = async () => {
    const response = await apiFetch('/api/admin/news/import-legacy', {
      method: 'POST',
      headers,
      body: JSON.stringify({ scope }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      adminErrorToast(data?.error || 'Unable to import older news.');
      return;
    }
    adminSuccessToast(data.created ? `Imported ${data.created} older stor${data.created === 1 ? 'y' : 'ies'}.` : 'No new stories to import.');
    void load();
  };

  const statCards = stats
    ? [
        { label: 'Stories', value: stats.total },
        { label: 'Live', value: stats.active },
        { label: 'Deactivated', value: stats.inactive },
        { label: 'Scheduled', value: stats.scheduled },
        { label: 'Total reads', value: stats.views },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-foreground/70">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {legacyAvailable ? (
            <Button type="button" variant="outline" onClick={() => void importLegacy()} className="gap-2">
              <Upload className="h-4 w-4" /> Import older news
            </Button>
          ) : null}
          <Button type="button" onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Write a story
          </Button>
        </div>
      </div>

      {statCards.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-border/60 bg-card px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/50">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{card.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
          <Search className="h-4 w-4 text-foreground/40" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search headlines"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-border p-1">
          {(['all', 'active', 'inactive'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold capitalize', statusFilter === value ? 'bg-primary text-primary-foreground' : 'text-foreground/60')}
            >
              {value === 'inactive' ? 'Deactivated' : value}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-foreground/60">
            {articles.length ? 'No stories match this filter.' : 'No stories yet. Write the first one, and it replaces the sample stories on the website.'}
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {filtered.map((article) => {
              const scheduled = new Date(article.publishedAt) > new Date();
              return (
                <li key={article.id} className={cn('flex flex-col gap-4 p-4 sm:flex-row sm:items-center', !article.isActive && 'bg-muted/40')}>
                  <img
                    src={resolveMediaImageUrl(article.imageUrl) || '/hero/hero-4.JPG'}
                    alt=""
                    className={cn('h-20 w-full rounded-lg object-cover sm:w-32', !article.isActive && 'opacity-50 grayscale')}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{article.category}</Badge>
                      {article.isActive ? (
                        scheduled ? <Badge variant="outline">Scheduled</Badge> : <Badge className="bg-emerald-600 hover:bg-emerald-600">Live</Badge>
                      ) : (
                        <Badge variant="outline" className="text-foreground/60">Deactivated</Badge>
                      )}
                      {article.isFeatured ? <Badge className="gap-1 bg-amber-500 hover:bg-amber-500"><Star className="h-3 w-3" /> Lead story</Badge> : null}
                    </div>
                    <p className="mt-2 font-semibold text-foreground">{article.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-foreground/55">
                      <span>{formatNewsDate(article.publishedAt)}</span>
                      <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{article.views.toLocaleString()} reads</span>
                      {article.author ? <span>By {article.author}</span> : null}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {article.isActive && !scheduled ? (
                      <Button asChild size="icon" variant="ghost" aria-label="Open on website">
                        <a href={`/news/${article.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={busyId === article.id}
                      aria-label={article.isFeatured ? 'Remove lead story' : 'Make lead story'}
                      title={article.isFeatured ? 'Remove lead story' : 'Make lead story'}
                      onClick={() => void action(article, article.isFeatured ? 'unfeature' : 'feature', article.isFeatured ? 'No longer the lead story.' : 'Set as a lead story.')}
                    >
                      <Star className={cn('h-4 w-4', article.isFeatured && 'fill-amber-500 text-amber-500')} />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyId === article.id}
                      onClick={() => void action(article, article.isActive ? 'deactivate' : 'activate', article.isActive ? 'Story deactivated.' : 'Story activated.')}
                      className="gap-1.5"
                    >
                      {article.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                      {article.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button type="button" size="icon" variant="ghost" aria-label="Edit story" onClick={() => openEdit(article)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="text-destructive hover:text-destructive" aria-label="Delete story" onClick={() => remove(article)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Edit story' : 'Write a story'}
        description="Stories show on the website as soon as the publish time passes and the story is active."
        saving={saving || uploading}
        saveLabel={editing ? 'Save changes' : 'Publish story'}
        onSave={() => void save()}
        onCancel={() => setDialogOpen(false)}
        maxWidthClass="sm:max-w-3xl"
      >
        <div className="space-y-4">
          {formError ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p> : null}
          <label className="block">
            <span className="text-sm font-medium">Headline</span>
            <input
              value={draft.title}
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-lg font-semibold"
              placeholder="e.g. Youth Revival Week draws hundreds"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Summary <span className="font-normal text-foreground/50">(shown on the news cards)</span></span>
            <textarea
              value={draft.excerpt}
              onChange={(event) => setDraft((prev) => ({ ...prev, excerpt: event.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
              placeholder="One or two sentences. Leave empty to use the start of the story."
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Story</span>
            <textarea
              value={draft.content}
              onChange={(event) => setDraft((prev) => ({ ...prev, content: event.target.value }))}
              rows={10}
              className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6"
              placeholder="Write the full story. Leave a blank line between paragraphs."
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium">Category</span>
              <input
                list="news-categories"
                value={draft.category}
                onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
              />
              <datalist id="news-categories">
                {CATEGORY_SUGGESTIONS.map((entry) => <option key={entry} value={entry} />)}
              </datalist>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Written by</span>
              <input
                value={draft.author}
                onChange={(event) => setDraft((prev) => ({ ...prev, author: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
                placeholder="Optional"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Publish on</span>
              <input
                type="datetime-local"
                value={draft.publishedAt}
                onChange={(event) => setDraft((prev) => ({ ...prev, publishedAt: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
            <div>
              <span className="text-sm font-medium">Main picture</span>
              <input
                value={draft.imageUrl}
                onChange={(event) => setDraft((prev) => ({ ...prev, imageUrl: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
                placeholder="Paste an image link or upload below"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20">
                  <ImagePlus className="h-4 w-4" /> {draft.imageUrl ? 'Replace picture' : 'Upload picture'}
                  <input
                    type="file"
                    accept="image/*,.heic,.heif,.avif"
                    className="hidden"
                    onChange={async (event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = '';
                      if (!file) return;
                      const url = await uploadImage(file);
                      if (url) setDraft((prev) => ({ ...prev, imageUrl: url }));
                    }}
                  />
                </label>
                {draft.imageUrl ? (
                  <button type="button" onClick={() => setDraft((prev) => ({ ...prev, imageUrl: '' }))} className="rounded-full px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10">
                    Remove picture
                  </button>
                ) : null}
              </div>
              <MediaUploadProgress uploading={uploading} progress={progress} className="mt-2" />
            </div>
            <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/30">
              {draft.imageUrl ? (
                <img src={resolveMediaImageUrl(draft.imageUrl) || draft.imageUrl} alt="" className="h-36 w-full object-cover" />
              ) : (
                <div className="flex h-36 items-center justify-center text-xs text-foreground/50">No picture yet</div>
              )}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium">Photo gallery <span className="font-normal text-foreground/50">(optional, shown under the story)</span></span>
            <div className="mt-2 flex flex-wrap gap-2">
              {draft.gallery.map((url) => (
                <div key={url} className="relative">
                  <img src={resolveMediaImageUrl(url) || url} alt="" className="h-20 w-28 rounded-lg object-cover" />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => setDraft((prev) => ({ ...prev, gallery: prev.gallery.filter((entry) => entry !== url) }))}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="flex h-20 w-28 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border text-xs text-foreground/55 hover:bg-muted/40">
                <ImagePlus className="mr-1 h-4 w-4" /> Add
                <input
                  type="file"
                  accept="image/*,.heic,.heif,.avif"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = '';
                    if (!file) return;
                    const url = await uploadImage(file);
                    if (url) setDraft((prev) => ({ ...prev, gallery: [...prev.gallery, url] }));
                  }}
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((prev) => ({ ...prev, isActive: event.target.checked }))} />
              Active (visible on the website)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.isFeatured} onChange={(event) => setDraft((prev) => ({ ...prev, isFeatured: event.target.checked }))} />
              Lead story (shown first)
            </label>
          </div>
        </div>
      </SchoolAdminDialogShell>
    </div>
  );
}
