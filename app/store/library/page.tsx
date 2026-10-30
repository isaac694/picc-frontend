'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookCheck,
  BookMarked,
  BookOpen,
  BookOpenText,
  Library,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import StoreMobileNav from '@/components/store/StoreMobileNav';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';
import ProtectedBookReader, { type ReadingProgress } from '@/components/store/ProtectedBookReader';

type LibraryPurchase = {
  id: string;
  productId: string;
  title: string;
  author?: string | null;
  genre?: string | null;
  imageUrl?: string | null;
  price: number;
  status: 'pending' | 'available' | 'cancelled';
  paidAt?: string | null;
  createdAt: string;
  bookContent?: string | null;
  downloadUrl?: string | null;
  canRead?: boolean;
  lastPage?: number | null;
  pageCount?: number | null;
  readingStartedAt?: string | null;
  lastReadAt?: string | null;
  finishedAt?: string | null;
};

type ReadingState = 'new' | 'reading' | 'finished';
type ShelfTab = 'all' | ReadingState;

const STORE_TOKEN_KEY = 'store_token';
const STORE_USER_KEY = 'store_user';

const TABS: { key: ShelfTab; label: string; empty: string }[] = [
  { key: 'all', label: 'All books', empty: 'Books you buy as soft copies will appear here.' },
  { key: 'new', label: 'Not started', empty: 'Every book you own has been opened. Nice work.' },
  { key: 'reading', label: 'Reading now', empty: 'Open a book and it will wait for you here.' },
  { key: 'finished', label: 'Finished', empty: 'Books you read to the last page will appear here.' },
];

