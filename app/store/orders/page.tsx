'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, FileText, Library, LockKeyhole, Package, Receipt, RefreshCw, Shirt, XCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { apiFetch, resolveMediaImageUrl } from '@/lib/api';
import { itemKindLabel, money, receiptDate, type StoreOrder } from '@/lib/store-receipt';
import { INVOICE_STATUS_LABEL, invoiceDate, type StoreInvoice } from '@/lib/store-invoice';
import { QUOTATION_STATUS_LABEL, type StoreQuotation } from '@/lib/store-documents';
import { cn } from '@/lib/utils';

const STORE_TOKEN_KEY = 'store_token';
const STORE_USER_KEY = 'store_user';

type PortalOrder = StoreOrder & { receiptUrl: string | null };


const STATUS = {
  paid: { label: 'Paid', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  pending: { label: 'Waiting for payment', icon: Clock, tone: 'bg-amber-50 text-amber-700 ring-amber-200' },
  cancelled: { label: 'Cancelled', icon: XCircle, tone: 'bg-rose-50 text-rose-700 ring-rose-200' },
} as const;

/** The customer's Hope Stores orders (branded material, hard and soft copies) with their payment status. */
export default function MyOrdersPage() {
  const [token, setToken] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [orders, setOrders] = useState<PortalOrder[]>([]);
  const [invoices, setInvoices] = useState<StoreInvoice[]>([]);
  const [quotations, setQuotations] = useState<StoreQuotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (authToken: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch('/api/store/my-orders', { headers: { Authorization: `Bearer ${authToken}` }, cache: 'no-store' });
      if (response.status === 401) {
        localStorage.removeItem(STORE_TOKEN_KEY);
        localStorage.removeItem(STORE_USER_KEY);
        setToken(null);
        return;
      }
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || 'Unable to load your orders right now.');
        return;
      }
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
      // Invoices are a separate list; failing to load them leaves the orders on screen.
      const invoiceResponse = await apiFetch('/api/store/my-invoices', { headers: { Authorization: `Bearer ${authToken}` }, cache: 'no-store' });
      const invoiceData = await invoiceResponse.json().catch(() => null);
      setInvoices(invoiceResponse.ok && Array.isArray(invoiceData?.invoices) ? invoiceData.invoices : []);
      const quotationResponse = await apiFetch('/api/store/my-quotations', { headers: { Authorization: `Bearer ${authToken}` }, cache: 'no-store' });
      const quotationData = await quotationResponse.json().catch(() => null);
      setQuotations(quotationResponse.ok && Array.isArray(quotationData?.quotations) ? quotationData.quotations : []);
    } catch {
      setError('Unable to load your orders right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORE_TOKEN_KEY);
    } catch {
      stored = null;
    }
    setToken(stored);
    setChecked(true);
    if (stored) void load(stored);
  }, [load]);

  const paidTotal = orders.filter((order) => order.status === 'paid').reduce((sum, order) => sum + order.total, 0);
  const waiting = orders.filter((order) => order.status === 'pending').length;

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#f7f7fb] pb-20 text-slate-950 md:pb-0">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/store" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
                <ArrowLeft className="h-4 w-4" /> Back to Hope Stores
              </Link>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">My Orders</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Branded material, hard copies and soft copies you have ordered, with the payment for each one.
              </p>
            </div>
            {token ? (
              <div className="flex gap-2">
                <Button variant="outline" asChild className="gap-2 rounded-md">
                  <Link href="/store/library"><Library className="h-4 w-4" /> My Library</Link>
                </Button>
                <Button variant="outline" onClick={() => void load(token)} disabled={loading} className="gap-2 rounded-md">
                  <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh
                </Button>
              </div>
            ) : null}
          </div>

          {checked && !token ? (
            <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <LockKeyhole className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-4 text-xl font-bold">Sign in to see your orders</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                Sign in with the email you used at checkout. Orders placed before you signed in show up too.
              </p>
              <Button asChild className="mt-5 rounded-md bg-[#1688b4] text-white hover:bg-[#0f759c]">
                <Link href="/store">Go to Hope Stores to sign in</Link>
              </Button>
            </section>
          ) : null}

          {token ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Orders', value: String(orders.length), icon: Package },
                  { label: 'Paid so far', value: money(paidTotal), icon: CheckCircle2 },
                  { label: 'Waiting for payment', value: String(waiting), icon: Clock },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500">{stat.label}<stat.icon className="h-4 w-4" /></div>
                    <p className="mt-2 text-2xl font-bold tabular-nums">{loading && orders.length === 0 ? '—' : stat.value}</p>
                  </div>
                ))}
              </div>

              {error ? <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                  <h2 className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-[#087989]" /> My quotations</h2>
                  <Button asChild size="sm" variant="outline" className="rounded-md"><Link href="/store/request-quote">Request a quote</Link></Button>
                </header>
                {quotations.length ? (
                  <ul className="divide-y divide-slate-100">
                    {quotations.map((quotation) => (
                      <li key={quotation.quotationNumber}>
                        <Link href={`/store/quotation/${encodeURIComponent(quotation.accessToken)}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                          <span>
                            <span className="block font-mono text-sm font-semibold">{quotation.quotationNumber}</span>
                            <span className="text-xs text-slate-500">
                              {quotation.items.length} {quotation.items.length === 1 ? 'title' : 'titles'} · {invoiceDate(quotation.issueDate)}
                            </span>
                          </span>
                          <span className="text-right text-sm">
                            <span className="block font-semibold">{money(quotation.total || 0, quotation.currency)}</span>
                            <span className="text-xs text-slate-500">{QUOTATION_STATUS_LABEL[quotation.status]}{quotation.invoiceNumber ? ` · ${quotation.invoiceNumber}` : ''}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-4 text-sm text-slate-500">Buying for a school, church or group? Request a quote and it will appear here.</p>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                  <h2 className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-[#087989]" /> My invoices</h2>
                </header>
                {invoices.length ? (
                  <ul className="divide-y divide-slate-100">
                    {invoices.map((invoice) => (
                      <li key={invoice.invoiceNumber}>
                        <Link href={`/store/invoice/${encodeURIComponent(invoice.accessToken || '')}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                          <span>
                            <span className="block font-mono text-sm font-semibold">{invoice.invoiceNumber}</span>
                            <span className="text-xs text-slate-500">
                              {invoice.items.length} {invoice.items.length === 1 ? 'title' : 'titles'} · {invoiceDate(invoice.issueDate || invoice.createdAt)}
                            </span>
                          </span>
                          <span className="text-right text-sm">
                            <span className="block font-semibold">{money(invoice.total || 0, invoice.currency)}</span>
                            <span className="text-xs text-slate-500">{INVOICE_STATUS_LABEL[invoice.status]}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-4 text-sm text-slate-500">When you accept a quotation, Hope Publishing House sends your invoice and it appears here.</p>
                )}
              </section>

              {!loading && orders.length === 0 && !error ? (
                <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <Shirt className="mx-auto h-10 w-10 text-slate-300" />
                  <h2 className="mt-4 text-lg font-bold">No orders yet</h2>
                  <p className="mt-2 text-sm text-slate-600">Branded items and books you buy will appear here.</p>
                  <Button asChild className="mt-5 rounded-md bg-[#1688b4] text-white hover:bg-[#0f759c]"><Link href="/store/branded">Shop branded items</Link></Button>
                </section>
              ) : null}

              <div className="space-y-4">
                {orders.map((order) => {
                  const status = STATUS[order.status] || STATUS.pending;
                  return (
                    <article key={order.reference} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold">Order {order.receiptNumber || order.reference.slice(-8).toUpperCase()}</p>
                          <p className="text-xs text-slate-500">Placed {receiptDate(order.createdAt)}{order.paidAt ? ` · Paid ${receiptDate(order.paidAt)}` : ''}</p>
                        </div>
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1', status.tone)}>
                          <status.icon className="h-3.5 w-3.5" /> {status.label}
                        </span>
                      </header>
                      <ul className="divide-y divide-slate-100">
                        {order.items.map((item) => (
                          <li key={item.productId} className="flex items-center gap-3 px-4 py-3">
                            <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded bg-slate-100">
                              {item.imageUrl ? <Image src={resolveMediaImageUrl(item.imageUrl) || item.imageUrl} alt="" fill sizes="44px" className="object-cover" /> : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{item.title}</p>
                              <p className="text-xs text-slate-500">
                                <span className={cn('mr-2 rounded px-1.5 py-0.5 font-semibold', item.kind === 'branded' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-700')}>
                                  {itemKindLabel(item.kind)}
                                </span>
                                {item.quantity} × {money(item.unitPrice, order.currency)}
                              </p>
                            </div>
                            <p className="shrink-0 text-sm font-semibold">{money(item.total, order.currency)}</p>
                          </li>
                        ))}
                      </ul>
                      <footer className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-sm">
                        <span className="text-slate-600">
                          Payment: <strong className="text-slate-900">{order.paymentMethod || 'PayChangu'}</strong> · Total <strong className="text-slate-900">{money(order.total, order.currency)}</strong>
                        </span>
                        {order.receiptUrl ? (
                          <Button asChild size="sm" variant="outline" className="gap-2 rounded-md">
                            <Link href={order.receiptUrl}><Receipt className="h-4 w-4" /> {order.status === 'paid' ? 'Receipt' : 'View order'}</Link>
                          </Button>
                        ) : null}
                      </footer>
                    </article>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
