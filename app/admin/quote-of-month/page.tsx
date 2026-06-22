'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { toast } from 'sonner';

export default function QuoteOfMonthAdminPage() {
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

  const [currentQuoteText, setCurrentQuoteText] = useState('');
  const [currentQuoteAuthor, setCurrentQuoteAuthor] = useState('');
  const [currentQuoteImageUrl, setCurrentQuoteImageUrl] = useState('');

  const [draftQuoteText, setDraftQuoteText] = useState('');
  const [draftQuoteAuthor, setDraftQuoteAuthor] = useState('');
  const [draftQuoteImageUrl, setDraftQuoteImageUrl] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchQuote = async () => {
      try {
        const response = await apiFetch('/api/quote-of-month');
        if (!response.ok) return;
        const data = await response.json();
        const quote = data.quote || '';
        const author = data.author || '';
        const imageUrl = data.imageUrl
          ? data.imageUrl.startsWith('http')
            ? data.imageUrl
            : apiUrl(data.imageUrl)
          : '';

        setCurrentQuoteText(quote);
        setCurrentQuoteAuthor(author);
        setCurrentQuoteImageUrl(imageUrl);

        // Pre-fill drafts to make edits easy, but the preview always reflects the saved/current values.
        setDraftQuoteText(quote);
        setDraftQuoteAuthor(author);
        setDraftQuoteImageUrl(imageUrl);
      } catch {
        // ignore
      }
    };

    fetchQuote();
  }, [token]);

  const uploadImage = async (file: File) => {
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
        setStatus('Image upload failed.');
        return null;
      }
      const data = await response.json();
      return apiUrl(data.url);
    } catch {
      setStatus('Image upload failed.');
      return null;
    }
  };

  const handleSaveQuote = async () => {
    if (!draftQuoteText.trim()) {
      setStatus('Please add a quote before saving.');
      return;
    }
    setStatus('');
    try {
      const response = await apiFetch('/api/quote-of-month', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quote: draftQuoteText,
          author: draftQuoteAuthor,
          imageUrl: draftQuoteImageUrl,
        }),
      });
      if (!response.ok) {
        setStatus('Unable to save quote of the month.');
        return;
      }

      const saved = await response.json().catch(() => null);
      const savedQuote = saved?.quote ? String(saved.quote) : draftQuoteText;
      const savedAuthor = saved?.author ? String(saved.author) : draftQuoteAuthor;
      const resolvedImageUrl = saved?.imageUrl
        ? String(saved.imageUrl).startsWith('http')
          ? String(saved.imageUrl)
          : apiUrl(String(saved.imageUrl))
        : draftQuoteImageUrl;

      setCurrentQuoteText(savedQuote);
      setCurrentQuoteAuthor(savedAuthor);
      setCurrentQuoteImageUrl(resolvedImageUrl || '');

      // After save: clear inputs like devotions/confessions; preview keeps showing saved values.
      setDraftQuoteText('');
      setDraftQuoteAuthor('');
      setDraftQuoteImageUrl('');
      setUploadName('');

      setStatus('Quote of the month updated.');
    } catch {
      setStatus('Unable to save quote of the month.');
    }
  };

  const handleDeleteQuote = async () => {
    if (!token) return;

    setIsDeleting(true);
    setStatus('');
    try {
      const response = await apiFetch('/api/quote-of-month', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok && response.status !== 204) {
        setStatus('Unable to delete quote of the month.');
        return;
      }

      setCurrentQuoteText('');
      setCurrentQuoteAuthor('');
      setCurrentQuoteImageUrl('');

      setDraftQuoteText('');
      setDraftQuoteAuthor('');
      setDraftQuoteImageUrl('');
      setUploadName('');
      setStatus('Quote of the month deleted.');
    } catch {
      setStatus('Unable to delete quote of the month.');
    } finally {
      setIsDeleting(false);
    }
  };

  const requestDeleteQuote = () => {
    const toastId = toast('Delete the current Quote of the Month?', {
      description: 'This action cannot be undone.',
      duration: Infinity,
      action: {
        label: 'Delete',
        onClick: () => {
          toast.dismiss(toastId);
          void handleDeleteQuote();
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => toast.dismiss(toastId),
      },
    });
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
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground">Qoutes</h1>
          <p className="text-foreground/70 mt-3 max-w-2xl">
            Refresh the monthly quote and its background image.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      {status && <p className="text-sm text-foreground/70">{status}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Quote
            </label>
            <textarea
              value={draftQuoteText}
              onChange={(event) => setDraftQuoteText(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Author
            </label>
            <input
              type="text"
              value={draftQuoteAuthor}
              onChange={(event) => setDraftQuoteAuthor(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Upload Quote Photo
            </label>
            <input
              type="file"
              accept="image/*,.heic,.heif,.avif"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const url = await uploadImage(file);
                if (url) {
                  setDraftQuoteImageUrl(url);
                  setUploadName(file.name);
                }
              }}
              className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
            />
          </div>
          <div>
            <Button
              variant="outline"
              onClick={() => {
                setDraftQuoteImageUrl('');
                setUploadName('');
              }}
            >
              Remove Quote Photo
            </Button>
          </div>
          {uploadName && (
            <p className="text-xs text-foreground/60">Selected: {uploadName}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSaveQuote}>Save Quote</Button>
            <Button
              variant="destructive"
              onClick={requestDeleteQuote}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Quote'}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground/50 mb-3">
            Preview
          </p>
          <div className="mb-4">
            <Link href="/quotes">
              <Button variant="outline" className="rounded-full">
                Search
              </Button>
            </Link>
          </div>
          <p className="text-lg font-semibold text-foreground mb-2">
            &ldquo;{currentQuoteText || 'Quote of the month'}&rdquo;
          </p>
          <p className="text-sm text-foreground/60">{currentQuoteAuthor || 'Author'}</p>
          {currentQuoteImageUrl && (
            <div
              className="mt-4 h-40 rounded-xl bg-cover bg-center"
              style={{ backgroundImage: `url(${currentQuoteImageUrl})` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
