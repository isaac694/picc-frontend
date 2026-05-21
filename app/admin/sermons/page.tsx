'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Plus } from 'lucide-react';

interface Sermon {
  id: string;
  title: string;
  date: string;
  image: string;
  views: string;
  youtubeUrl: string;
  audioSrc: string;
}

const DEFAULT_HEADER_IMAGE = '/sermons/header.JPG';

const DEFAULT_SERMON: Omit<Sermon, 'id'> = {
  title: '',
  date: '',
  image: '',
  views: '0',
  youtubeUrl: '',
  audioSrc: '',
};

export default function AdminSermonsPage() {
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
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [headerImage, setHeaderImage] = useState(DEFAULT_HEADER_IMAGE);
  const [draftSermon, setDraftSermon] = useState(DEFAULT_SERMON);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadNames, setUploadNames] = useState<Record<string, string>>({});
  const [notifySubscribers, setNotifySubscribers] = useState(false);
  const [sermonSearch, setSermonSearch] = useState('');
  const [sermonFilter, setSermonFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');

  const normalizeRemoteUrl = (value: string) => {
    if (!value) return '';
    if (value.startsWith('http')) return value;
    if (value.startsWith('/')) return value;
    return apiUrl(`/${value}`);
  };

  const extractIframeSrc = (value: string) => {
    const match = value.match(/src=["']([^"']+)["']/i);
    return match ? match[1] : value;
  };

  const normalizeSermonDraft = (sermon: Omit<Sermon, 'id'>) => ({
    ...sermon,
    audioSrc: extractIframeSrc(sermon.audioSrc).trim(),
  });

  const updateUploadName = (key: string, name: string) => {
    setUploadNames((prev) => ({ ...prev, [key]: name }));
  };

  const normalizeSermon = useCallback((value: unknown): Sermon | null => {
    if (!value || typeof value !== 'object') return null;
    const record = value as Record<string, unknown>;
    const id = typeof record.id === 'string' || typeof record.id === 'number' ? String(record.id) : '';
    if (!id) return null;

    return {
      id,
      title: typeof record.title === 'string' ? record.title : '',
      date: typeof record.date === 'string' ? record.date.slice(0, 10) : '',
      image: typeof record.image === 'string' ? record.image : '',
      views: typeof record.views === 'string' ? record.views : '0',
      youtubeUrl:
        typeof record.youtubeUrl === 'string'
          ? record.youtubeUrl
          : typeof record.videoUrl === 'string'
            ? record.videoUrl
            : '',
      audioSrc:
        typeof record.audioSrc === 'string'
          ? record.audioSrc
          : typeof record.audioUrl === 'string'
            ? record.audioUrl
            : '',
    };
  }, []);

  const extractSermons = useCallback((data: unknown): Sermon[] => {
    const source = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && Array.isArray((data as { sermons?: unknown[] }).sermons)
        ? (data as { sermons: unknown[] }).sermons
        : data && typeof data === 'object'
          ? [data]
          : [];

    return source.map(normalizeSermon).filter(Boolean) as Sermon[];
  }, [normalizeSermon]);

  const uploadFile = async (file: File) => {
    if (!token) return null;

    if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
      setStatus('Your image file size is too big. Please compress it first before re uploading. Only pictures less than 1MB are allowed.');
      return null;
    }

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
        setStatus('File upload failed.');
        return null;
      }

      const data = await response.json();
      return apiUrl(data.url);
    } catch {
      setStatus('File upload failed.');
      return null;
    }
  };

  const fetchSermons = async () => {
    try {
      const response = await apiFetch('/api/sermons');
      if (response.ok) {
        const data = await response.json();
        setSermons(extractSermons(data));
      } else {
        setSermons([]);
      }
    } catch {
      setStatus('Failed to fetch sermons.');
      setSermons([]);
    }
  };

  const fetchHeaderImage = async () => {
    try {
      const response = await apiFetch('/api/site-content/sermons-header-image');
      if (response.ok) {
        const data = await response.json();
        if (data.imageUrl) {
          setHeaderImage(normalizeRemoteUrl(data.imageUrl));
          return;
        }
      }
      setHeaderImage(DEFAULT_HEADER_IMAGE);
    } catch {
      setHeaderImage(DEFAULT_HEADER_IMAGE);
    }
  };

  const saveHeaderImage = async () => {
    if (!token || !headerImage) return;

    try {
      const response = await apiFetch('/api/site-content/sermons-header-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl: headerImage }),
      });

      if (response.ok) {
        setStatus('Header image updated successfully.');
        void fetchHeaderImage();
      } else {
        setStatus('Failed to update header image.');
      }
    } catch {
      setStatus('Failed to update header image.');
    }
  };

  const handleAddSermon = async () => {
    if (!token) return;

    try {
      const response = await apiFetch('/api/sermons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(normalizeSermonDraft(draftSermon)),
      });

      if (response.ok) {
        setStatus('Sermon added successfully.');
        setDraftSermon(DEFAULT_SERMON);
        void fetchSermons();

        // Send notification to subscribers if requested
        if (notifySubscribers && draftSermon.title) {
          try {
            const sermonUrl = draftSermon.youtubeUrl || `/sermons/${Date.now()}`; // Fallback URL
            const notifyResponse = await fetch('/api/admin/notify-subscribers', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                sermonTitle: draftSermon.title,
                sermonUrl: sermonUrl,
              }),
            });

            if (notifyResponse.ok) {
              setStatus('Sermon added successfully and subscribers notified.');
            } else {
              setStatus('Sermon added successfully, but failed to notify subscribers.');
            }
          } catch (notifyError) {
            console.error('Failed to notify subscribers:', notifyError);
            setStatus('Sermon added successfully, but failed to notify subscribers.');
          }
        }

        setNotifySubscribers(false); // Reset checkbox
      } else {
        setStatus('Failed to add sermon.');
      }
    } catch {
      setStatus('Failed to add sermon.');
    }
  };

  const handleUpdateSermon = async (id: string) => {
    if (!token) return;

    try {
      const response = await apiFetch(`/api/sermons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(normalizeSermonDraft(draftSermon)),
      });

      if (response.ok) {
        setStatus('Sermon updated successfully.');
        setDraftSermon(DEFAULT_SERMON);
        setEditingId(null);
        void fetchSermons();
      } else if (response.status === 401) {
        setStatus('Your admin session expired. Please log out and log in again.');
      } else {
        setStatus('Failed to update sermon.');
      }
    } catch {
      setStatus('Failed to update sermon.');
    }
  };

  const handleDeleteSermon = async (id: string) => {
    if (!token) return;

    try {
      const response = await apiFetch(`/api/sermons/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setStatus('Sermon deleted successfully.');
        void fetchSermons();
      } else {
        setStatus('Failed to delete sermon.');
      }
    } catch {
      setStatus('Failed to delete sermon.');
    }
  };

  const startEditing = (sermon: Sermon) => {
    setDraftSermon({
      title: sermon.title || '',
      date: sermon.date || '',
      image: sermon.image || '',
      views: sermon.views || '0',
      youtubeUrl: sermon.youtubeUrl || '',
      audioSrc: sermon.audioSrc || '',
    });
    setEditingId(sermon.id);
  };

  const cancelEditing = () => {
    setDraftSermon(DEFAULT_SERMON);
    setEditingId(null);
    setNotifySubscribers(false);
  };

  useEffect(() => {
    if (!token) return;

    void (async () => {
      try {
        const [sermonsResponse, headerResponse] = await Promise.all([
          apiFetch('/api/sermons'),
          apiFetch('/api/site-content/sermons-header-image'),
        ]);

        if (sermonsResponse.ok) {
          const data = await sermonsResponse.json();
          setSermons(extractSermons(data));
        } else {
          setSermons([]);
        }

        if (headerResponse.ok) {
          const data = await headerResponse.json();
          if (data.imageUrl) {
            setHeaderImage(normalizeRemoteUrl(data.imageUrl));
            return;
          }
        }

        setHeaderImage(DEFAULT_HEADER_IMAGE);
      } catch {
        setStatus('Failed to fetch sermons.');
        setSermons([]);
        setHeaderImage(DEFAULT_HEADER_IMAGE);
      }
    })();
  }, [token, extractSermons]);

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
            Sermon Management
          </h1>
          <p className="text-foreground/70 mt-3 max-w-2xl">
            Upload and manage sermons, add Podbean audio links, update the header image, and notify subscribers.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      {status && (
        <p className="text-sm text-foreground/70">{status}</p>
      )}

      {/* Header Image Section */}
      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Header Image</h2>
            <p className="text-sm text-foreground/60">
              Update the background image shown on the sermons page header.
            </p>
          </div>
          <Button variant="outline" onClick={saveHeaderImage} disabled={!headerImage}>
            Save Image
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-2xl border border-border/60 bg-background p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm font-semibold text-foreground">Header Background</p>
            </div>
            {headerImage && (
              <div
                className="h-40 rounded-xl border border-border/60 bg-cover bg-center mb-4"
                style={{ backgroundImage: `url(${headerImage})` }}
              />
            )}
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*,.heic,.heif,.avif"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    updateUploadName('header', file.name);
                    const url = await uploadFile(file);
                    if (url) {
                      setHeaderImage(url);
                      updateUploadName('header', '');
                    }
                  }
                }}
                className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
              />
              {uploadNames.header && (
                <p className="text-xs text-foreground/60">Uploading: {uploadNames.header}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
        {/* Left Side: Form */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {editingId ? 'Edit Sermon' : 'Add New Sermon'}
              </h2>
              <p className="text-sm text-foreground/60">
                {editingId ? 'Update the details for this sermon.' : 'Create a new sermon entry.'}
              </p>
            </div>
            {editingId && (
              <Button variant="outline" onClick={cancelEditing}>
                <Plus className="w-4 h-4 mr-2" />
                New Sermon
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={draftSermon.title}
                onChange={(e) => setDraftSermon(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Sermon title"
                className="rounded-xl border-border bg-background px-4 py-3"
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <input
                id="date"
                type="date"
                value={draftSermon.date}
                onChange={(e) => setDraftSermon(prev => ({ ...prev, date: e.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <Input
                id="youtube-url"
                value={draftSermon.youtubeUrl}
                onChange={(e) => setDraftSermon(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                placeholder="Optional YouTube video URL"
                className="rounded-xl border-border bg-background px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="image-upload">Sermon Image <span className="text-[11px] font-normal text-muted-foreground">(Max 1MB allowed)</span></Label>
              <input
                id="image-upload"
                type="file"
                accept="image/*,.heic,.heif,.avif"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    updateUploadName('image', file.name);
                    const url = await uploadFile(file);
                    if (url) {
                      setDraftSermon(prev => ({ ...prev, image: url }));
                      updateUploadName('image', '');
                    }
                  }
                }}
                className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
              />
              {uploadNames.image && (
                <p className="text-xs text-foreground/60 mt-1">Uploading: {uploadNames.image}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="podbean-url">Podbean Audio URL</Label>
              <Input
                id="podbean-url"
                type="text"
                value={draftSermon.audioSrc}
                onChange={(e) => setDraftSermon(prev => ({ ...prev, audioSrc: extractIframeSrc(e.target.value).trim() }))}
                placeholder="Paste a Podbean embed code, embed player URL, or direct audio URL"
                className="rounded-xl border-border bg-background px-4 py-3"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
            <Checkbox
              id="notify-subscribers"
              checked={notifySubscribers}
              onCheckedChange={(checked) => setNotifySubscribers(checked as boolean)}
              className="h-5 w-5 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <Label htmlFor="notify-subscribers" className="text-sm font-semibold text-foreground cursor-pointer">
              Notify subscribers about this new sermon
            </Label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {editingId ? (
              <>
                <Button onClick={() => handleUpdateSermon(editingId)}>
                  Update Sermon
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteSermon(editingId)}>
                  Delete
                </Button>
                <Button variant="outline" onClick={cancelEditing}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={handleAddSermon} disabled={!draftSermon.title || !draftSermon.date || !draftSermon.audioSrc}>
                Add Sermon
              </Button>
            )}
          </div>
        </div>

        {/* Right Side: Searchable List */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Existing Sermons
          </h2>

          <div className="mb-4">
            <input
              type="search"
              value={sermonSearch}
              onChange={(e) => setSermonSearch(e.target.value)}
              placeholder="Search by title or date..."
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {(['all', 'week', 'month', 'year'] as const).map((f) => (
              <Button
                key={f}
                variant={sermonFilter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSermonFilter(f)}
                className="capitalize h-8 text-xs"
              >
                {f === 'all' ? 'All' : `This ${f}`}
              </Button>
            ))}
          </div>

          {(sermons || []).length === 0 ? (
            <p className="text-sm text-foreground/60">No sermons found.</p>
          ) : (() => {
            const query = sermonSearch.trim().toLowerCase();
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfYear = new Date(now.getFullYear(), 0, 1);

            const filtered = (sermons || []).filter((s) => {
              // Search filter
              const matchesSearch = !query || 
                (s.title || '').toLowerCase().includes(query) ||
                (s.date || '').toLowerCase().includes(query);
              
              if (!matchesSearch) return false;

              // Time filter
              if (sermonFilter === 'all') return true;
              if (!s.date) return false;

              const sermonDate = new Date(s.date);
              if (isNaN(sermonDate.getTime())) return false;

              if (sermonFilter === 'week') return sermonDate >= startOfWeek;
              if (sermonFilter === 'month') return sermonDate >= startOfMonth;
              if (sermonFilter === 'year') return sermonDate >= startOfYear;

              return true;
            });

            return filtered.length === 0 ? (
              <p className="text-sm text-foreground/60">No sermons match your filters.</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filtered.map((sermon) => (
                  <button
                    key={sermon.id}
                    type="button"
                    onClick={() => startEditing(sermon)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      editingId === sermon.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border/60 bg-background hover:border-primary/60'
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                      {sermon.date || 'No date'}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {sermon.title || 'Untitled'}
                    </p>
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
