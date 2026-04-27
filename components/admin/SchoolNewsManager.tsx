'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Save, Trash2, Eye, EyeOff } from 'lucide-react';

type NewsItem = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  isPublished: boolean;
  createdAt: string;
};

type Draft = {
  title: string;
  content: string;
  imageUrl: string;
  isPublished: boolean;
};

export default function SchoolNewsManager({
  token,
  schoolKey,
  schoolName,
}: {
  token: string;
  schoolKey: string;
  schoolName: string;
}) {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [draft, setDraft] = useState<Draft>({
    title: '',
    content: '',
    imageUrl: '',
    isPublished: true,
  });
  const [showForm, setShowForm] = useState(false);

  const baseUrl = useMemo(() => `/api/admin/schools/${encodeURIComponent(schoolKey)}/news`, [schoolKey]);

  const refresh = async () => {
    setIsLoading(true);
    setStatus('');
    try {
      const response = await apiFetch(baseUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setNews([]);
        setStatus('Unable to load news.');
        return;
      }
      const data = await response.json().catch(() => ({}));
      setNews(Array.isArray(data?.news) ? data.news : []);
    } catch {
      setNews([]);
      setStatus('Unable to load news.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, token]);

  const add = async () => {
    if (!draft.title.trim()) {
      setStatus('Please enter a title.');
      return;
    }
    if (!draft.content.trim()) {
      setStatus('Please enter content.');
      return;
    }
    setStatus('');
    try {
      const response = await apiFetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: draft.title.trim(),
          content: draft.content.trim(),
          imageUrl: draft.imageUrl.trim() || null,
          isPublished: draft.isPublished,
        }),
      });
      if (!response.ok) {
        setStatus('Unable to add news.');
        return;
      }
      setDraft({ title: '', content: '', imageUrl: '', isPublished: true });
      setShowForm(false);
      await refresh();
      setStatus('News added.');
    } catch {
      setStatus('Unable to add news.');
    }
  };

  const save = async (item: NewsItem) => {
    setSavingId(item.id);
    setStatus('');
    try {
      const response = await apiFetch(`${baseUrl}/${encodeURIComponent(item.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: item.title,
          content: item.content,
          imageUrl: item.imageUrl,
          isPublished: item.isPublished,
        }),
      });
      if (!response.ok) {
        setStatus('Unable to save news.');
        return;
      }
      await refresh();
      setStatus('News saved.');
    } catch {
      setStatus('Unable to save news.');
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this news item?')) return;
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
      await refresh();
      setStatus('News deleted.');
    } catch {
      setStatus('Unable to delete news.');
    }
  };

  if (isLoading) {
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

      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Manage {schoolName} News</h2>
          <p className="text-sm text-foreground/70 mt-1">Create, edit, and manage news articles for your school.</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 whitespace-nowrap">
            <Plus className="h-4 w-4" />
            Add News
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-foreground">Add New News Item</h3>
          <div className="space-y-4">
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
                rows={6}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
                Image URL
              </label>
              <input
                type="url"
                value={draft.imageUrl}
                onChange={(e) => setDraft((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublished"
                checked={draft.isPublished}
                onChange={(e) => setDraft((prev) => ({ ...prev, isPublished: e.target.checked }))}
                className="rounded border-border"
              />
              <label htmlFor="isPublished" className="text-sm font-medium text-foreground">
                Publish immediately
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border/60">
              <Button onClick={add} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Add News
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {news.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
          <p className="text-foreground/70">No news items yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {news.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                    {!item.isPublished && (
                      <span className="inline-block px-2 py-1 rounded-md bg-destructive/10 text-destructive text-xs font-medium">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground/70 mb-3">{item.content.substring(0, 150)}...</p>
                  <p className="text-xs text-foreground/50">Added {new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-border/60">
                <input
                  type="checkbox"
                  checked={item.isPublished}
                  onChange={(e) => {
                    const updated = { ...item, isPublished: e.target.checked };
                    setNews(news.map((n) => (n.id === item.id ? updated : n)));
                  }}
                  className="hidden"
                  id={`publish-${item.id}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updated = { ...item, isPublished: !item.isPublished };
                    setNews(news.map((n) => (n.id === item.id ? updated : n)));
                    void save(updated);
                  }}
                  className="flex items-center gap-2"
                >
                  {item.isPublished ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Publish
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void save(item)}
                  disabled={savingId === item.id}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {savingId === item.id ? 'Saving...' : 'Save'}
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => void remove(item.id)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
