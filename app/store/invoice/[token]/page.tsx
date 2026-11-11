'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Download, Loader2, Printer } from 'lucide-react';
import InvoicePreview from '@/components/store/InvoicePreview';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { money } from '@/lib/store-receipt';
import { downloadInvoicePdf, INVOICE_STATUS_LABEL, printInvoice, type StoreInvoice } from '@/lib/store-invoice';

/** The customer's invoice. Its long random link is the key, so no sign-in is needed. */
export default function StoreInvoicePage() {
  const params = useParams<{ token: string }>();
  const token = decodeURIComponent(String(params?.token || ''));
  const [invoice, setInvoice] = useState<StoreInvoice | null>(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    void (async () => {
      const response = await apiFetch(`/api/store/invoices/${encodeURIComponent(token)}`, { cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!alive) return;
      if (!response.ok) setError(data?.error || 'Invoice not found.');
      else setInvoice(data.invoice);
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const download = async () => {
    if (!invoice) return;
    setDownloading(true);
    try {
      await downloadInvoicePdf(invoice);
    } finally {
      setDownloading(false);
    }
  };

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-center">
        <div>
          <h1 className="text-lg font-semibold">Invoice not found</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <Link href="/store" className="mt-4 inline-block text-sm font-semibold underline">Back to the bookshop</Link>
        </div>
      </main>
    );
  }

  if (!invoice) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading invoice" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-[#123747] sm:py-10">
      <div className="mx-auto max-w-[820px] space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#087989]">Hope Publishing House</p>
            <h1 className="text-2xl font-bold">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-sm text-slate-600">
              {INVOICE_STATUS_LABEL[invoice.status]}
              {invoice.balanceDue !== undefined ? ` · Balance due ${money(invoice.balanceDue, invoice.currency)}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void download()} disabled={downloading} className="bg-[#123747] text-white hover:bg-[#0c2833]">
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download PDF
            </Button>
            <Button variant="outline" onClick={() => printInvoice(invoice)}><Printer className="h-4 w-4" /> Print</Button>
          </div>
        </div>
        <InvoicePreview invoice={invoice} />
        <p className="text-center text-xs text-slate-500">
          Questions about this invoice? Email <a className="underline" href="mailto:hph@piccworldwide.org">hph@piccworldwide.org</a> or call +265 884748498.
        </p>
      </div>
    </main>
  );
}
