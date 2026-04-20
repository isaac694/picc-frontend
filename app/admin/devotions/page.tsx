'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
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

export default function DevotionsAdminPage() {
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
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [publishTime, setPublishTime] = useState('01:00');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [allDevotions, setAllDevotions] = useState<any[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPublishAt, setPendingPublishAt] = useState<string | null>(null);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [pendingTime, setPendingTime] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchDevotion = async () => {
      setLoading(true);
      setStatus('');
      try {
        const response = await apiFetch(`/api/devotions?date=${date}`);
        if (response.ok) {
          const data = await response.json();
          setTitle(data.title || '');
          setContent(data.content || '');
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
          setContent('');
        } else {
          setStatus('Unable to load devotion for that date.');
        }
      } catch (error) {
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
        const data = await response.json();
        setAllDevotions(data.devotions || []);
      } catch (error) {
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

    const todayStr = new Date().toISOString().slice(0, 10);
    if (date < todayStr) {
      setStatus('You cannot post devotions for past dates. Please select today or a future date.');
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
        setStatus('Unable to post devotion. Please try again.');
        return;
      }

      setStatus('Devotion posted.');
    } catch (error) {
      setStatus('Unable to post devotion. Please try again.');
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
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      {status && (
        <p className="text-sm text-foreground/70">{status}</p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
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
              placeholder="Devotion title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={10}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              placeholder="Write today’s devotion..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={requestPostConfirmation} disabled={loading}>
              {loading ? 'Posting...' : 'Post Devotion'}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Recent Devotions
          </h2>
          {allDevotions.length === 0 ? (
            <p className="text-sm text-foreground/60">
              No devotions yet.
            </p>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
              {allDevotions.map((devotion) => (
                <button
                  key={devotion.id}
                  type="button"
                  onClick={() => setDate(String(devotion.date).slice(0, 10))}
                  className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-left hover:border-primary/60 transition"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                    {String(devotion.date).slice(0, 10)}
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    {devotion.title || 'Untitled devotion'}
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
            <AlertDialogTitle>Confirm Devotion Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to post this devotion{pendingDate && pendingTime ? ` for ${pendingDate} at ${pendingTime}` : ''}?
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
