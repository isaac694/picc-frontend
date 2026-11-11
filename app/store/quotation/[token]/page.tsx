'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Mail, MessageCircle, Printer } from 'lucide-react';
import { DocumentPreview } from '@/components/store/InvoicePreview';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { money } from '@/lib/store-receipt';
import { invoiceDate } from '@/lib/store-invoice';
import { downloadQuotationPdf, printQuotation, QUOTATION_STATUS_LABEL, quotationHtml, type StoreQuotation } from '@/lib/store-documents';

/** The customer's quotation. Its long random link is the key, so no sign-in is needed. */
export default function StoreQuotationPage() {
  const params = useParams<{ token: string }>();
  const token = decodeURIComponent(String(params?.token || ''));
  const [quotation, setQuotation] = useState<StoreQuotation | null>(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    void (async () => {
      const response = await apiFetch(`/api/store/quotations/${encodeURIComponent(token)}`, { cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!alive) return;
      if (!response.ok) setError(data?.error || 'Quotation not found.');
      else setQuotation(data.quotation);
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const render = useMemo(() => (quotation ? (origin: string) => quotationHtml(quotation, origin) : null), [quotation]);

  const download = async () => {
    if (!quotation) return;
    setDownloading(true);
    try {
      await downloadQuotationPdf(quotation);
    } finally {
      setDownloading(false);
    }
  };

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-center">
        <div>
          <h1 className="text-lg font-semibold">Quotation not found</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <Link href="/store" className="mt-4 inline-block text-sm font-semibold underline">Back to the bookshop</Link>
        </div>
      </main>
    );
  }

  if (!quotation || !render) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading quotation" />
      </main>
    );
  }

  const acceptText = `Hello Hope Publishing House, I would like to go ahead with quotation ${quotation.quotationNumber} (${money(quotation.total, quotation.currency)}). Please send the invoice.`;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-[#123747] sm:py-10">
      <div className="mx-auto max-w-[820px] space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#087989]">Hope Publishing House</p>
            <h1 className="text-2xl font-bold">Quotation {quotation.quotationNumber}</h1>
            <p className="text-sm text-slate-600">
              {QUOTATION_STATUS_LABEL[quotation.status]} · {money(quotation.total, quotation.currency)}
              {quotation.status === 'open' && quotation.validUntil ? ` · valid until ${invoiceDate(quotation.validUntil)}` : ''}
              {quotation.status === 'accepted' && quotation.invoiceNumber ? ` · invoice ${quotation.invoiceNumber}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void download()} disabled={downloading} className="bg-[#123747] text-white hover:bg-[#0c2833]">
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download PDF
            </Button>
            <Button variant="outline" onClick={() => printQuotation(quotation)}><Printer className="h-4 w-4" /> Print</Button>
          </div>
        </div>
        {quotation.status === 'open' || quotation.status === 'expired' ? (
          <div className="flex flex-col gap-2 rounded-lg bg-white p-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p>{quotation.status === 'expired' ? 'This quotation has passed its date. Contact us and we will confirm the prices.' : 'Ready to go ahead? Tell us and we will send your invoice.'}</p>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href={`https://wa.me/265884748498?text=${encodeURIComponent(acceptText)}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp</a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={`mailto:hph@piccworldwide.org?subject=${encodeURIComponent(`Quotation ${quotation.quotationNumber}`)}&body=${encodeURIComponent(acceptText)}`}><Mail className="h-4 w-4" /> Email</a>
              </Button>
            </div>
          </div>
        ) : null}
        <DocumentPreview render={render} title={`Quotation ${quotation.quotationNumber}`} />
        <p className="text-center text-xs text-slate-500">
          Questions about this quotation? Email <a className="underline" href="mailto:hph@piccworldwide.org">hph@piccworldwide.org</a> or call +265 884748498.
        </p>
      </div>
    </main>
  );
}
