'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BookOpen, CalendarDays, CheckCircle2, Loader2, MapPin, Minus, Plus } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { apiFetch } from '@/lib/api';

type LaunchInfo = {
  name: string;
  bookTitle: string | null;
  launchDate: string | null;
  venue: string | null;
  unitPrice: number;
  description: string | null;
  formEnabled: boolean;
};

const money = (value: number) => `MWK ${Number(value || 0).toLocaleString()}`;
const inputClass = 'mt-1.5 w-full rounded-xl border border-white/15 bg-white/90 px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-white/60';

/** Public order form for one book launch; orders go into that launch's folder in the admin. */
export default function BookLaunchOrderPage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug || '');
  const [launch, setLaunch] = useState<LaunchInfo | null>(null);
  const [media, setMedia] = useState<string[]>([]);
  const [loadError, setLoadError] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [medium, setMedium] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ quantity: number; amount: number } | null>(null);

  useEffect(() => {
    if (!slug) return;
    apiFetch(`/api/book-launch-forms/${encodeURIComponent(slug)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || 'This order form was not found.');
        setLaunch(data.launch);
        setMedia(Array.isArray(data.media) ? data.media : []);
      })
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : 'This order form was not found.'));
  }, [slug]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await apiFetch(`/api/book-launch-forms/${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), contact: contact.trim(), quantity, medium: medium || undefined }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || 'Unable to place your order.');
        return;
      }
      setDone({ quantity: data.quantity, amount: data.amount });
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-black pb-20 text-white">
        <section className="py-14 text-center md:py-20">
          <div className="mx-auto max-w-3xl px-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a227]">Hope Bookshop · Book launch</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">{launch?.name || (loadError ? 'Order form' : 'Loading…')}</h1>
            {launch?.bookTitle ? <p className="mt-3 flex items-center justify-center gap-2 text-white/80"><BookOpen className="h-4 w-4" />{launch.bookTitle}</p> : null}
            {launch ? (
              <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 text-sm text-white/60">
                {launch.launchDate ? <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />{new Date(launch.launchDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span> : null}
                {launch.venue ? <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{launch.venue}</span> : null}
              </p>
            ) : null}
          </div>
        </section>

        <section className="mx-auto max-w-lg px-4">
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
            {loadError ? (
              <div className="px-6 py-10 text-center">
                <p className="text-white/70">{loadError}</p>
                <Link href="/store" className="mt-4 inline-block text-sm font-semibold text-[#39D98A] underline">Visit the Hope Bookshop</Link>
              </div>
            ) : !launch ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" /></div>
            ) : done ? (
              <div className="px-6 py-10 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-[#39D98A]" />
                <h2 className="mt-4 text-xl font-semibold">Order received</h2>
                <p className="mt-2 text-white/70">{done.quantity} cop{done.quantity === 1 ? 'y' : 'ies'}{done.amount ? ` · ${money(done.amount)}` : ''}. The bookshop team will contact you about payment and collection.</p>
                <button type="button" onClick={() => { setDone(null); setName(''); setContact(''); setQuantity(1); }} className="mt-6 text-sm font-semibold underline">Place another order</button>
              </div>
            ) : !launch.formEnabled ? (
              <p className="px-6 py-10 text-center text-white/70">Orders for this book launch are closed. Please visit the Hope Bookshop.</p>
            ) : (
              <form onSubmit={submit} className="space-y-4 px-5 py-6 md:px-8">
                {launch.description ? <p className="whitespace-pre-line rounded-xl bg-white/5 px-4 py-3 text-sm text-white/75">{launch.description}</p> : null}
                <label className="block text-xs uppercase tracking-[0.2em] text-white/70">
                  Full name
                  <input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" className={inputClass} />
                </label>
                <label className="block text-xs uppercase tracking-[0.2em] text-white/70">
                  Phone number
                  <input value={contact} onChange={(event) => setContact(event.target.value)} required type="tel" autoComplete="tel" placeholder="0991 234 567" className={inputClass} />
                </label>
                <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-white/70">Copies</span>
                  <div className="flex items-center gap-3">
                    <button type="button" aria-label="One less" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="rounded-full bg-white/10 p-2"><Minus className="h-4 w-4" /></button>
                    <span className="w-6 text-center text-lg font-semibold tabular-nums">{quantity}</span>
                    <button type="button" aria-label="One more" onClick={() => setQuantity((value) => Math.min(500, value + 1))} className="rounded-full bg-white/10 p-2"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
                {media.length ? (
                  <label className="block text-xs uppercase tracking-[0.2em] text-white/70">
                    How will you pay?
                    <select value={medium} onChange={(event) => setMedium(event.target.value)} className={inputClass}>
                      <option value="">Decide later</option>
                      {media.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
                    </select>
                  </label>
                ) : null}
                {error ? <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p> : null}
                <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#39D98A] py-3.5 text-sm font-bold text-black disabled:opacity-60">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Place order{launch.unitPrice ? ` · ${money(launch.unitPrice * quantity)}` : ''}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
