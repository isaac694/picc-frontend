'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Banknote, BookOpen, CreditCard, Landmark, Loader2, Minus, Plus, Smartphone, Store, Wallet } from 'lucide-react';
import { apiFetch, resolveMediaImageUrl } from '@/lib/api';
import { openStorePaychanguPopup } from '@/lib/store-paychangu-checkout';
import { COUNTER_METHODS, money } from '@/lib/store-receipt';
import { cn } from '@/lib/utils';

type ScannedBook = {
  title: string;
  author: string | null;
  description: string | null;
  coverImageUrl: string | null;
  price: number;
  currency: string;
  hardCopyStock: number;
  available: boolean;
  barcode: string;
};

const COUNTER_ICONS: Record<string, typeof Banknote> = { POS: CreditCard, Cash: Banknote, 'Bank Transfer': Landmark, 'Airtel Money agent': Wallet };

/** Opened by scanning the label on a hard copy: pay by mobile money on the spot, or pay at the counter. */
export default function ScanToPayPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = decodeURIComponent(String(params?.code || ''));
  const [book, setBook] = useState<ScannedBook | null>(null);
  const [loadError, setLoadError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'mobile' | 'counter'>('mobile');
  const [counterMethod, setCounterMethod] = useState<string>('Cash');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!code) return;
    apiFetch(`/api/store/scan/${encodeURIComponent(code)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || 'We could not find this book.');
        setBook(data.book);
      })
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : 'We could not find this book.'));
  }, [code]);

  const maxQuantity = Math.max(1, Math.min(book?.hardCopyStock || 1, 20));
  const total = (book?.price || 0) * quantity;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!book) return;
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
          quantity,
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
        router.push(`/store/receipt/${encodeURIComponent(reference)}`);
        return;
      }
      // PayChangu sends a prompt to the phone; the customer approves with their mobile money PIN.
      await openStorePaychanguPopup({
        orderReference: reference,
        amount: Number(data.totalAmount),
        email: email.trim() || 'info@piccworldwide.org',
        customerName: name.trim(),
        phone: digits,
        reason: `Hope Bookshop: ${book.title}`,
        returnPath: `/store/receipt/${encodeURIComponent(reference)}`,
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

  if (!book) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading book" />
      </main>
    );
  }

  const cover = resolveMediaImageUrl(book.coverImageUrl) || '/store/books/placeholder.jpg';

  return (
    <main className="min-h-screen bg-slate-950 pb-16 text-white">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/store" className="flex items-center gap-2 text-sm font-semibold"><Store className="h-4 w-4 text-[#39D98A]" /> Hope Bookshop</Link>
        <span className="font-mono text-[11px] text-white/40">{book.barcode}</span>
      </header>

      <div className="mx-auto max-w-md px-4">
        <section className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded-lg bg-white/10">
            <Image src={cover} alt={`Cover of ${book.title}`} fill sizes="96px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-tight">{book.title}</h1>
            {book.author ? <p className="mt-1 text-sm text-white/60">{book.author}</p> : null}
            <p className="mt-3 text-2xl font-bold">{money(book.price, book.currency)}</p>
            <p className={cn('mt-1 text-xs', book.available ? 'text-[#39D98A]' : 'text-rose-300')}>
              {book.available ? `${book.hardCopyStock} in stock` : 'Out of stock: ask an attendant'}
            </p>
          </div>
        </section>

        {book.available ? (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-sm text-white/70">Copies</span>
              <div className="flex items-center gap-3">
                <button type="button" aria-label="One less" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="rounded-full bg-white/10 p-2 disabled:opacity-40" disabled={quantity <= 1}><Minus className="h-4 w-4" /></button>
                <span className="w-6 text-center text-lg font-semibold tabular-nums">{quantity}</span>
                <button type="button" aria-label="One more" onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} className="rounded-full bg-white/10 p-2 disabled:opacity-40" disabled={quantity >= maxQuantity}><Plus className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="How will you pay?">
              {([
                ['mobile', 'Pay now', 'Mobile money prompt', Smartphone],
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
              {mode === 'mobile' ? `Pay ${money(total, book.currency)}` : `Reserve and pay ${money(total, book.currency)} at the counter`}
            </button>
            <p className="text-center text-[11px] leading-relaxed text-white/50">
              {mode === 'mobile'
                ? 'A payment prompt is sent to your phone. Enter your mobile money PIN to approve it; your receipt opens when the payment goes through.'
                : 'Show the receipt on your phone to the attendant. It is marked paid once they confirm your payment.'}
            </p>
          </form>
        ) : null}
      </div>
    </main>
  );
}
