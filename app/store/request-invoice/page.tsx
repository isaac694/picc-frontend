'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Loader2, Minus, Plus, Search, Trash2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { money } from '@/lib/store-receipt';

type CatalogBook = { productId: string; title: string; author?: string | null; hardCopyPrice: number; hardCopyEnabled?: boolean; isActive?: boolean };
type Line = { book: CatalogBook; quantity: number };

const STORE_TOKEN_KEY = 'store_token';
const STORE_USER_KEY = 'store_user';
const STORE_CART_STATE_KEY = 'hope_store_cart_state';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_QUANTITY = 5000;

const fieldClass = 'h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-[#123747] focus:ring-2 focus:ring-[#123747]/15';
const readStorage = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

/** Customers (schools, churches, groups buying in bulk) ask Hope Publishing House for a book invoice. */
export default function RequestInvoicePage() {
  const router = useRouter();
  const [catalog, setCatalog] = useState<CatalogBook[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(readStorage(STORE_TOKEN_KEY));
    try {
      const user = JSON.parse(readStorage(STORE_USER_KEY) || 'null');
      if (user?.email) setEmail(user.email);
      if (user?.name) setName(user.name);
    } catch {
      // No saved account; the customer types their details.
    }
  }, []);

  // Books on sale as hard copies, then whatever hard copies are already in the customer's cart.
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const response = await apiFetch('/api/store/books');
        const data = await response.json().catch(() => null);
        if (!alive) return;
        const books: CatalogBook[] = (Array.isArray(data?.books) ? data.books : []).filter(
          (book: CatalogBook) => book.isActive !== false && book.hardCopyEnabled !== false,
        );
        setCatalog(books);
        try {
          const saved = JSON.parse(readStorage(STORE_CART_STATE_KEY) || 'null');
          const cart: Array<{ product?: { id?: string }; quantity?: number }> = Array.isArray(saved?.cart) ? saved.cart : [];
          const fromCart = cart
            .map((item) => ({ book: books.find((book) => book.productId === item.product?.id), quantity: Math.max(1, Number(item.quantity) || 1) }))
            .filter((line): line is Line => Boolean(line.book));
          if (fromCart.length) setLines(fromCart);
        } catch {
          // An unreadable cart just means starting empty.
        }
      } finally {
        if (alive) setLoadingCatalog(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return catalog
      .filter((book) => !lines.some((line) => line.book.productId === book.productId))
      .filter((book) => `${book.title} ${book.author || ''}`.toLowerCase().includes(query))
      .slice(0, 8);
  }, [catalog, lines, search]);

  const addBook = (book: CatalogBook) => {
    setLines((current) => [...current, { book, quantity: 1 }]);
    setSearch('');
  };
  const setQuantity = (productId: string, quantity: number) =>
    setLines((current) => current.map((line) => (line.book.productId === productId ? { ...line, quantity: Math.min(MAX_QUANTITY, Math.max(1, quantity)) } : line)));
  const removeLine = (productId: string) => setLines((current) => current.filter((line) => line.book.productId !== productId));
  const estimate = lines.reduce((sum, line) => sum + line.book.hardCopyPrice * line.quantity, 0);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (lines.length === 0) return setError('Add at least one book.');
    if (!name.trim()) return setError('Enter your name or organisation.');
    if (!email.trim() && !phone.trim()) return setError('Enter an email address or phone number so we can send the invoice.');
    if (email.trim() && !EMAIL_PATTERN.test(email.trim())) return setError('Enter a valid email address.');
    setSending(true);
    try {
      const response = await apiFetch('/api/store/invoice-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          billToName: name.trim(),
          billToAddress: address.trim(),
          billToContact: phone.trim(),
          billToEmail: email.trim(),
          note: note.trim(),
          items: lines.map((line) => ({ productId: line.book.productId, quantity: line.quantity })),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || 'We could not make your invoice. Please try again.');
        return;
      }
      router.push(`/store/invoice/${encodeURIComponent(data.invoice.accessToken)}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/store" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" /> Back to Hope Stores
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Get a book invoice</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Buying for a school, church or group, or need an invoice before you pay? Choose the books and quantities and your invoice is ready to download straight away.
            If you give an email address, we email you a copy too.
          </p>

          <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="space-y-4 rounded-lg bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#087989]">Books</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={loadingCatalog ? 'Loading books…' : 'Search for a book by title or author'}
                  className={`${fieldClass} pl-9`}
                  aria-label="Search books"
                  disabled={loadingCatalog}
                />
                {matches.length ? (
                  <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
                    {matches.map((book) => (
                      <li key={book.productId}>
                        <button type="button" onClick={() => addBook(book)} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50">
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">{book.title}</span>
                            {book.author ? <span className="block truncate text-xs text-slate-500">{book.author}</span> : null}
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-slate-600">{money(book.hardCopyPrice)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : search.trim() && !loadingCatalog ? (
                  <p className="mt-1 text-xs text-slate-500">No other books match “{search.trim()}”.</p>
                ) : null}
              </div>

              {lines.length ? (
                <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                  {lines.map((line) => (
                    <li key={line.book.productId} className="flex flex-wrap items-center gap-3 px-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{line.book.title}</p>
                        <p className="text-xs text-slate-500">{money(line.book.hardCopyPrice)} each</p>
                      </div>
                      <div className="flex items-center rounded-md border border-slate-300">
                        <button type="button" className="p-2 hover:bg-slate-50" onClick={() => setQuantity(line.book.productId, line.quantity - 1)} aria-label={`Fewer copies of ${line.book.title}`}><Minus className="h-3 w-3" /></button>
                        <input
                          type="number"
                          min={1}
                          max={MAX_QUANTITY}
                          value={line.quantity}
                          onChange={(event) => setQuantity(line.book.productId, Number(event.target.value) || 1)}
                          className="w-16 border-x border-slate-300 py-1 text-center text-sm"
                          aria-label={`Copies of ${line.book.title}`}
                        />
                        <button type="button" className="p-2 hover:bg-slate-50" onClick={() => setQuantity(line.book.productId, line.quantity + 1)} aria-label={`More copies of ${line.book.title}`}><Plus className="h-3 w-3" /></button>
                      </div>
                      <span className="w-28 text-right text-sm font-semibold">{money(line.book.hardCopyPrice * line.quantity)}</span>
                      <button type="button" onClick={() => removeLine(line.book.productId)} className="text-slate-400 hover:text-red-600" aria-label={`Remove ${line.book.title}`}><Trash2 className="h-4 w-4" /></button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-md border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">
                  {loadingCatalog ? 'Loading books…' : 'Search above to add the books you want invoiced.'}
                </p>
              )}

              <h2 className="pt-2 text-sm font-bold uppercase tracking-[0.18em] text-[#087989]">Bill to</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Name / Organisation *
                  <input value={name} onChange={(event) => setName(event.target.value)} className={`${fieldClass} mt-1`} maxLength={191} required />
                </label>
                <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Address
                  <input value={address} onChange={(event) => setAddress(event.target.value)} className={`${fieldClass} mt-1`} maxLength={500} placeholder="Where the invoice is addressed or books delivered" />
                </label>
                <label className="text-xs font-semibold text-slate-600">Phone
                  <input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" className={`${fieldClass} mt-1`} maxLength={80} />
                </label>
                <label className="text-xs font-semibold text-slate-600">Email
                  <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className={`${fieldClass} mt-1`} maxLength={191} />
                </label>
                <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Anything else we should know (optional)
                  <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={2000} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950" placeholder="Delivery location, deadline, editions, your LPO number…" />
                </label>
              </div>
            </section>

            <aside className="h-fit space-y-4 rounded-lg bg-white p-5 shadow-sm lg:sticky lg:top-24">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Invoice total</p>
                <p className="mt-1 text-2xl font-bold">{money(estimate)}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {lines.reduce((sum, line) => sum + line.quantity, 0)} copies at current store prices.
                </p>
              </div>
              {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
              <Button type="submit" disabled={sending || loadingCatalog} className="w-full rounded-none bg-[#123747] py-6 text-sm font-bold uppercase tracking-[0.16em] text-white hover:bg-[#0c2833]">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Get invoice
              </Button>
              <p className="text-xs leading-5 text-slate-500">An invoice does not reserve copies. We will contact you if a book is short.</p>
            </aside>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
