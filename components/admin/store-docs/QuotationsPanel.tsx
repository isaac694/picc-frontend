'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarX2, CheckCircle2, Copy, Download, FilePlus2, FileSignature, FileText, Loader2, Mail, MessageCircle, Pencil, Percent, Printer, RefreshCw, Search, ThumbsDown } from 'lucide-react';
import InvoiceEditorDialog, { type InvoiceDefaults } from '@/components/admin/InvoiceEditorDialog';
import { KpiCard } from '@/components/admin/DashboardBits';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';
import { DocumentPreview } from '@/components/store/InvoicePreview';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';
import { periodLabel, periodParams, withParams, type Period } from '@/lib/admin-reports';
import { money } from '@/lib/store-receipt';
import { invoiceDate, type AdminInvoice } from '@/lib/store-invoice';
import {
  downloadQuotationPdf, EMAIL_PATTERN, printQuotation, QUOTATION_STATUS_LABEL, quotationHtml, quotationShareUrl, whatsappDigits, type AdminQuotation, type QuotationStatus,
} from '@/lib/store-documents';
import { cn } from '@/lib/utils';
import { inputClass, labelClass, Pill, SumRows, type Tone } from './bits';

type Group = { count: number; value: number };
type Summary = { count: number; quoted: number; open: Group; expired: Group; accepted: Group; declined: Group; conversionRate: number | null };

const TONES: Record<QuotationStatus, Tone> = { open: 'sky', expired: 'grey', accepted: 'green', declined: 'red' };
const FILTERS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'expired', label: 'Expired' },
  { value: 'accepted', label: 'Invoiced' },
  { value: 'declined', label: 'Declined' },
];
const inDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

