'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
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

type DevotionRecord = {
  id: string;
  publishAt: string;
  title: string | null;
  content: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeDevotion = (value: unknown): DevotionRecord | null => {
  if (!isRecord(value)) return null;

  const id = typeof value.id === 'string' ? value.id : String(value.id ?? '');
  const publishAt = value.publishAt ? String(value.publishAt) : '';
  const title = typeof value.title === 'string' ? value.title : null;
  const content = typeof value.content === 'string' ? value.content : '';

  if (!id || !publishAt) return null;
  return { id, publishAt, title, content };
};

export default function DevotionsAdminPage() {
  const {
    token,
    email,
    password,
    loginError,
    setEmail,
    setPassword,
    handleLogin,
  } = useAdminAuth();

  const [devotionSearch, setDevotionSearch] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState(getTomorrowDateInputValueInMalawi);
  const [publishTime, setPublishTime] = useState('01:00');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [devotionId, setDevotionId] = useState<string | null>(null);
  const [allDevotions, setAllDevotions] = useState<DevotionRecord[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPublishAt, setPendingPublishAt] = useState<string | null>(null);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [pendingTime, setPendingTime] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasExistingDevotion = Boolean(devotionId);

  useEffect(() => {
    if (!token) return;

    const fetchDevotion = async () => {
      setLoading(true);
      setStatus('');
      try {
        const response = await apiFetch(`/api/devotions?date=${date}`);
        if (response.ok) {
          const data = (await response.json().catch(() => null)) as unknown;
          const devotion = normalizeDevotion(data);
          if (!devotion) {
            setStatus('Unable to load devotion for that date.');
            setDevotionId(null);
            setTitle('');
            setContent('');
            return;
          }

          setDevotionId(devotion.id);
          setTitle(devotion.title || '');
          setContent(devotion.content || '');

          if (devotion.publishAt) {
            const parsed = new Date(devotion.publishAt);
            if (!Number.isNaN(parsed.getTime())) {
              const malawiDateTime = getDateTimeInputValueInMalawi(devotion.publishAt);
              if (malawiDateTime) {
                setDate(malawiDateTime.date);
                setPublishTime(malawiDateTime.time);
              }
            }
          }
        } else if (response.status === 404) {
          setDevotionId(null);
          setTitle('');
          setContent('');
        } else {
          setStatus('Unable to load devotion for that date.');
        }
      } catch {
        setStatus('Unable to load devotion for that date.');
      } finally {
        setLoading(false);
      }
    };

    fetchDevotion();
  }, [token, date]);

  useEffect(() => {
    if (!token) return;

    const fetchAllDevotions = async () => {
      try {
        const response = await apiFetch('/api/devotions/admin?take=500', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = (await response.json().catch(() => null)) as unknown;
        const list = isRecord(data) && Array.isArray(data.devotions) ? data.devotions : [];
        const normalized = list
          .map(normalizeDevotion)
          .filter((item): item is DevotionRecord => Boolean(item));
        setAllDevotions(normalized);
      } catch {
        setAllDevotions([]);
      }
    };

    fetchAllDevotions();
  }, [token, status]);

  const requestPostConfirmation = () => {
    if (!content.trim()) {
      setStatus('Please add devotion content before posting.');
      return;
    }

    const todayStr = getDateTimeInputValueInMalawi(new Date().toISOString())?.date || new Date().toISOString().slice(0, 10);
    if (date < todayStr) {
      setStatus('You cannot post devotions for past dates. Please select today or a future date.');
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

    setStatus('');
    setLoading(true);
    setConfirmOpen(false);

    try {
      const response = await apiFetch('/api/devotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date, title, content, publishAt: pendingPublishAt }),
      });

      if (!response.ok) {
        setStatus('Unable to save devotion. Please try again.');
        return;
      }

      const payload = (await response.json().catch(() => null)) as unknown;
      const saved = normalizeDevotion(payload);
      if (saved) {
        setDevotionId(saved.id);
      }

      setStatus('Devotion saved.');
      setDialogOpen(false);
    } catch {
      setStatus('Unable to save devotion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openNewDialog = () => {
    setDate(getTomorrowDateInputValueInMalawi());
    setPublishTime('01:00');
    setDevotionId(null);
    setTitle('');
    setContent('');
    setStatus('');
    setDialogOpen(true);
  };

  const openEditDialog = (devotion: DevotionRecord) => {
    setStatus('');
    const malawiDateTime = getDateTimeInputValueInMalawi(devotion.publishAt);
    if (malawiDateTime) {
      setDate(malawiDateTime.date);
      setPublishTime(malawiDateTime.time);
    } else {
      setDate(devotion.publishAt.slice(0, 10));
    }
    setDevotionId(devotion.id);
    setTitle(devotion.title || '');
    setContent(devotion.content || '');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  const requestDeleteConfirmation = (deleteId: string, labelDate?: string) => {
    confirmDeleteToast({
      title: 'Delete this devotion?',
      description: labelDate ? `Devotion for ${labelDate}` : 'This devotion will be permanently removed.',
      onConfirm: () => handleConfirmDelete(deleteId),
    });
  };

  const handleConfirmDelete = async (deleteId: string) => {
    setStatus('');
    setLoading(true);

    try {
      const response = await apiFetch(`/api/devotions/${deleteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 405) {
          setStatus('Delete is not supported by the backend yet.');
          return;
        }
        setStatus('Unable to delete devotion. Please try again.');
        return;
      }

      setDevotionId(null);
      setTitle('');
      setContent('');
      setStatus('Devotion deleted.');
      setDialogOpen(false);
    } catch {
      setStatus('Unable to delete devotion. Please try again.');
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
            Daily Devotions
          </h1>
          <p className="text-foreground/70 mt-3 max-w-2xl">
            Write and schedule devotionals for the church family.
          </p>
        </div>
        <Button type="button" onClick={openNewDialog} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add devotion
        </Button>
      </div>

      {status && (
        <p className="text-sm text-foreground/70">{status}</p>
      )}

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={hasExistingDevotion ? 'Edit devotion' : 'Add devotion'}
        description="Write and schedule a devotional for the church family."
        saving={loading}
        saveLabel={hasExistingDevotion ? 'Save devotion' : 'Post devotion'}
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
              placeholder="Devotion title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Content</label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={10}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              placeholder="Write today's devotion..."
            />
          </div>
          {hasExistingDevotion ? (
            <Button
              type="button"
              variant="destructive"
              className="gap-2"
              onClick={() => requestDeleteConfirmation(devotionId!)}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
              Delete devotion
            </Button>
          ) : null}
        </div>
      </SchoolAdminDialogShell>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Devotions</h2>
        <div className="mb-4">
          <input
            type="search"
            value={devotionSearch}
            onChange={(e) => setDevotionSearch(e.target.value)}
            placeholder="Search by title or date..."
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40"
          />
        </div>
        {allDevotions.length === 0 ? (
          <p className="text-sm text-foreground/60">No devotions yet.</p>
        ) : (() => {
          const query = devotionSearch.trim().toLowerCase();
          const filtered = query
            ? allDevotions.filter(
                (d) =>
                  d.publishAt.slice(0, 10).includes(query) ||
                  (d.title || '').toLowerCase().includes(query),
              )
            : allDevotions;

          return filtered.length === 0 ? (
            <p className="text-sm text-foreground/60">No devotions match your search.</p>
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
                  {filtered.map((devotion) => (
                    <tr key={devotion.id} className="border-t border-border/60">
                      <td className="whitespace-nowrap px-3 py-2 text-foreground/70">{devotion.publishAt.slice(0, 10)}</td>
                      <td className="px-3 py-2 font-medium text-foreground">{devotion.title || 'Untitled devotion'}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label={`Edit devotion for ${devotion.publishAt.slice(0, 10)}`}
                            onClick={() => openEditDialog(devotion)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            aria-label={`Delete devotion for ${devotion.publishAt.slice(0, 10)}`}
                            onClick={() =>
                              requestDeleteConfirmation(devotion.id, devotion.publishAt.slice(0, 10))
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
            <AlertDialogTitle>Confirm Devotion Save</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save this devotion{pendingDate && pendingTime ? ` for ${pendingDate} at ${pendingTime}` : ''}?
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
