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
  id: string | number;
  title?: string | null;
  publishAt?: string | null;
  imageUrl?: string | null;
};

const normalizeImageUrl = (value?: string | null) => {
  if (!value) return '';
  return value.startsWith('http') ? value : apiUrl(value);
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

  const [status, setStatus] = useState('');
  const [statusIsError, setStatusIsError] = useState(false);
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [publishTime, setPublishTime] = useState('01:00');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [loading, setLoading] = useState(false);
  const [allConfessions, setAllConfessions] = useState<ConfessionRecord[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPublishAt, setPendingPublishAt] = useState<string | null>(null);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [pendingTime, setPendingTime] = useState<string | null>(null);

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

    if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
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
        setErrorStatus('Image upload failed.');
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
          const data = await response.json();
          setTitle(data.title || '');
          setImageUrl(normalizeImageUrl(data.imageUrl));
          setUploadName('');
          if (data.publishAt) {
            const parsed = new Date(data.publishAt);
            if (!Number.isNaN(parsed.getTime())) {
              const hours = String(parsed.getHours()).padStart(2, '0');
              const minutes = String(parsed.getMinutes()).padStart(2, '0');
              setPublishTime(`${hours}:${minutes}`);
            }
          }
        } else if (response.status === 404) {
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
        const data = await response.json();
        setAllConfessions(data.confessions || []);
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

    const publishAt = `${date}T${publishTime}:00`;
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
        setErrorStatus('Unable to post confession. Please try again.');
        return;
      }

      setSuccessStatus('Confession posted.');
    } catch {
      setErrorStatus('Unable to post confession. Please try again.');
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
              accept="image/*"
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
              {loading ? 'Posting...' : 'Post Confession'}
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
          {allConfessions.length === 0 ? (
            <p className="text-sm text-foreground/60">
              No confessions yet.
            </p>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
              {allConfessions.map((confession) => (
                <button
                  key={String(confession.id)}
                  type="button"
                  onClick={() => {
                    const iso = confession.publishAt
                      ? String(confession.publishAt).slice(0, 10)
                      : '';
                    if (iso) setDate(iso);
                  }}
                  className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-left hover:border-primary/60 transition"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                    {confession.publishAt ? String(confession.publishAt).slice(0, 10) : 'Undated'}
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    {confession.title || 'Daily Confession'}
                  </p>
                </button>
              ))}
            </div>
          )}
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
            <AlertDialogTitle>Confirm Confession Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to post this confession{pendingDate && pendingTime ? ` for ${pendingDate} at ${pendingTime}` : ''}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPost} disabled={loading}>
              {loading ? 'Posting...' : 'Post'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
