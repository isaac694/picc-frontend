'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { SchoolAdminDialogShell, SchoolAdminStatusBanner } from '@/components/admin/school-admin-dialog-shell';
import {
  formatQuoteMonth,
  getUtcYearMonth,
  monthInputValue,
  normalizeQuoteRecord,
  parseMonthInput,
  quoteImagePathForApi,
  resolveQuoteImageUrl,
  type QuoteRecord,
} from '@/lib/quotes';
import { CalendarDays, ExternalLink, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

type QuoteDraft = {
  quote: string;
  author: string;
  imageUrl: string;
  activeYear: number;
  activeMonth: number;
};

const ADMIN_QUOTES = '/api/admin/quotes';

function emptyDraft(): QuoteDraft {
  const { year, month } = getUtcYearMonth();
  return {
    quote: '',
    author: '',
    imageUrl: '',
    activeYear: year,
    activeMonth: month,
  };
}

export default function QuoteOfMonthManager({ token }: { token: string }) {
  const [status, setStatus] = useState('');
  const [dialogStatus, setDialogStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [liveQuote, setLiveQuote] = useState<QuoteRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<QuoteDraft>(emptyDraft);
  const [uploadName, setUploadName] = useState('');

  const utcNow = getUtcYearMonth();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setStatus('');
    try {
      const [adminRes, publicRes] = await Promise.all([
        apiFetch(ADMIN_QUOTES, { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch('/api/quote-of-month'),
      ]);

      if (adminRes.ok) {
        const data = (await adminRes.json().catch(() => ({}))) as { quotes?: unknown[] };
        const list = Array.isArray(data.quotes)
          ? data.quotes.map(normalizeQuoteRecord).filter((q): q is QuoteRecord => Boolean(q))
          : [];
        list.sort((a, b) => b.activeYear - a.activeYear || b.activeMonth - a.activeMonth);
        setQuotes(list);
      } else {
        setQuotes([]);
        setStatus('Unable to load scheduled quotes.');
      }

      if (publicRes.ok) {
        setLiveQuote(normalizeQuoteRecord(await publicRes.json()));
      } else {
        setLiveQuote(null);
      }
    } catch {
      setQuotes([]);
      setLiveQuote(null);
      setStatus('Unable to load scheduled quotes.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void refresh();
  }, [refresh]);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setDraft(emptyDraft());
    setDialogStatus('');
    setUploadName('');
  };

  const openAddDialog = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setDialogStatus('');
    setUploadName('');
    setDialogOpen(true);
  };

  const openEditDialog = (item: QuoteRecord) => {
    setEditingId(item.id);
    setDraft({
      quote: item.quote,
      author: item.author || '',
      imageUrl: resolveQuoteImageUrl(item.imageUrl),
      activeYear: item.activeYear,
      activeMonth: item.activeMonth,
    });
    setDialogStatus('');
    setUploadName('');
    setDialogOpen(true);
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/') && !/\.(jpe?g|png|gif|webp|avif|heic|heif)$/i.test(file.name)) {
      setDialogStatus('Please upload an image file.');
      return null;
    }
    if (file.size > 1024 * 1024) {
      setDialogStatus(
        'Your image file size is too big. Please compress it first before re-uploading. Only pictures less than 1MB are allowed.',
      );
      return null;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiFetch('/api/uploads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setDialogStatus(data?.error || 'Image upload failed.');
        return null;
      }
      const data = (await response.json()) as { url?: string };
      const path = typeof data.url === 'string' ? data.url.trim() : '';
      if (!path.startsWith('/uploads/')) {
        setDialogStatus('Upload did not return a server uploads path.');
        return null;
      }
      return path;
    } catch {
      setDialogStatus('Image upload failed.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const save = async () => {
    if (!draft.quote.trim()) {
      setDialogStatus('Please enter the quote text.');
      return;
    }

    setSaving(true);
    setDialogStatus('');

    const payload = {
      quote: draft.quote.trim(),
      author: draft.author.trim() || undefined,
      imageUrl: draft.imageUrl ? quoteImagePathForApi(draft.imageUrl) : null,
      activeYear: draft.activeYear,
      activeMonth: draft.activeMonth,
      activeDate: monthInputValue(draft.activeYear, draft.activeMonth),
    };

    try {
      const url = editingId ? `${ADMIN_QUOTES}/${encodeURIComponent(editingId)}` : ADMIN_QUOTES;
      const method = editingId ? 'PUT' : 'POST';
      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 409) {
        setDialogStatus('A quote is already scheduled for that month. Edit that entry instead.');
        return;
      }

      if (!response.ok) {
        setDialogStatus(editingId ? 'Unable to update quote.' : 'Unable to create quote.');
        return;
      }

      const wasEdit = Boolean(editingId);
      closeDialog();
      await refresh();
      setStatus(`Quote ${wasEdit ? 'updated' : 'scheduled'}.`);
    } catch {
      setDialogStatus(editingId ? 'Unable to update quote.' : 'Unable to create quote.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    setStatus('');
    try {
      const response = await apiFetch(`${ADMIN_QUOTES}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok && response.status !== 204) {
        setStatus('Unable to delete quote.');
        return;
      }
      if (editingId === id) closeDialog();
      await refresh();
      setStatus('Quote deleted.');
    } catch {
      setStatus('Unable to delete quote.');
    } finally {
      setDeletingId(null);
    }
  };

  const requestRemove = (item: QuoteRecord) => {
    confirmDeleteToast({
      title: 'Delete this scheduled quote?',
      description: formatQuoteMonth(item.activeYear, item.activeMonth),
      onConfirm: () => void remove(item.id),
    });
  };

  const filteredQuotes = useMemo(() => {
    if (!searchTerm.trim()) return quotes;
    const q = searchTerm.toLowerCase();
    return quotes.filter(
      (item) =>
        item.quote.toLowerCase().includes(q) ||
        (item.author || '').toLowerCase().includes(q) ||
        formatQuoteMonth(item.activeYear, item.activeMonth).toLowerCase().includes(q),
    );
  }, [quotes, searchTerm]);

  const isDialogError =
    Boolean(dialogStatus) &&
    (dialogStatus.includes('Unable') ||
      dialogStatus.includes('Please') ||
      dialogStatus.includes('already scheduled'));

  const draftPreviewImage = draft.imageUrl
    ? draft.imageUrl.startsWith('/uploads/')
      ? resolveQuoteImageUrl(draft.imageUrl)
      : draft.imageUrl
    : '';

  const formFields = (
    <div className="space-y-4">
      {dialogStatus ? (
        <div
          className={`rounded-xl p-3 text-sm ${
            isDialogError ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          }`}
        >
          {dialogStatus}
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
          Schedule month (UTC) *
        </label>
        <input
          type="month"
          value={monthInputValue(draft.activeYear, draft.activeMonth)}
          onChange={(event) => {
            const parsed = parseMonthInput(event.target.value);
            if (!parsed) return;
            setDraft((prev) => ({ ...prev, activeYear: parsed.year, activeMonth: parsed.month }));
          }}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-1 text-xs text-foreground/55">
          Homepage shows the quote for the current UTC month ({formatQuoteMonth(utcNow.year, utcNow.month)}).
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
          Quote *
        </label>
        <textarea
          value={draft.quote}
          onChange={(event) => setDraft((prev) => ({ ...prev, quote: event.target.value }))}
          rows={5}
          placeholder="The quote text shown on the homepage and archive…"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
          Author
        </label>
        <input
          type="text"
          value={draft.author}
          onChange={(event) => setDraft((prev) => ({ ...prev, author: event.target.value }))}
          placeholder="e.g. Pastor Esau Banda"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
          Background image
        </label>
        <input
          type="file"
          accept="image/*,.heic,.heif,.avif"
          disabled={uploadingImage || saving}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = '';
            if (!file) return;
            const path = await uploadImage(file);
            if (!path) return;
            setDraft((prev) => ({ ...prev, imageUrl: resolveQuoteImageUrl(path) }));
            setUploadName(file.name);
          }}
          className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
        />
        {uploadName ? <p className="mt-2 text-xs text-foreground/60">Selected: {uploadName}</p> : null}
        {draftPreviewImage ? (
          <div
            className="mt-3 h-32 rounded-xl bg-cover bg-center border border-border/60"
            style={{ backgroundImage: `url(${draftPreviewImage})` }}
          />
        ) : null}
        {draft.imageUrl ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              setDraft((prev) => ({ ...prev, imageUrl: '' }));
              setUploadName('');
            }}
          >
            Remove image
          </Button>
        ) : null}
      </div>

      {editingId ? (
        <Button
          type="button"
          variant="destructive"
          className="gap-2"
          onClick={() => {
            const item = quotes.find((q) => q.id === editingId);
            if (item) requestRemove(item);
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete quote
        </Button>
      ) : null}
    </div>
  );

  if (isLoading && quotes.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const liveImage = liveQuote ? resolveQuoteImageUrl(liveQuote.imageUrl) : '';

  return (
    <div className="space-y-6">
      <SchoolAdminStatusBanner status={status} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Scheduled quotes</h2>
              <p className="text-sm text-foreground/60">One quote per calendar month (UTC).</p>
            </div>
            <Button type="button" className="shrink-0 gap-2" onClick={openAddDialog}>
              <Plus className="h-4 w-4" />
              Add quote
            </Button>
          </div>

          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by month, quote, or author…"
            className="mb-4 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/20"
          />

          {filteredQuotes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 py-12 text-center">
              <p className="text-sm text-foreground/60">
                {searchTerm ? 'No quotes match your search.' : 'No quotes scheduled yet.'}
              </p>
              {!searchTerm ? (
                <Button type="button" onClick={openAddDialog} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Schedule a quote
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="max-h-[560px] space-y-3 overflow-y-auto pr-2">
              {filteredQuotes.map((item) => {
                const isLive =
                  item.activeYear === utcNow.year && item.activeMonth === utcNow.month;
                const thumb = resolveQuoteImageUrl(item.imageUrl);
                return (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-xl border border-border/60 bg-background p-4"
                  >
                    {thumb ? (
                      <div
                        className="hidden h-20 w-20 shrink-0 rounded-lg bg-cover bg-center sm:block"
                        style={{ backgroundImage: `url(${thumb})` }}
                      />
                    ) : (
                      <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/30 sm:flex">
                        <CalendarDays className="h-5 w-5 text-foreground/35" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-primary">
                          {formatQuoteMonth(item.activeYear, item.activeMonth)}
                        </p>
                        {isLive ? (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                            Live on homepage
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-foreground">&ldquo;{item.quote}&rdquo;</p>
                      <p className="mt-1 text-xs text-foreground/55">{item.author || 'No author'}</p>
                    </div>
                    <div className="flex shrink-0 items-start gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit quote for ${formatQuoteMonth(item.activeYear, item.activeMonth)}`}
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Delete quote for ${formatQuoteMonth(item.activeYear, item.activeMonth)}`}
                        disabled={deletingId === item.id}
                        onClick={() => requestRemove(item)}
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <p className="mb-1 text-xs uppercase tracking-[0.3em] text-foreground/50">Homepage preview</p>
          <p className="mb-4 text-sm text-foreground/60">
            {formatQuoteMonth(utcNow.year, utcNow.month)} (current UTC month)
          </p>
          {liveQuote ? (
            <>
              <p className="text-lg font-semibold leading-snug text-foreground">
                &ldquo;{liveQuote.quote}&rdquo;
              </p>
              <p className="mt-2 text-sm text-foreground/60">{liveQuote.author || 'Author'}</p>
              {liveImage ? (
                <div
                  className="mt-4 h-40 rounded-xl bg-cover bg-center"
                  style={{ backgroundImage: `url(${liveImage})` }}
                />
              ) : null}
            </>
          ) : (
            <p className="text-sm text-foreground/60 italic">No quote scheduled for this month yet.</p>
          )}
          <Link href="/quotes" className="mt-6 inline-flex">
            <Button type="button" variant="outline" className="gap-2 rounded-full">
              <ExternalLink className="h-4 w-4" />
              View quotes archive
            </Button>
          </Link>
        </div>
      </div>

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={(open) => {
          if (open) {
            setDialogOpen(true);
            return;
          }
          closeDialog();
        }}
        title={editingId ? 'Edit scheduled quote' : 'Schedule a quote'}
        description={
          editingId
            ? 'Update the quote, author, month, or background image.'
            : 'Pick a month and add the quote shown on the homepage for that period.'
        }
        saving={saving || uploadingImage}
        saveLabel={editingId ? 'Save changes' : 'Schedule quote'}
        onSave={() => void save()}
        onCancel={closeDialog}
        maxWidthClass="sm:max-w-2xl"
      >
        {formFields}
      </SchoolAdminDialogShell>
    </div>
  );
}