function splitContent(content?: string | null) {
  const source = content?.trim() || '';
  return source
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function readingState(book: LibraryPurchase): ReadingState {
  if (book.finishedAt) return 'finished';
  if (book.readingStartedAt || (book.lastPage ?? 0) > 1) return 'reading';
  return 'new';
}

function progressPercent(book: LibraryPurchase) {
  if (book.finishedAt) return 100;
  if (!book.pageCount || !book.lastPage) return 0;
  return Math.min(100, Math.round((book.lastPage / book.pageCount) * 100));
}

function canOpen(book: LibraryPurchase) {
  return Boolean(book.canRead || splitContent(book.bookContent).length);
}

function BookCover({ book, sizes, className = '' }: { book: LibraryPurchase; sizes: string; className?: string }) {
  return (
    <div className={`relative aspect-[3/4] overflow-hidden rounded-r-md bg-slate-800 shadow-[0_14px_30px_-14px_rgba(15,23,42,0.6)] ${className}`}>
      {book.imageUrl ? (
        <Image src={book.imageUrl} alt={book.title} fill sizes={sizes} className="object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1688b4] to-slate-900 p-4 text-center text-sm font-bold leading-tight text-white">
          {book.title}
        </span>
      )}
      <span className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/35 to-transparent" />
    </div>
  );
}

function ProgressBar({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'done' }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${tone === 'done' ? 'bg-emerald-500' : 'bg-[#1688b4]'}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export default function StoreLibraryPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<LibraryPurchase[]>([]);
  const [tab, setTab] = useState<ShelfTab>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reader, setReader] = useState<{ book: LibraryPurchase; initialPage: number } | null>(null);
  const [textBook, setTextBook] = useState<LibraryPurchase | null>(null);

  const fetchLibrary = useCallback(async (authToken: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/store/library', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.status === 401) {
        localStorage.removeItem(STORE_TOKEN_KEY);
        localStorage.removeItem(STORE_USER_KEY);
        setToken(null);
        setPurchases([]);
        return;
      }

      if (!response.ok) {
        setError('Unable to load your books right now.');
        return;
      }

      const data = await response.json();
      setPurchases(
        (Array.isArray(data?.purchases) ? data.purchases : []).filter(
          (purchase: LibraryPurchase) => purchase.status === 'available',
        ),
      );
    } catch {
      setError('Unable to load your books right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      const storedToken = localStorage.getItem(STORE_TOKEN_KEY);
      setToken(storedToken);
      if (storedToken) {
        void fetchLibrary(storedToken);
      } else {
        setIsLoading(false);
      }
    }, 0);
    return () => clearTimeout(id);
  }, [fetchLibrary]);

  const mergeBook = useCallback((id: string, changes: Partial<LibraryPurchase>) => {
    setPurchases((current) => current.map((book) => (book.id === id ? { ...book, ...changes } : book)));
  }, []);

  const saveProgress = useCallback(
    async (id: string, body: Record<string, unknown>) => {
      if (!token) return;
      try {
        const response = await apiFetch(`/api/store/library/${encodeURIComponent(id)}/progress`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        const data = await response.json().catch(() => null);
        const saved = data?.purchase as LibraryPurchase | undefined;
        if (response.ok && saved) {
          mergeBook(id, {
            lastPage: saved.lastPage,
            pageCount: saved.pageCount,
            readingStartedAt: saved.readingStartedAt,
            lastReadAt: saved.lastReadAt,
            finishedAt: saved.finishedAt,
          });
        }
      } catch {
        // The page is already updated locally; the next save will catch the server up.
      }
    },
    [mergeBook, token],
  );

  const handleProgress = useCallback(
    (id: string, progress: ReadingProgress) => {
      const now = new Date().toISOString();
      setPurchases((current) =>
        current.map((book) =>
          book.id === id
            ? {
                ...book,
                lastPage: progress.page,
                pageCount: progress.pageCount,
                lastReadAt: now,
                readingStartedAt: book.readingStartedAt || now,
                finishedAt: book.finishedAt || (progress.page >= progress.pageCount ? now : null),
              }
            : book,
        ),
      );
      void saveProgress(id, progress);
    },
    [saveProgress],
  );

  const openBook = (book: LibraryPurchase) => {
    if (book.canRead) {
      setReader({ book, initialPage: book.finishedAt ? 1 : book.lastPage || 1 });
    } else if (splitContent(book.bookContent).length) {
      setTextBook(book);
    }
  };

  const readAgain = async (book: LibraryPurchase) => {
    mergeBook(book.id, { finishedAt: null, lastPage: 1 });
    void saveProgress(book.id, { restart: true });
    if (book.canRead) setReader({ book: { ...book, finishedAt: null, lastPage: 1 }, initialPage: 1 });
    else setTextBook(book);
  };

  const markTextFinished = (book: LibraryPurchase) => {
    const now = new Date().toISOString();
    mergeBook(book.id, { lastPage: 1, pageCount: 1, readingStartedAt: book.readingStartedAt || now, lastReadAt: now, finishedAt: now });
    void saveProgress(book.id, { page: 1, pageCount: 1, finished: true });
    setTextBook(null);
  };

  const shelves = useMemo(() => {
    const groups: Record<ShelfTab, LibraryPurchase[]> = { all: purchases, new: [], reading: [], finished: [] };
    for (const book of purchases) groups[readingState(book)].push(book);
    groups.reading.sort((a, b) => String(b.lastReadAt || '').localeCompare(String(a.lastReadAt || '')));
    return groups;
  }, [purchases]);

  const continueBook = shelves.reading[0] || null;
  const visibleBooks = shelves[tab];
  const activeTab = TABS.find((item) => item.key === tab) || TABS[0];
  const textBlocks = splitContent(textBook?.bookContent);

  const stats = [
    { key: 'owned', label: 'Books bought', value: purchases.length, hint: 'Soft copies in your library', icon: Library },
    { key: 'finished', label: 'Books finished', value: shelves.finished.length, hint: 'Read to the last page', icon: BookCheck },
    { key: 'reading', label: 'Still reading', value: shelves.reading.length, hint: 'Picked up and in progress', icon: BookOpenText },
    { key: 'new', label: 'Not started', value: shelves.new.length, hint: 'Waiting on your shelf', icon: Sparkles },
  ];

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#f7f7fb] pb-20 text-slate-950 md:pb-0">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/store" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
                <ArrowLeft className="h-4 w-4" />
                Back to Hope Stores
              </Link>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">My Library</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Every soft copy you buy lives here. Close a book any time and it opens again on the page you left.
              </p>
            </div>
            {token && (
              <Button variant="outline" onClick={() => fetchLibrary(token)} disabled={isLoading} className="gap-2 rounded-md">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>

          {!token ? (
            <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <LockKeyhole className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-4 text-xl font-bold">Sign in to view My Library</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                Your library is connected to the account used during soft-copy checkout.
              </p>
              <Button className="mt-5 rounded-md bg-[#1688b4] text-white hover:bg-[#0f759c]" onClick={() => router.push('/store')}>
                Go to store sign in
              </Button>
            </section>
          ) : (
            <>
              {error && <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

              <section aria-label="Reading summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1688b4]/10 text-[#1688b4]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
                      <p className="mt-1 text-3xl font-bold leading-none tabular-nums">{isLoading ? '—' : stat.value}</p>
                      <p className="mt-2 text-xs text-slate-500">{stat.hint}</p>
                    </div>
                  );
                })}
              </section>

              {continueBook ? (
                <section className="overflow-hidden rounded-xl bg-slate-950 text-white">
                  <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
                    <BookCover book={continueBook} sizes="128px" className="w-28 shrink-0 sm:w-32" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#63d5bc]">Continue reading</p>
                      <h2 className="mt-2 text-2xl font-bold leading-tight md:text-3xl">{continueBook.title}</h2>
                      <p className="mt-1 text-sm text-white/60">{continueBook.author || 'Hope Stores'}</p>
                      <div className="mt-5 max-w-md">
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                          <div className="h-full rounded-full bg-[#63d5bc]" style={{ width: `${progressPercent(continueBook)}%` }} />
                        </div>
                        <p className="mt-2 text-xs text-white/60">
                          {continueBook.pageCount
                            ? `Page ${continueBook.lastPage || 1} of ${continueBook.pageCount} · ${progressPercent(continueBook)}% read`
                            : 'Started'}
                          {continueBook.lastReadAt ? ` · Last read ${formatDate(continueBook.lastReadAt)}` : ''}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => openBook(continueBook)}
                      className="gap-2 self-start rounded-md bg-[#1688b4] px-5 text-white hover:bg-[#0f759c] sm:self-center"
                    >
                      <BookOpen className="h-4 w-4" />
                      {continueBook.lastPage && continueBook.lastPage > 1 ? `Continue from page ${continueBook.lastPage}` : 'Continue'}
                    </Button>
                  </div>
                </section>
              ) : null}

              <section className="space-y-5">
                <div role="tablist" aria-label="Library shelves" className="flex gap-1 overflow-x-auto border-b border-slate-200">
                  {TABS.map((item) => {
                    const selected = tab === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => setTab(item.key)}
                        className={`-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                          selected ? 'border-[#1688b4] text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {item.label}
                        <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${selected ? 'bg-[#1688b4] text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {shelves[item.key].length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {isLoading ? (
                  <p className="py-12 text-center text-sm text-slate-500">Loading your books...</p>
                ) : visibleBooks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                    <BookMarked className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-4 text-sm text-slate-600">{activeTab.empty}</p>
                    {purchases.length === 0 ? (
                      <Link href="/store" className="mt-4 inline-block text-sm font-semibold text-[#1688b4] hover:underline">
                        Browse the store
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {visibleBooks.map((book) => {
                      const state = readingState(book);
                      const percent = progressPercent(book);
                      const openable = canOpen(book);
                      return (
                        <li key={book.id} className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => openBook(book)}
                            disabled={!openable}
                            className="group relative block text-left transition duration-300 enabled:hover:-translate-y-1 disabled:cursor-not-allowed"
                            aria-label={`Open ${book.title}`}
                          >
                            <BookCover book={book} sizes="(min-width: 1280px) 220px, (min-width: 640px) 30vw, 45vw" />
                            {state === 'finished' ? (
                              <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-bold uppercase text-white">
                                <BookCheck className="h-3 w-3" />
                                Finished
                              </span>
                            ) : state === 'new' ? (
                              <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold uppercase text-slate-800">New</span>
                            ) : null}
                            {openable ? (
                              <span className="absolute inset-0 flex items-center justify-center rounded-r-md bg-slate-950/55 opacity-0 transition group-hover:opacity-100">
                                <BookOpen className="h-8 w-8 text-white" />
                              </span>
                            ) : null}
                          </button>
                          <div className="mt-3 flex flex-1 flex-col">
                            <p className="line-clamp-2 text-sm font-semibold leading-snug">{book.title}</p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">{book.author || 'Hope Stores'}</p>
                            <div className="mt-3">
                              <ProgressBar value={percent} tone={state === 'finished' ? 'done' : 'brand'} />
                              <p className="mt-1.5 text-xs text-slate-500">
                                {!openable
                                  ? 'File coming soon'
                                  : state === 'finished'
                                    ? `Finished ${formatDate(book.finishedAt)}`
                                    : state === 'reading'
                                      ? book.pageCount
                                        ? `Page ${book.lastPage || 1} of ${book.pageCount} · ${percent}%`
                                        : 'Started'
                                      : `Bought ${formatDate(book.paidAt || book.createdAt)}`}
                              </p>
                            </div>
                            <div className="mt-3">
                              {state === 'finished' ? (
                                <Button variant="outline" size="sm" disabled={!openable} onClick={() => void readAgain(book)} className="w-full gap-2 rounded-md">
                                  <RotateCcw className="h-4 w-4" />
                                  Read again
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  disabled={!openable}
                                  onClick={() => openBook(book)}
                                  className="w-full gap-2 rounded-md bg-[#1688b4] text-white hover:bg-[#0f759c]"
                                >
                                  <BookOpen className="h-4 w-4" />
                                  {state === 'reading' ? 'Continue' : 'Start reading'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <p className="text-center text-xs text-slate-500">Downloading and printing are turned off for soft copies.</p>
            </>
          )}
        </div>
      </main>
      <Footer />
      <StoreMobileNav />

      {reader && token ? (
        <ProtectedBookReader
          key={reader.book.id}
          purchaseId={reader.book.id}
          title={reader.book.title}
          token={token}
          initialPage={reader.initialPage}
          onProgress={(progress) => handleProgress(reader.book.id, progress)}
          onClose={() => setReader(null)}
        />
      ) : null}

      <Dialog open={Boolean(textBook)} onOpenChange={(open) => { if (!open) setTextBook(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{textBook?.title}</DialogTitle>
            <DialogDescription>{textBook?.author || 'Hope Stores'}</DialogDescription>
          </DialogHeader>
          <div className="prose prose-slate max-w-none">
            {textBlocks.map((block, index) => {
              const [firstLine, ...rest] = block.split('\n');
              if (firstLine?.toLowerCase().startsWith('chapter') || firstLine?.toLowerCase().startsWith('sample chapter')) {
                return (
                  <section key={`${index}-${firstLine}`} className={index > 0 ? 'mt-10' : undefined}>
                    <h3 className="text-2xl font-bold text-slate-950">{firstLine}</h3>
                    {rest.length > 0 && <p className="mt-4 text-base leading-8 text-slate-700">{rest.join(' ')}</p>}
                  </section>
                );
              }
              return <p key={`${index}-${firstLine}`} className="text-base leading-8 text-slate-700">{block}</p>;
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTextBook(null)}>Close</Button>
            {textBook && !textBook.finishedAt ? (
              <Button className="gap-2 bg-[#1688b4] text-white hover:bg-[#0f759c]" onClick={() => markTextFinished(textBook)}>
                <BookCheck className="h-4 w-4" />
                Mark as finished
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
