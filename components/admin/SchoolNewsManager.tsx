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
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [draft, setDraft] = useState<Draft>({
    title: '',
    content: '',
    imageUrl: '',
    isPublished: true,
  });

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

  const handleEdit = (item: NewsItem) => {
    setEditingItem(item);
    setDraft({
      title: item.title,
      content: item.content,
      imageUrl: item.imageUrl || '',
      isPublished: item.isPublished,
    });
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setDraft({
      title: '',
      content: '',
      imageUrl: '',
      isPublished: true,
    });
  };

  const save = async () => {
    if (!draft.title.trim()) {
      setStatus('Please enter a title.');
      return;
    }
    if (!draft.content.trim()) {
      setStatus('Please enter content.');
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
          content: draft.content.trim(),
          imageUrl: draft.imageUrl.trim() || null,
          isPublished: draft.isPublished,
        }),
      });

      if (!response.ok) {
        setStatus(`Unable to ${editingItem ? 'update' : 'add'} news.`);
        return;
      }

      if (!editingItem) {
        setDraft({ title: '', content: '', imageUrl: '', isPublished: true });
      }
      
      await refresh();
      setStatus(`News ${editingItem ? 'updated' : 'added'}.`);
    } catch {
      setStatus(`Unable to ${editingItem ? 'update' : 'add'} news.`);
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
      
      if (editingItem?.id === id) {
        handleAddNew();
      }
      
      await refresh();
      setStatus('News deleted.');
    } catch {
      setStatus('Unable to delete news.');
    }
  };

  const filteredNews = useMemo(() => {
    if (!searchTerm.trim()) return news;
    const lower = searchTerm.toLowerCase();
    return news.filter(n => 
      n.title.toLowerCase().includes(lower) || 
      n.content.toLowerCase().includes(lower)
    );
  }, [news, searchTerm]);

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
                {editingItem ? 'Update News' : 'Add New News'}
              </h2>
              <p className="text-sm text-foreground/70 mt-1">
                {editingItem ? 'Update the details for this news item.' : 'Create a new news entry for your school.'}
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
                {editingItem ? 'Update News' : 'Add News'}
              </Button>
              {editingItem && (
                <Button variant="destructive" onClick={() => remove(editingItem.id)} className="gap-2">
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
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">{item.title}</h3>
                    {!item.isPublished && (
                      <span className="text-[10px] uppercase font-bold text-destructive px-1.5 py-0.5 rounded bg-destructive/10">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground/60 line-clamp-2">{item.content}</p>
                  <p className="text-[10px] text-foreground/40 mt-2 font-medium">
                    {new Date(item.createdAt).toLocaleDateString()}
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
