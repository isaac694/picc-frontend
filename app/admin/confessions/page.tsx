'use client';

import { useEffect, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useMediaUpload } from '@/hooks/use-media-upload';
import MediaUploadProgress from '@/components/admin/MediaUploadProgress';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  getDateTimeInputValueInMalawi,
  getTomorrowDateInputValueInMalawi,
  toMalawiIsoInstant,
} from '@/lib/timezone';
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
  } = useAdminAuth();

  const [confessionSearch, setConfessionSearch] = useState('');
  const [status, setStatus] = useState('');
  const [statusIsError, setStatusIsError] = useState(false);
  const [date, setDate] = useState(getTomorrowDateInputValueInMalawi);
  const [publishTime, setPublishTime] = useState('01:00');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadName, setUploadName] = useState('');
  const { runUpload, progress, uploading } = useMediaUpload();
  const [loading, setLoading] = useState(false);
  const [confessionId, setConfessionId] = useState<string | null>(null);
  const [allConfessions, setAllConfessions] = useState<ConfessionRecord[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPublishAt, setPendingPublishAt] = useState<string | null>(null);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [pendingTime, setPendingTime] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    if (!file.type.startsWith('image/')) {
      setErrorStatus('Please upload an image file (JPEG, PNG, GIF, WebP, etc.)');
      return null;
    }

    if (file.size > 1024 * 1024) {
      setErrorStatus('Your image file size is too big. Please compress it first before re uploading. Only pictures less than 1MB are allowed.');
      return null;
    }

    try {
      const url = await runUpload(file, 'page-images');
      return normalizeImageUrl(url);
    } catch (error) {
      setErrorStatus(error instanceof Error ? error.message : 'Image upload failed.');
      return null;
    }
  };

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

    const todayStr = getDateTimeInputValueInMalawi(new Date().toISOString())?.date || new Date().toISOString().slice(0, 10);
    if (!confessionId && date < todayStr) {
      setErrorStatus(
        'You cannot create confessions for past dates. Please select today or a future date.',
      );
      return;
    }

    const publishAt = toMalawiIsoInstant(date, publishTime);
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
      const isEditing = Boolean(confessionId);
      const endpoint = isEditing
        ? `/api/confessions/${encodeURIComponent(confessionId!)}`
        : '/api/confessions';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await apiFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          imageUrl,
          publishAt: pendingPublishAt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message =
          errorData && typeof errorData.error === 'string'
            ? errorData.error
            : 'Unable to save confession. Please try again.';
        setErrorStatus(message);
        return;
      }

      const payload = (await response.json().catch(() => null)) as unknown;
      const saved = normalizeConfession(payload);
      if (saved) {
        setConfessionId(saved.id);
      }

      setSuccessStatus(
        isEditing ? 'Confession updated successfully.' : 'Confession created successfully.',
      );
      setDialogOpen(false);
    } catch (error) {
      console.error('Confession save error:', error);
      setErrorStatus(
        error instanceof Error ? error.message : 'Unable to save confession.',
      );
    } finally {
      setLoading(false);
    }
  };

  const openNewDialog = () => {
    setDate(getTomorrowDateInputValueInMalawi());
    setPublishTime('01:00');
    setConfessionId(null);
    setTitle('');
    setImageUrl('');
    setUploadName('');
    clearStatus();
    setDialogOpen(true);
  };

  const openEditDialog = (confession: ConfessionRecord) => {
    clearStatus();
    const malawiDateTime = getDateTimeInputValueInMalawi(confession.publishAt);
    if (malawiDateTime) {
      setDate(malawiDateTime.date);
      setPublishTime(malawiDateTime.time);
    } else {
      setDate(confession.publishAt.slice(0, 10));
    }
    setConfessionId(confession.id);
    setTitle(confession.title || '');
    setImageUrl(confession.imageUrl);
    setUploadName('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  const requestDeleteConfirmation = (deleteId: string, labelDate?: string) => {
    confirmDeleteToast({
      title: 'Delete this confession?',
      description: labelDate ? `Confession for ${labelDate}` : 'This confession will be permanently removed.',
      onConfirm: () => handleConfirmDelete(deleteId),
    });
  };

  const handleConfirmDelete = async (deleteId: string) => {
    clearStatus();
    setLoading(true);

    try {
      const response = await apiFetch(`/api/confessions/${deleteId}`, {
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
      setDialogOpen(false);
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
        <Button type="button" onClick={openNewDialog} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add confession
        </Button>
      </div>

      {status && (
        <p className={statusIsError ? 'text-sm text-red-600' : 'text-sm text-foreground/70'}>
          {status}
        </p>
      )}

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
        }}
        title={hasExistingConfession ? 'Edit confession' : 'Add confession'}
        description="Upload and schedule a daily confession declaration."
        saving={loading}
        saveLabel={hasExistingConfession ? 'Save confession' : 'Post confession'}
        onSave={requestPostConfirmation}
        onCancel={closeDialog}
        maxWidthClass="sm:max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Publish Time</label>
              <input
                type="time"
                value={publishTime}
                onChange={(event) => setPublishTime(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              placeholder="Confession title (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Upload Confession Image</label>
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
            <MediaUploadProgress uploading={uploading} progress={progress} className="mt-2" />
            {uploadName ? (
              <p className="mt-2 text-xs text-foreground/60">Selected: {uploadName}</p>
            ) : null}
          </div>
          {hasExistingConfession ? (
            <Button
              type="button"
              variant="destructive"
              className="gap-2"
              onClick={() => requestDeleteConfirmation(confessionId!)}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
              Delete confession
            </Button>
          ) : null}
        </div>
      </SchoolAdminDialogShell>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Confessions</h2>
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
                  (c.title || '').toLowerCase().includes(query),
              )
            : allConfessions;

          return filtered.length === 0 ? (
            <p className="text-sm text-foreground/60">No confessions match your search.</p>
          ) : (
            <div className="max-h-[520px] overflow-auto rounded-xl border border-border/70">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-foreground/60">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Title</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((confession) => (
                    <tr key={confession.id} className="border-t border-border/60">
                      <td className="whitespace-nowrap px-3 py-2 text-foreground/70">{confession.publishAt.slice(0, 10)}</td>
                      <td className="px-3 py-2 font-medium text-foreground">{confession.title || 'Daily Confession'}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label={`Edit confession for ${confession.publishAt.slice(0, 10)}`}
                            onClick={() => openEditDialog(confession)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            aria-label={`Delete confession for ${confession.publishAt.slice(0, 10)}`}
                            onClick={() =>
                              requestDeleteConfirmation(confession.id, confession.publishAt.slice(0, 10))
                            }
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
          );
        })()}
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

    </div>
  );
}
