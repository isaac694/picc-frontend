'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Download, Loader2, Printer, XCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { confirmPaychanguCheckout } from '@/lib/paychangu-client';
import { clearScanBasketAfterPayment } from '@/lib/scan-basket';
import { downloadReceiptPdf, itemKindLabel, money, printReceipt, receiptDate, STATUS_LABEL, type StoreOrder } from '@/lib/store-receipt';
import { cn } from '@/lib/utils';

const STATUS_STYLE: Record<StoreOrder['status'], { icon: typeof Clock; tone: string }> = {
  paid: { icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  pending: { icon: Clock, tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  cancelled: { icon: XCircle, tone: 'bg-rose-50 text-rose-800 border-rose-200' },
};

/** Customer receipt for a hard copy order; refreshes until the payment is confirmed. */
export default function StoreReceiptPage() {
  const params = useParams<{ reference: string }>();
  const reference = decodeURIComponent(String(params?.reference || ''));
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reference) return;
    let alive = true;
    let timer: number | undefined;
    let attempts = 0;
    const load = async () => {
      try {
        const response = await apiFetch(`/api/store/receipts/${encodeURIComponent(reference)}`, { cache: 'no-store' });
        const data = await response.json().catch(() => null);
        if (!alive) return;
        if (!response.ok) {
          setError(data?.error || 'Receipt not found.');
          return;
        }
        setOrder(data.order);
        if (data.order.status === 'paid') clearScanBasketAfterPayment(reference);
        attempts += 1;
        // Ask the server to re-check PayChangu now and then, in case the payment notice was missed.
        if (data.order.status === 'pending' && data.order.paymentMethod === 'PayChangu' && attempts % 3 === 0) {
          void confirmPaychanguCheckout(reference, 'main', 'pending').catch(() => undefined);
        }
        // Mobile money confirmations arrive within a minute or two; counter payments when staff confirm.
        if (data.order.status === 'pending' && attempts < 120) timer = window.setTimeout(load, attempts < 24 ? 5000 : 15000);
      } catch {
        if (alive) timer = window.setTimeout(load, 10000);
      }
    };
    void load();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [reference]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-center">
        <div>
          <h1 className="text-lg font-semibold">Receipt not found</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <Link href="/store" className="mt-4 inline-block text-sm font-semibold underline">Back to the bookshop</Link>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading receipt" />
      </main>
    );
  }

  const status = STATUS_STYLE[order.status];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-sm">
        <article className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <header className="bg-[#1e3a5f] px-5 py-5 text-center text-white">
            <Image src="/logo.png" alt="PICC" width={64} height={65} className="mx-auto rounded-full bg-white p-0.5" />
            <h1 className="mt-2 text-lg font-bold tracking-wide">HOPE BOOKSHOP</h1>
            <p className="text-[11px] text-white/70">Pentecost International Christian Centre · Area 49, Lilongwe</p>
          </header>
          <div className={cn('mx-5 mt-5 flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold tracking-wide', status.tone)}>
            <status.icon className="h-4 w-4" /> {STATUS_LABEL[order.status]}
          </div>
          {order.status === 'pending' ? (
            <p className="mx-5 mt-2 text-center text-xs text-slate-500">
              {order.paymentMethod === 'PayChangu'
                ? 'Approve the prompt on your phone with your PIN. This page updates by itself.'
                : `Pay by ${order.paymentMethod} at the counter and show this receipt. It updates when the attendant confirms.`}
            </p>
          ) : null}
          <dl className="mx-5 mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-slate-500">Receipt</dt><dd className="text-right font-mono font-semibold">{order.receiptNumber || order.reference.slice(-10).toUpperCase()}</dd>
            <dt className="text-slate-500">Date</dt><dd className="text-right">{receiptDate(order.paidAt || order.createdAt)}</dd>
            {order.buyerName ? <><dt className="text-slate-500">Customer</dt><dd className="text-right">{order.buyerName}</dd></> : null}
            <dt className="text-slate-500">Payment</dt><dd className="text-right">{order.paymentMethod}</dd>
            {order.paymentReference ? <><dt className="text-slate-500">Reference</dt><dd className="break-all text-right font-mono">{order.paymentReference}</dd></> : null}
          </dl>
          <div className="mx-5 mt-4 border-t border-dashed border-slate-300 pt-3">
            {order.items.map((item) => (
              <div key={item.productId} className="flex justify-between gap-3 py-1.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-slate-500">{itemKindLabel(item.kind)} · {item.quantity} × {money(item.unitPrice, order.currency)}</p>
                </div>
                <p className="shrink-0 font-semibold">{money(item.total, order.currency)}</p>
              </div>
            ))}
          </div>
          <div className="mx-5 mt-2 flex justify-between border-t border-dashed border-slate-300 py-3 text-base font-bold">
            <span>Total</span><span>{money(order.total, order.currency)}</span>
          </div>
          <footer className="flex gap-2 border-t border-slate-100 bg-slate-50 p-4">
            <button type="button" onClick={() => printReceipt(order)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button type="button" onClick={() => void downloadReceiptPdf(order)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] py-2.5 text-sm font-semibold text-white">
              <Download className="h-4 w-4" /> Download PDF
            </button>
          </footer>
        </article>
        <p className="mt-4 text-center text-xs text-slate-500">
          Keep this link to see your receipt again. <Link href="/store" className="underline">Back to the bookshop</Link>
        </p>
      </div>
    </main>
  );
}
