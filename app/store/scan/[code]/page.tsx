'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Banknote, BookOpen, Camera, CreditCard, Landmark, Loader2, Minus, Plus, Search, Smartphone, Store, Trash2, Wallet } from 'lucide-react';
import BookCameraScanner from '@/components/store/BookCameraScanner';
import { apiFetch, resolveMediaImageUrl } from '@/lib/api';
import { codeFromScan } from '@/lib/book-labels';
import { listenForPaychanguReturn } from '@/lib/paychangu-popup-bridge';
import { clearScanBasket, markScanBasketCheckout, readScanBasket, saveScanBasket } from '@/lib/scan-basket';
import { openStorePaychanguPopup } from '@/lib/store-paychangu-checkout';
import { COUNTER_METHODS, money } from '@/lib/store-receipt';
import { cn } from '@/lib/utils';

type ScannedBook = {
  productId: string;
  title: string;
  author: string | null;
  description: string | null;
  coverImageUrl: string | null;
  price: number;
  currency: string;
  hardCopyStock: number;
  available: boolean;
  barcode: string | null;
};

type BasketLine = { book: ScannedBook; quantity: number };

const COUNTER_ICONS: Record<string, typeof Banknote> = { POS: CreditCard, Cash: Banknote, 'Bank Transfer': Landmark, 'Airtel Money agent': Wallet, 'TNM Mpamba': Wallet };

const codeOf = (book: ScannedBook) => book.barcode || book.productId;
const maxCopies = (book: ScannedBook) => Math.max(1, Math.min(book.hardCopyStock, 20));

async function fetchBook(code: string): Promise<ScannedBook> {
  const response = await apiFetch(`/api/store/scan/${encodeURIComponent(code)}`);
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'We could not find this book.');
  return data.book;
}

