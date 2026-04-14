'use client';

import { useEffect, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';

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
  const [quoteText, setQuoteText] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [quoteImageUrl, setQuoteImageUrl] = useState('');
  const [uploadName, setUploadName] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchQuote = async () => {
      try {
        const response = await apiFetch('/api/quote-of-month');
        if (!response.ok) return;
        const data = await response.json();
        setQuoteText(data.quote || '');
        setQuoteAuthor(data.author || '');
        const imageUrl = data.imageUrl
          ? data.imageUrl.startsWith('http')
            ? data.imageUrl
            : apiUrl(data.imageUrl)
          : '';
        setQuoteImageUrl(imageUrl);
      } catch (error) {
        // ignore
      }
    };

    fetchQuote();
  }, [token]);

  const uploadImage = async (file: File) => {
    if (!token) return null;
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
    } catch (error) {
      setStatus('Image upload failed.');
      return null;
    }
  };

  const handleSaveQuote = async () => {
    if (!quoteText.trim()) {
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
          quote: quoteText,
          author: quoteAuthor,
          imageUrl: quoteImageUrl,
        }),
      });
      if (!response.ok) {
        setStatus('Unable to save quote of the month.');
        return;
      }
      setStatus('Quote of the month updated.');
    } catch (error) {
      setStatus('Unable to save quote of the month.');
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
            Quote of the Month
          </h1>
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
              value={quoteText}
              onChange={(event) => setQuoteText(event.target.value)}
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
              value={quoteAuthor}
              onChange={(event) => setQuoteAuthor(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Upload Quote Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const url = await uploadImage(file);
                if (url) {
                  setQuoteImageUrl(url);
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
                setQuoteImageUrl('');
                setUploadName('');
              }}
            >
              Remove Quote Photo
            </Button>
          </div>
          {uploadName && (
            <p className="text-xs text-foreground/60">Selected: {uploadName}</p>
          )}
          <div>
            <Button onClick={handleSaveQuote}>Save Quote</Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground/50 mb-3">
            Preview
          </p>
          <p className="text-lg font-semibold text-foreground mb-2">
            &ldquo;{quoteText || 'Quote of the month'}&rdquo;
          </p>
          <p className="text-sm text-foreground/60">{quoteAuthor || 'Author'}</p>
          {quoteImageUrl && (
            <div
              className="mt-4 h-40 rounded-xl bg-cover bg-center"
              style={{ backgroundImage: `url(${quoteImageUrl})` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
