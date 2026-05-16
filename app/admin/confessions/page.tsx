'use client';

import { useEffect, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ConfessionRecord = {
  id: string;
  title: string | null;
  publishAt: string;
  imageUrl: string;
};

const normalizeImageUrl = (value?: string | null) => {
  if (!value) return '';
  return value.startsWith('http') ? value : apiUrl(value);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeConfession = (value: unknown): ConfessionRecord | null => {
  if (!isRecord(value)) return null;

  const id = typeof value.id === 'string' ? value.id : String(value.id ?? '');
  const publishAt = value.publishAt ? String(value.publishAt) : '';
  const title = typeof value.title === 'string' ? value.title : null;
  const imageUrl = normalizeImageUrl(
    typeof value.imageUrl === 'string' ? value.imageUrl : null
  );

  if (!id || !publishAt) return null;
  return { id, publishAt, title, imageUrl };
};

export default function ConfessionsAdminPage() {
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

  const [confessionSearch, setConfessionSearch] = useState('');
  const [status, setStatus] = useState('');
  const [statusIsError, setStatusIsError] = useState(false);
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [publishTime, setPublishTime] = useState('01:00');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [loading, setLoading] = useState(false);
  const [confessionId, setConfessionId] = useState<string | null>(null);
  const [allConfessions, setAllConfessions] = useState<ConfessionRecord[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPublishAt, setPendingPublishAt] = useState<string | null>(null);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [pendingTime, setPendingTime] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteDate, setPendingDeleteDate] = useState<string | null>(null);

  const hasExistingConfession = Boolean(confessionId);

  const clearStatus = () => {
    setStatus('');
    setStatusIsError(false);
  };

  const setErrorStatus = (message: string) => {
    setStatus(message);
    setStatusIsError(true);
  };

  const setSuccessStatus = (message: string) => {
    setStatus(message);
    setStatusIsError(false);
  };

  const uploadImage = async (file: File) => {
    if (!token) return null;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorStatus('Please upload an image file (JPEG, PNG, GIF, WebP, etc.)');
      return null;
    }

    // Validate file size
    if (file.size > 1024 * 1024) {
      setErrorStatus('Your image file size is too big. Please compress it first before re uploading. Only pictures less than 1MB are allowed.');
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
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.error || 'Image upload failed.';
        setErrorStatus(errorMsg);
        return null;
      }
      const data = await response.json();
      return normalizeImageUrl(data.url);
    } catch {
      setErrorStatus('Image upload failed.');
      return null;
    }
  };

  useEffect(() => {
    if (!token) return;

    const fetchConfession = async () => {
      setLoading(true);
      clearStatus();
      try {
        const response = await apiFetch(`/api/confessions?date=${date}`);
        if (response.ok) {
          const data = (await response.json().catch(() => null)) as unknown;
          const confession = normalizeConfession(data);
          if (!confession) {
            setErrorStatus('Unable to load confession for that date.');
            setConfessionId(null);
            setTitle('');
            setImageUrl('');
            setUploadName('');
            return;
          }

          setConfessionId(confession.id);
          setTitle(confession.title || '');
          setImageUrl(confession.imageUrl);
          setUploadName('');
          if (confession.publishAt) {
            const parsed = new Date(confession.publishAt);
            if (!Number.isNaN(parsed.getTime())) {
              const year = parsed.getFullYear();
              const month = String(parsed.getMonth() + 1).padStart(2, '0');
              const day = String(parsed.getDate()).padStart(2, '0');
              setDate(`${year}-${month}-${day}`);
              const hours = String(parsed.getHours()).padStart(2, '0');
              const minutes = String(parsed.getMinutes()).padStart(2, '0');
              setPublishTime(`${hours}:${minutes}`);
            }
          }
        } else if (response.status === 404) {
          setConfessionId(null);
          setTitle('');
          setImageUrl('');
          setUploadName('');
        } else {
          setErrorStatus('Unable to load confession for that date.');
        }
      } catch {
        setErrorStatus('Unable to load confession for that date.');
      } finally {
        setLoading(false);
      }
    };

    fetchConfession();
  }, [token, date]);

  useEffect(() => {
    if (!token) return;

    const fetchAllConfessions = async () => {
      try {
        const response = await apiFetch('/api/confessions/admin?take=500', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = (await response.json().catch(() => null)) as unknown;
        const list = isRecord(data) && Array.isArray(data.confessions) ? data.confessions : [];
        const normalized = list
          .map(normalizeConfession)
          .filter((item): item is ConfessionRecord => Boolean(item));
        setAllConfessions(normalized);
      } catch {
        setAllConfessions([]);
      }
    };

    fetchAllConfessions();
  }, [token, status]);

  const requestPostConfirmation = () => {
    if (!imageUrl.trim()) {
      setErrorStatus('Please upload a confession image before posting.');
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (date < todayStr) {
      setErrorStatus('You cannot post confessions for past dates. Please select today or a future date.');
      return;
    }

    const publishAt = new Date(`${date}T${publishTime}:00`).toISOString();
    setPendingPublishAt(publishAt);
    setPendingDate(date);
    setPendingTime(publishTime);
    setConfirmOpen(true);
  };

  const handleConfirmPost = async () => {
    if (!pendingPublishAt) return;

    clearStatus();
    setLoading(true);
    setConfirmOpen(false);

    try {
      const response = await apiFetch('/api/confessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date, title, imageUrl, publishAt: pendingPublishAt }),
      });

      if (!response.ok) {
        setErrorStatus('Unable to save confession. Please try again.');
        return;
      }

      const payload = (await response.json().catch(() => null)) as unknown;
      const saved = normalizeConfession(payload);
      if (saved) {
        setConfessionId(saved.id);
      }

      setSuccessStatus('Confession saved.');
    } catch {
      setErrorStatus('Unable to save confession. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestDeleteConfirmation = () => {
    if (!confessionId) return;
    setPendingDeleteId(confessionId);
    setPendingDeleteDate(date);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;

    clearStatus();
    setLoading(true);
    setDeleteConfirmOpen(false);

    try {
      const response = await apiFetch(`/api/confessions/${pendingDeleteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 405) {
          setErrorStatus('Delete is not supported by the backend yet.');
          return;
        }
        setErrorStatus('Unable to delete confession. Please try again.');
        return;
      }

      setConfessionId(null);
      setTitle('');
      setImageUrl('');
      setUploadName('');
      setSuccessStatus('Confession deleted.');
    } catch {
      setErrorStatus('Unable to delete confession. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            Daily Confessions
          </h1>
          <p className="text-foreground/70 mt-3 max-w-2xl">
            Upload and schedule daily confession declarations.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      {status && (
        <p className={statusIsError ? 'text-sm text-red-600' : 'text-sm text-foreground/70'}>
          {status}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Publish Time
              </label>
              <input
                type="time"
                value={publishTime}
                onChange={(event) => setPublishTime(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              placeholder="Confession title (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Upload Confession Image
            </label>
            <input
              type="file"
              accept="image/*,.heic,.heif,.avif"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const url = await uploadImage(file);
                if (url) {
                  setImageUrl(url);
                  setUploadName(file.name);
                }
              }}
              className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
            />
            {uploadName ? (
              <p className="mt-2 text-xs text-foreground/60">
                Selected: {uploadName}
              </p>
            ) : null}
            {imageUrl ? (
              <p className="mt-2 text-xs text-foreground/60 break-all">
                Image URL: {imageUrl}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={requestPostConfirmation} disabled={loading}>
              {loading ? 'Saving...' : hasExistingConfession ? 'Save Confession' : 'Post Confession'}
            </Button>
            <Button
              variant="destructive"
              onClick={requestDeleteConfirmation}
              disabled={loading || !hasExistingConfession}
            >
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setImageUrl('');
                setUploadName('');
              }}
              disabled={loading}
            >
              Clear Image
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Recent Confessions
          </h2>

          <div className="mb-4">
            <input
              type="search"
              value={confessionSearch}
              onChange={(e) => setConfessionSearch(e.target.value)}
              placeholder="Search by title or date..."
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40"
            />
          </div>

          {allConfessions.length === 0 ? (
            <p className="text-sm text-foreground/60">No confessions yet.</p>
          ) : (() => {
            const query = confessionSearch.trim().toLowerCase();
            const filtered = query
              ? allConfessions.filter(
                  (c) =>
                    c.publishAt.slice(0, 10).includes(query) ||
                    (c.title || '').toLowerCase().includes(query)
                )
              : allConfessions;

            return filtered.length === 0 ? (
              <p className="text-sm text-foreground/60">No confessions match your search.</p>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
                {filtered.map((confession) => (
                  <button
                    key={confession.id}
                    type="button"
                    onClick={() => setDate(confession.publishAt.slice(0, 10))}
                    className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-left hover:border-primary/60 transition"
                  >
                    <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                      {confession.publishAt.slice(0, 10)}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {confession.title || 'Daily Confession'}
                    </p>
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) {
            setPendingPublishAt(null);
            setPendingDate(null);
            setPendingTime(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Confession Save</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save this confession{pendingDate && pendingTime ? ` for ${pendingDate} at ${pendingTime}` : ''}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPost} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) {
            setPendingDeleteId(null);
            setPendingDeleteDate(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Confession Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this confession{pendingDeleteDate ? ` for ${pendingDeleteDate}` : ''}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
