'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

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
  const [savingId, setSavingId] = useState<string | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [draft, setDraft] = useState<Draft>({
    badge: 'Updates',
    title: '',
    content: '',
    imageUrl: '',
    isPublished: true,
  });

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
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, token]);

  const handleEdit = (item: NewsItem) => {
    setEditingItem(item);
    setUploadName('');
    setDraft({
      badge: item.badge || 'Updates',
      title: item.title,
      content: item.content,
      imageUrl: item.imageUrl || '',
      isPublished: item.isPublished,
    });
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setUploadName('');
    setDraft({
      badge: 'Updates',
      title: '',
      content: '',
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
    
    const isPersistedEdit = Boolean(editingItem && !editingItem.isFallback);
    setSavingId(isPersistedEdit && editingItem ? editingItem.id : 'new');
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

      setDraft({ badge: 'Updates', title: '', content: '', imageUrl: '', isPublished: true });
      setUploadName('');
      setEditingItem(null);
      
      await refresh();
      setStatus(`News ${isPersistedEdit ? 'updated' : 'added'}.`);
    } catch {
      setStatus(`Unable to ${isPersistedEdit ? 'update' : 'add'} news.`);
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
        setStatus('Unable to delete news.');
        return;
      }
      
      if (editingItem?.id === id) {
        handleAddNew();
      }
      
      await refresh();
      setStatus('News deleted.');
    } catch {
      setStatus('Unable to delete news.');
    }
  };

  const requestRemove = (item: NewsItem) => {
    const toastId = toast('Delete this news item?', {
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

  const filteredNews = useMemo(() => {
    if (!searchTerm.trim()) return news;
    const lower = searchTerm.toLowerCase();
    return news.filter(n => 
      (n.badge || '').toLowerCase().includes(lower) ||
      n.title.toLowerCase().includes(lower) || 
      n.content.toLowerCase().includes(lower)
    );
  }, [news, searchTerm]);

  const isPersistedEdit = Boolean(editingItem && !editingItem.isFallback);
  const isFallbackSelection = Boolean(editingItem?.isFallback);

  if (isLoading && news.length === 0) {
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
                {isPersistedEdit ? 'Update News' : isFallbackSelection ? 'Create News From Template' : 'Add New News'}
              </h2>
              <p className="text-sm text-foreground/70 mt-1">
                {isPersistedEdit
                  ? `Update the details for this ${schoolName} news item.`
                  : isFallbackSelection
                    ? `This fallback item is only a template. Saving will create a new ${schoolName} news entry.`
                    : `Create a new news entry for ${schoolName}.`}
              </p>
            </div>
            {editingItem && (
              <Button variant="outline" onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                New News
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
                Badge *
              </label>
              <input
                type="text"
                value={draft.badge}
                onChange={(e) => setDraft((prev) => ({ ...prev, badge: e.target.value }))}
                placeholder="Updates"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
                Title *
              </label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="News title"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
                Content *
              </label>
              <textarea
                value={draft.content}
                onChange={(e) => setDraft((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="News content..."
                rows={8}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
                News Image <span className="text-[11px] font-normal text-foreground/50">(Max 1MB allowed)</span>
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
                      alt={draft.title || 'News preview'}
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
                {isPersistedEdit ? 'Update News' : isFallbackSelection ? 'Create News' : 'Add News'}
              </Button>
              {isPersistedEdit && editingItem && (
                <Button variant="destructive" onClick={() => requestRemove(editingItem)} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
              {(editingItem || draft.title || draft.content) && (
                <Button variant="outline" onClick={handleAddNew}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: List */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm flex flex-col h-fit max-h-[800px]">
          <h2 className="text-lg font-semibold text-foreground mb-4">Current News Items</h2>
          
          <div className="relative mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search news..."
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 transition outline-none"
            />
          </div>

          <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {filteredNews.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl border-border/60">
                <p className="text-sm text-foreground/60">
                  {searchTerm ? 'No news match your search.' : 'No news items yet.'}
                </p>
              </div>
            ) : (
              filteredNews.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleEdit(item)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    editingItem?.id === item.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border/60 bg-background hover:border-primary/60'
                  }`}
                >
                  {item.imageUrl ? (
                    <div className="relative mb-3 h-28 overflow-hidden rounded-lg border border-border/60">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">{item.title}</h3>
                    {!item.isPublished && (
                      <span className="text-[10px] uppercase font-bold text-destructive px-1.5 py-0.5 rounded bg-destructive/10">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/40">
                    {[item.badge || 'Updates', item.displayDate || new Date(item.createdAt).toLocaleDateString()].join(' - ')}
                  </p>
                  <p className="text-xs text-foreground/60 line-clamp-2">{item.content}</p>
                  <p className="text-[10px] text-foreground/40 mt-2 font-medium">
                    {item.isFallback ? 'Fallback content ready to edit' : new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