/** Opened by scanning the label on a hard copy: build a basket of books, then pay by PayChangu on the spot or at the counter. */
export default function ScanToPayPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = decodeURIComponent(String(params?.code || ''));
  const [basket, setBasket] = useState<BasketLine[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');
  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ScannedBook[]>([]);
  const [searching, setSearching] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'mobile' | 'counter'>('mobile');
  const [counterMethod, setCounterMethod] = useState<string>('Cash');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Bring back the books scanned earlier with fresh prices and stock, then add the one just scanned.
  useEffect(() => {
    if (!code) return;
    let alive = true;
    void (async () => {
      const saved = readScanBasket();
      const restored = await Promise.all(saved.map(async (line) => {
        try {
          const book = await fetchBook(line.code);
          return book.available ? { book, quantity: Math.min(line.quantity, maxCopies(book)) } : null;
        } catch {
          return null;
        }
      }));
      const lines = restored.filter((line): line is BasketLine => line !== null);
      let message = lines.length < saved.length ? 'A book you added earlier is no longer available, so it was taken out of your basket.' : '';
      let failure = '';
      try {
        const scanned = await fetchBook(code);
        if (!scanned.available) message = `${scanned.title} is out of stock: ask an attendant.`;
        else if (!lines.some((line) => codeOf(line.book) === codeOf(scanned))) lines.push({ book: scanned, quantity: 1 });
      } catch (err) {
        failure = err instanceof Error ? err.message : 'We could not find this book.';
      }
      if (!alive) return;
      setBasket(lines);
      setNotice(message || (lines.length ? failure : ''));
      setLoadError(lines.length ? '' : failure);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [code]);

  useEffect(() => {
    if (ready) saveScanBasket(basket.map((line) => ({ code: codeOf(line.book), quantity: line.quantity })));
  }, [basket, ready]);

  useEffect(() => {
    const query = search.trim();
    if (query.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    let alive = true;
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await apiFetch(`/api/store/scan-search?q=${encodeURIComponent(query)}`);
        const data = await response.json().catch(() => null);
        if (alive) setResults(response.ok ? data?.books || [] : []);
      } catch {
        if (alive) setResults([]);
      } finally {
        if (alive) setSearching(false);
      }
    }, 300);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [search]);

  const addBook = useCallback((book: ScannedBook) => {
    if (!book.available) {
      setNotice(`${book.title} is out of stock: ask an attendant.`);
      return;
    }
    setBasket((current) => {
      const existing = current.find((line) => codeOf(line.book) === codeOf(book));
      if (!existing) return [...current, { book, quantity: 1 }];
      return current.map((line) => (line === existing ? { book, quantity: Math.min(line.quantity + 1, maxCopies(book)) } : line));
    });
    setNotice(`Added ${book.title}.`);
    setSearch('');
  }, []);

  const addScanned = useCallback((value: string) => {
    setScanning(false);
    setNotice('');
    fetchBook(codeFromScan(value))
      .then(addBook)
      .catch((err: unknown) => setNotice(err instanceof Error ? err.message : 'We could not find this book.'));
  }, [addBook]);

  const setLineQuantity = (line: BasketLine, quantity: number) =>
    setBasket((current) => current.map((entry) => (entry === line ? { ...entry, quantity: Math.min(Math.max(quantity, 1), maxCopies(entry.book)) } : entry)));

  const removeLine = (line: BasketLine) => setBasket((current) => current.filter((entry) => entry !== line));

  const total = basket.reduce((sum, line) => sum + line.book.price * line.quantity, 0);
  const copies = basket.reduce((sum, line) => sum + line.quantity, 0);
  const currency = basket[0]?.book.currency || 'MWK';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!basket.length) return;
    setError('');
    const digits = phone.replace(/\D/g, '').replace(/^265/, '').replace(/^0+/, '');
    if (!name.trim()) {
      setError('Enter your name.');
      return;
    }
    if (mode === 'mobile' && digits.length !== 9) {
      setError('Enter your Airtel Money or TNM Mpamba number, e.g. 0991 234 567.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await apiFetch(`/api/store/scan/${encodeURIComponent(code)}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: basket.map((line) => ({ barcode: codeOf(line.book), quantity: line.quantity })),
          buyerName: name.trim(),
          buyerPhone: digits ? `+265${digits}` : phone.trim(),
          email: email.trim() || undefined,
          paymentMethod: mode === 'mobile' ? 'PayChangu' : counterMethod,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || 'Unable to start this order.');
        return;
      }
      const reference = String(data.chargeId);
      if (mode === 'counter') {
        clearScanBasket();
        router.push(`/store/receipt/${encodeURIComponent(reference)}`);
        return;
      }
      markScanBasketCheckout(reference);
      // When checkout finishes inside its frame, move on to the receipt. Closing the frame stays on this page.
      const receiptPath = `/store/receipt/${encodeURIComponent(reference)}`;
      const stopListening = listenForPaychanguReturn((nextPath) => {
        if (nextPath !== receiptPath) return;
        stopListening();
        router.push(receiptPath);
      });
      // PayChangu sends a prompt to the phone; the customer approves with their mobile money PIN.
      await openStorePaychanguPopup({
        orderReference: reference,
        amount: Number(data.totalAmount),
        email: email.trim() || 'info@piccworldwide.org',
        customerName: name.trim(),
        phone: digits,
        reason: basket.length === 1 ? `Hope Bookshop: ${basket[0].book.title}` : `Hope Bookshop: ${copies} books`,
        returnPath: receiptPath,
        format: 'hard',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start the payment right now.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-white">
        <div>
          <BookOpen className="mx-auto h-10 w-10 text-white/40" />
          <h1 className="mt-4 text-xl font-semibold">Book not found</h1>
          <p className="mt-2 text-sm text-white/60">{loadError}</p>
          <Link href="/store" className="mt-6 inline-block text-sm font-semibold text-[#39D98A] underline">Browse the Hope Bookshop</Link>
        </div>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading book" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 pb-16 text-white">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/store" className="flex items-center gap-2 text-sm font-semibold"><Store className="h-4 w-4 text-[#39D98A]" /> Hope Bookshop</Link>
        {copies ? <span className="text-xs text-white/60">{copies} {copies === 1 ? 'book' : 'books'} in basket</span> : null}
      </header>

      <div className="mx-auto max-w-md px-4">
        {basket.length ? (
          <ul className="space-y-3">
            {basket.map((line) => (
              <li key={codeOf(line.book)} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="relative flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10">
                  {line.book.coverImageUrl
                    ? <Image src={resolveMediaImageUrl(line.book.coverImageUrl)} alt={`Cover of ${line.book.title}`} fill sizes="80px" className="object-cover" />
                    : <BookOpen className="h-7 w-7 text-white/40" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h1 className="min-w-0 text-sm font-semibold leading-tight">{line.book.title}</h1>
                    <button type="button" aria-label={`Remove ${line.book.title}`} onClick={() => removeLine(line)} className="shrink-0 rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  {line.book.author ? <p className="text-xs text-white/60">{line.book.author}</p> : null}
                  <p className="mt-1 text-base font-bold">{money(line.book.price, line.book.currency)}</p>
                  <p className="text-[11px] text-[#39D98A]">{line.book.hardCopyStock} in stock</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button type="button" aria-label={`One less copy of ${line.book.title}`} onClick={() => setLineQuantity(line, line.quantity - 1)} className="rounded-full bg-white/10 p-1.5 disabled:opacity-40" disabled={line.quantity <= 1}><Minus className="h-4 w-4" /></button>
                    <span className="w-5 text-center text-sm font-semibold tabular-nums">{line.quantity}</span>
                    <button type="button" aria-label={`One more copy of ${line.book.title}`} onClick={() => setLineQuantity(line, line.quantity + 1)} className="rounded-full bg-white/10 p-1.5 disabled:opacity-40" disabled={line.quantity >= maxCopies(line.book)}><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-white/40" />
            <p className="mt-2 text-sm text-white/70">Your basket is empty. Scan a book or search for its title below.</p>
          </div>
        )}

        {notice ? <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm text-white/80" role="status">{notice}</p> : null}

        <section className="mt-3 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4" aria-label="Add another book">
          <button type="button" onClick={() => setScanning((value) => !value)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#39D98A] bg-[#39D98A]/10 py-2.5 text-sm font-semibold text-[#39D98A]">
            <Plus className="h-4 w-4" /> <Camera className="h-4 w-4" /> Scan another book
          </button>
          {scanning ? <BookCameraScanner onCode={addScanned} onClose={() => setScanning(false)} /> : null}
          <label className="block text-xs text-white/60">
            Or type the book title
            <span className="relative mt-1 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Title, author or code" className="w-full rounded-xl bg-white py-2.5 pl-9 pr-3 text-sm text-black" />
            </span>
          </label>
          {search.trim().length >= 2 ? (
            results.length ? (
              <ul className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
                {results.map((book) => (
                  <li key={codeOf(book)} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{book.title}</p>
                      <p className={cn('text-xs', book.available ? 'text-white/60' : 'text-rose-300')}>{book.available ? money(book.price, book.currency) : 'Out of stock'}</p>
                    </div>
                    <button type="button" onClick={() => addBook(book)} disabled={!book.available} className="flex shrink-0 items-center gap-1 rounded-full bg-[#39D98A] px-3 py-1.5 text-xs font-bold text-black disabled:opacity-40">
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-xs text-white/50">{searching ? 'Searching…' : 'No books match that search.'}</p>
            )
          ) : null}
        </section>

        {basket.length ? (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-sm text-white/70">Total for {copies} {copies === 1 ? 'book' : 'books'}</span>
              <span className="text-lg font-bold">{money(total, currency)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="How will you pay?">
              {([
                ['mobile', 'Pay with PayChangu', 'Airtel Money, TNM Mpamba, card', Smartphone],
                ['counter', 'Pay at counter', 'POS, cash, bank, agent', Store],
              ] as const).map(([value, title, hint, Icon]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={mode === value}
                  onClick={() => setMode(value)}
                  className={cn('rounded-2xl border p-3 text-left transition-colors', mode === value ? 'border-[#39D98A] bg-[#39D98A]/10' : 'border-white/10 bg-white/5')}
                >
                  <Icon className={cn('h-5 w-5', mode === value ? 'text-[#39D98A]' : 'text-white/60')} />
                  <p className="mt-2 text-sm font-semibold">{title}</p>
                  <p className="text-[11px] text-white/50">{hint}</p>
                </button>
              ))}
            </div>

            {mode === 'counter' ? (
              <div className="grid grid-cols-2 gap-2">
                {COUNTER_METHODS.map((method) => {
                  const Icon = COUNTER_ICONS[method];
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setCounterMethod(method)}
                      className={cn('flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium', counterMethod === method ? 'border-white bg-white text-black' : 'border-white/10 bg-white/5 text-white')}
                    >
                      <Icon className="h-4 w-4" /> {method}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <label className="block text-xs text-white/60">
                Your name
                <input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" className="mt-1 w-full rounded-xl bg-white px-3 py-2.5 text-sm text-black" />
              </label>
              <label className="block text-xs text-white/60">
                {mode === 'mobile' ? 'Mobile money number (Airtel or TNM)' : 'Phone number (optional)'}
                <input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="0991 234 567" required={mode === 'mobile'} className="mt-1 w-full rounded-xl bg-white px-3 py-2.5 text-sm text-black" />
              </label>
              <label className="block text-xs text-white/60">
                Email for your receipt (optional)
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" className="mt-1 w-full rounded-xl bg-white px-3 py-2.5 text-sm text-black" />
              </label>
            </div>

            {error ? <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p> : null}

            <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#39D98A] py-3.5 text-sm font-bold text-black disabled:opacity-60">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === 'mobile' ? `Pay ${money(total, currency)} with PayChangu` : `Reserve and pay ${money(total, currency)} at the counter`}
            </button>
            <p className="text-center text-[11px] leading-relaxed text-white/50">
              {mode === 'mobile'
                ? 'PayChangu opens here. Choose how to pay and, for mobile money, enter your PIN on your phone when prompted. Your receipt opens when the payment goes through.'
                : 'Show the receipt on your phone to the attendant. It is marked paid once they confirm your payment.'}
            </p>
          </form>
        ) : null}
      </div>
    </main>
  );
}