export default function QuotationsPanel({
  headers,
  period,
  defaults,
  onDefaultsChanged,
  onInvoiced,
}: {
  headers: () => Record<string, string>;
  period: Period;
  defaults: InvoiceDefaults | null;
  onDefaultsChanged: () => void;
  /** Called with the new invoice when a quotation is accepted. */
  onInvoiced: (invoice: AdminInvoice) => void;
}) {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [quotations, setQuotations] = useState<AdminQuotation[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminQuotation | null>(null);
  const [viewing, setViewing] = useState<AdminQuotation | null>(null);
  const [converting, setConverting] = useState<AdminQuotation | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [declining, setDeclining] = useState<AdminQuotation | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [emailing, setEmailing] = useState<AdminQuotation | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch(withParams('/api/admin/store/quotations', { ...periodParams(period), status, q: query }), { headers: headers(), cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!response.ok) return adminErrorToast(data?.error || 'Unable to load quotations.');
      setQuotations(Array.isArray(data?.quotations) ? data.quotations : []);
      setSummary(data?.summary || null);
    } finally {
      setLoading(false);
    }
  }, [period, status, query, headers]);

  useEffect(() => {
    void load();
  }, [load]);

  const replace = (updated: AdminQuotation) => {
    setQuotations((current) => (current.some((entry) => entry.id === updated.id) ? current.map((entry) => (entry.id === updated.id ? updated : entry)) : [updated, ...current]));
    setViewing((current) => (current?.id === updated.id ? updated : current));
  };

  const post = async (quotation: AdminQuotation, path: string, body: object, label: string) => {
    setBusy(`${quotation.id}:${path}`);
    try {
      const response = await apiFetch(`/api/admin/store/quotations/${encodeURIComponent(quotation.id)}/${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        adminErrorToast(data?.error || `Unable to ${label}.`);
        return null;
      }
      if (data?.quotation) replace(data.quotation);
      return data;
    } finally {
      setBusy(null);
    }
  };

  const openConvert = (quotation: AdminQuotation) => {
    setConverting(quotation);
    setDueDate(inDays(defaults?.termsDays ?? 14));
    setSendEmail(Boolean(quotation.billToEmail));
  };

  const submitConvert = async (event: FormEvent) => {
    event.preventDefault();
    if (!converting) return;
    const data = await post(converting, 'convert', { dueDate, sendEmail: sendEmail && Boolean(converting.billToEmail) }, 'make the invoice');
    if (!data) return;
    setConverting(null);
    setViewing(null);
    adminSuccessToast(`${data.invoice.invoiceNumber} issued from ${converting.quotationNumber}.${data.emailedTo ? ` Emailed to ${data.emailedTo}.` : ''}`);
    onInvoiced(data.invoice);
  };

  const submitDecline = async (event: FormEvent) => {
    event.preventDefault();
    if (!declining) return;
    const data = await post(declining, 'decline', { reason: declineReason.trim() }, 'decline this quotation');
    if (!data) return;
    setDeclining(null);
    adminSuccessToast(`${declining.quotationNumber} marked declined.`);
    void load();
  };

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault();
    if (!emailing) return;
    if (!EMAIL_PATTERN.test(emailTo.trim())) return adminErrorToast('Enter a valid email address.');
    const data = await post(emailing, 'email', { email: emailTo.trim() }, 'email this quotation');
    if (!data) return;
    adminSuccessToast(data.message || 'Quotation emailed.');
    setEmailing(null);
  };

  const download = async (quotation: AdminQuotation) => {
    setBusy(`${quotation.id}:pdf`);
    try {
      await downloadQuotationPdf(quotation);
    } catch {
      adminErrorToast('Could not make the PDF. Use Print and choose Save as PDF instead.');
    } finally {
      setBusy(null);
    }
  };

  const copyLink = async (quotation: AdminQuotation) => {
    try {
      await navigator.clipboard.writeText(quotationShareUrl(quotation));
      adminSuccessToast('Quotation link copied.');
    } catch {
      adminErrorToast('Could not copy the link.');
    }
  };

  const render = useMemo(() => (viewing ? (origin: string) => quotationHtml(viewing, origin) : null), [viewing]);
  const isBusy = (quotation: AdminQuotation, action: string) => busy === `${quotation.id}:${action}`;
  const live = (quotation: AdminQuotation) => quotation.status === 'open' || quotation.status === 'expired';

  const actions = (quotation: AdminQuotation, compact: boolean) => (
    <>
      {live(quotation) ? (
        <Button size="sm" className="h-8 text-xs" onClick={() => openConvert(quotation)}><FileSignature className="h-3.5 w-3.5" /> Make invoice</Button>
      ) : null}
      {compact ? null : (
        <>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => printQuotation(quotation)}><Printer className="h-3.5 w-3.5" /> Print</Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => void download(quotation)} disabled={isBusy(quotation, 'pdf')}>
            {isBusy(quotation, 'pdf') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} PDF
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setEmailing(quotation); setEmailTo(quotation.billToEmail || ''); }}><Mail className="h-3.5 w-3.5" /> Email</Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
            <a href={`https://wa.me/${whatsappDigits(quotation.billToContact)}?text=${encodeURIComponent(`Hope Publishing House quotation ${quotation.quotationNumber}\n${money(quotation.total, quotation.currency)}${quotation.validUntil ? ` · valid until ${invoiceDate(quotation.validUntil)}` : ''}\nView, print or download: ${quotationShareUrl(quotation)}`)}`} target="_blank" rel="noreferrer">
              <MessageCircle className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp
            </a>
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => void copyLink(quotation)}><Copy className="h-3.5 w-3.5" /> Link</Button>
          {live(quotation) ? (
            <>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setEditing(quotation); setEditorOpen(true); }}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive" onClick={() => { setDeclining(quotation); setDeclineReason(''); }}><ThumbsDown className="h-3.5 w-3.5" /> Declined</Button>
            </>
          ) : null}
        </>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={FileText} label="Quoted" value={money(summary?.quoted || 0)} detail={`${summary?.count ?? 0} quotations · ${periodLabel(period)}`} />
        <KpiCard icon={CheckCircle2} label="Turned into invoices" value={money(summary?.accepted.value || 0)} detail={`${summary?.accepted.count ?? 0} accepted`} />
        <KpiCard icon={Percent} label="Conversion rate" value={summary?.conversionRate === null || summary?.conversionRate === undefined ? '—' : `${summary.conversionRate}%`} detail="Accepted, of those decided or lapsed" />
        <KpiCard icon={CalendarX2} label="Open / expired" value={`${summary?.open.count ?? 0} / ${summary?.expired.count ?? 0}`} detail={`${money((summary?.open.value || 0) + (summary?.expired.value || 0))} to follow up`} />
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Quotation status">
          {FILTERS.map((filter) => (
            <button key={filter.value} type="button" role="tab" aria-selected={status === filter.value} onClick={() => setStatus(filter.value)} className={cn('rounded-full px-3 py-1 text-xs font-medium', status === filter.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>
              {filter.label}
            </button>
          ))}
        </div>
        <form className="relative flex-1" onSubmit={(event) => { event.preventDefault(); setQuery(search.trim()); }}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Quotation no., customer or book, then Enter" className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm" />
        </form>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-9" onClick={() => void load()} disabled={loading} aria-label="Refresh"><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /></Button>
          <Button size="sm" className="h-9" onClick={() => { setEditing(null); setEditorOpen(true); }}><FilePlus2 className="h-4 w-4" /> New quotation</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Quotation</th>
              <th className="px-3 py-2 font-medium">For</th>
              <th className="px-3 py-2 font-medium">Books</th>
              <th className="px-3 py-2 text-right font-medium">Total quoted</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {quotations.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">{loading ? 'Loading…' : 'No quotations here.'}</td></tr>
            ) : quotations.map((quotation) => (
              <tr key={quotation.id} className="border-t border-border/60 align-top">
                <td className="px-3 py-2">
                  <button type="button" className="font-mono text-xs font-semibold text-primary hover:underline" onClick={() => setViewing(quotation)}>{quotation.quotationNumber}</button>
                  <p className="text-[11px] text-muted-foreground">{invoiceDate(quotation.issueDate)} · {quotation.source === 'request' ? 'Website' : 'Counter'}</p>
                  {live(quotation) && quotation.validUntil ? (
                    <p className={cn('text-[11px]', quotation.status === 'expired' ? 'font-semibold text-destructive' : 'text-muted-foreground')}>Valid until {invoiceDate(quotation.validUntil)}</p>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  {quotation.billToName}
                  <p className="text-[11px] text-muted-foreground">{[quotation.billToContact, quotation.billToEmail].filter(Boolean).join(' · ')}</p>
                </td>
                <td className="max-w-[260px] px-3 py-2 text-xs">{quotation.items.map((line) => `${line.title} ×${line.quantity}`).join(', ')}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums">{money(quotation.total, quotation.currency)}</td>
                <td className="px-3 py-2">
                  <Pill tone={TONES[quotation.status]}>{QUOTATION_STATUS_LABEL[quotation.status]}</Pill>
                  {quotation.invoiceNumber ? <p className="mt-1 font-mono text-[11px] text-muted-foreground">{quotation.invoiceNumber}</p> : null}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap justify-end gap-1">
                    {actions(quotation, true)}
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Open ${quotation.quotationNumber}`} onClick={() => setViewing(quotation)}><FileText className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editorOpen ? (
        <InvoiceEditorDialog<AdminQuotation>
          key={editing?.id || 'new-quote'}
          kind="quotation"
          invoice={editing}
          defaults={defaults}
          headers={headers}
          onClose={() => setEditorOpen(false)}
          onSaved={(saved, emailedTo) => {
            setEditorOpen(false);
            replace(saved);
            adminSuccessToast(editing ? 'Quotation updated.' : `${saved.quotationNumber} saved.${emailedTo ? ` Emailed to ${emailedTo}.` : ''}`);
            if (!editing) setViewing(saved);
            void load();
            onDefaultsChanged();
          }}
        />
      ) : null}

      <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          {viewing && render ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">{viewing.quotationNumber} <Pill tone={TONES[viewing.status]}>{QUOTATION_STATUS_LABEL[viewing.status]}</Pill></DialogTitle>
                <DialogDescription>
                  {viewing.billToName} · {money(viewing.total, viewing.currency)}
                  {viewing.invoiceNumber ? ` · invoiced as ${viewing.invoiceNumber}` : viewing.validUntil ? ` · valid until ${invoiceDate(viewing.validUntil)}` : ''}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-1.5">{actions(viewing, false)}</div>
              {viewing.customerNote ? (
                <p className="whitespace-pre-line rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100"><strong>Note:</strong> {viewing.customerNote}</p>
              ) : null}
              <DocumentPreview render={render} title={`Quotation ${viewing.quotationNumber}`} />
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(converting)} onOpenChange={(open) => !open && setConverting(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitConvert} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Make invoice from {converting?.quotationNumber}</DialogTitle>
              <DialogDescription>The customer accepted. The invoice uses the quoted books and prices, with the quotation number as its order reference.</DialogDescription>
            </DialogHeader>
            {converting ? (
              <SumRows rows={[
                ['Subtotal', money(converting.subtotal)],
                ['Discount', `− ${money(converting.discount)}`, 'muted'],
                ['Delivery', money(converting.delivery), 'muted'],
                ['Invoice total', money(converting.total), 'strong'],
              ]} />
            ) : null}
            {converting?.status === 'expired' ? <p className="text-xs text-amber-700 dark:text-amber-300">This quotation has expired. Making the invoice honours the quoted prices; edit the quotation first to change them.</p> : null}
            <label className={labelClass}>Payment due
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required className={inputClass} />
            </label>
            {converting?.billToEmail ? (
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sendEmail} onChange={(event) => setSendEmail(event.target.checked)} /> Email the invoice to {converting.billToEmail}</label>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConverting(null)}>Close</Button>
              <Button type="submit" disabled={Boolean(converting && busy === `${converting.id}:convert`)}>
                {converting && busy === `${converting.id}:convert` ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />} Issue invoice
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(declining)} onOpenChange={(open) => !open && setDeclining(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitDecline} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Customer declined {declining?.quotationNumber}</DialogTitle>
              <DialogDescription>It stays on record for the reports.</DialogDescription>
            </DialogHeader>
            <label className={labelClass}>Reason (optional)
              <input value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} maxLength={500} autoFocus placeholder="e.g. bought elsewhere, budget" className={inputClass} />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeclining(null)}>Close</Button>
              <Button type="submit" variant="destructive">Mark declined</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(emailing)} onOpenChange={(open) => !open && setEmailing(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitEmail} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Email quotation</DialogTitle>
              <DialogDescription>{emailing ? `${emailing.quotationNumber} · ${emailing.billToName}` : ''}</DialogDescription>
            </DialogHeader>
            <label className={labelClass}>Customer email
              <input value={emailTo} onChange={(event) => setEmailTo(event.target.value)} type="email" required autoFocus className={inputClass} />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEmailing(null)}>Close</Button>
              <Button type="submit" disabled={Boolean(emailing && busy === `${emailing.id}:email`)}><Mail className="h-4 w-4" /> Send quotation</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
