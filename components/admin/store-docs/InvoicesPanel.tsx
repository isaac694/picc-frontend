'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  AlertTriangle, Ban, Banknote, CheckCircle2, Clock, Copy, Download, FilePlus2, FileText, Inbox, Loader2, Mail, MessageCircle, Package, Pencil, Printer, RefreshCw, Search, Send, Truck, XCircle,
} from 'lucide-react';
import InvoiceEditorDialog, { type InvoiceDefaults } from '@/components/admin/InvoiceEditorDialog';
import { KpiCard } from '@/components/admin/DashboardBits';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import InvoicePreview from '@/components/store/InvoicePreview';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';
import { periodLabel, periodParams, withParams, type Period } from '@/lib/admin-reports';
import { money, receiptDate } from '@/lib/store-receipt';
import {
  downloadInvoicePdf, invoiceDate, invoiceShareUrl, INVOICE_STATUS_LABEL, isOverdue, printInvoice, type AdminInvoice, type InvoicePayment,
} from '@/lib/store-invoice';
import { EMAIL_PATTERN, whatsappDigits, type DeliveryNote } from '@/lib/store-documents';
import { cn } from '@/lib/utils';
import { inputClass, labelClass, PaymentMethodFields, Pill, SumRows, type Tone } from './bits';
import { DeliveryNoteViewDialog, DeliveryStatusPill, NewDeliveryNoteDialog, type DeliverySaved } from './DeliveryNoteDialogs';

type Summary = {
  count: number; waitingRequests: number; invoiced: number; paid: number; outstanding: number;
  overdue: number; overdueCount: number; pendingCount: number; paidCount: number; stockProblems: number;
};
type StockResult = { updated: boolean; copiesTaken?: number; receiptNumber?: string; error?: string; reason?: string } | null;

const STATUS_TONES: Record<AdminInvoice['status'], Tone> = { requested: 'sky', issued: 'amber', partially_paid: 'orange', paid: 'green', cancelled: 'red' };
const FILTERS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'partially_paid', label: 'Part paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
];

/** What happened to the stock when an invoice was paid, in a sentence for the toast. */
export const stockMessage = (stock: StockResult) => {
  if (!stock) return '';
  if (stock.updated) return stock.copiesTaken ? ` ${stock.copiesTaken} ${stock.copiesTaken === 1 ? 'copy' : 'copies'} taken out of stock (receipt ${stock.receiptNumber}).` : ` Sale recorded (receipt ${stock.receiptNumber}); the copies had already left stock on delivery.`;
  if (stock.error) return ` Stock NOT updated: ${stock.error}`;
  return '';
};

export const InvoiceStatusPill = ({ invoice }: { invoice: AdminInvoice }) =>
  isOverdue(invoice) ? <Pill tone="red">Overdue</Pill> : <Pill tone={STATUS_TONES[invoice.status]}>{INVOICE_STATUS_LABEL[invoice.status]}</Pill>;

function FulfilmentPill({ invoice }: { invoice: AdminInvoice }) {
  const fulfilment = invoice.fulfilment;
  if (!fulfilment || invoice.status === 'cancelled') return null;
  if (fulfilment.status === 'complete') return <Pill tone="green">Delivered</Pill>;
  if (fulfilment.status === 'partial') return <Pill tone="violet">{fulfilment.delivered}/{fulfilment.ordered} delivered</Pill>;
  return <Pill tone="grey">Not delivered</Pill>;
}

export default function InvoicesPanel({
  headers,
  period,
  defaults,
  onDefaultsChanged,
  focus,
  onFocusHandled,
}: {
  headers: () => Record<string, string>;
  period: Period;
  defaults: InvoiceDefaults | null;
  onDefaultsChanged: () => void;
  /** An invoice to open as soon as the panel shows, e.g. one just made from a quotation. */
  focus: AdminInvoice | null;
  onFocusHandled: () => void;
}) {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminInvoice | null>(null);
  const [viewing, setViewing] = useState<AdminInvoice | null>(null);
  const [viewNotes, setViewNotes] = useState<DeliveryNote[]>([]);
  const [viewingNote, setViewingNote] = useState<DeliveryNote | null>(null);
  const [paying, setPaying] = useState<AdminInvoice | null>(null);
  const [payFull, setPayFull] = useState(true);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payReference, setPayReference] = useState('');
  const [payEmail, setPayEmail] = useState(false);
  const [voiding, setVoiding] = useState<{ invoice: AdminInvoice; payment: InvoicePayment } | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [emailing, setEmailing] = useState<AdminInvoice | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [delivering, setDelivering] = useState<AdminInvoice | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Waiting requests are shown whatever the period, so an old one is never hidden.
      const params = status === 'requested' ? { status } : { ...periodParams(period), status };
      const response = await apiFetch(withParams('/api/admin/store/invoices', { ...params, q: query }), { headers: headers(), cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!response.ok) return adminErrorToast(data?.error || 'Unable to load invoices.');
      setInvoices(Array.isArray(data?.invoices) ? data.invoices : []);
      setSummary(data?.summary || null);
    } finally {
      setLoading(false);
    }
  }, [period, status, query, headers]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Opens an invoice with its delivery notes, fetched fresh. */
  const openInvoice = useCallback(async (invoice: AdminInvoice) => {
    setViewing(invoice);
    setViewNotes([]);
    const response = await apiFetch(`/api/admin/store/invoices/${encodeURIComponent(invoice.id)}`, { headers: headers(), cache: 'no-store' });
    const data = await response.json().catch(() => null);
    if (response.ok && data?.invoice) {
      setViewing((current) => (current?.id === invoice.id ? data.invoice : current));
      setViewNotes(Array.isArray(data.deliveryNotes) ? data.deliveryNotes : []);
    }
  }, [headers]);

  useEffect(() => {
    if (!focus) return;
    onFocusHandled();
    void openInvoice(focus);
  }, [focus, onFocusHandled, openInvoice]);

  /** Keeps the list and any open dialog showing the latest copy of an invoice. */
  const replace = (updated: AdminInvoice) => {
    setInvoices((current) => (current.some((entry) => entry.id === updated.id) ? current.map((entry) => (entry.id === updated.id ? updated : entry)) : [updated, ...current]));
    setViewing((current) => (current?.id === updated.id ? updated : current));
  };

  const post = async (invoice: AdminInvoice, path: string, body: object, label: string) => {
    setBusy(`${invoice.id}:${path}`);
    try {
      const response = await apiFetch(`/api/admin/store/invoices/${encodeURIComponent(invoice.id)}/${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
      const data = await response.json().catch(() => null);
      if (data?.invoice) replace(data.invoice);
      if (!response.ok) {
        adminErrorToast(data?.error || `Unable to ${label}.`);
        return null;
      }
      return data;
    } finally {
      setBusy(null);
    }
  };

  const issue = async (invoice: AdminInvoice) => {
    const data = await post(invoice, 'issue', { sendEmail: true }, 'issue this invoice');
    if (!data) return;
    adminSuccessToast(`${invoice.invoiceNumber} issued.${data.emailedTo ? ` Emailed to ${data.emailedTo}.` : invoice.billToEmail ? ' The email could not be sent; use Email to try again.' : ' Share the link with the customer.'}`);
    void load();
  };

  const retryStock = async (invoice: AdminInvoice) => {
    const data = await post(invoice, 'record-sale', {}, 'update the stock');
    if (!data) return;
    adminSuccessToast(`Stock updated.${stockMessage(data.stock)}`);
    void load();
  };

  const cancel = (invoice: AdminInvoice) =>
    confirmDeleteToast({
      title: `Cancel ${invoice.invoiceNumber}?`,
      description: 'The invoice stays on record marked cancelled and stops counting as owed.',
      onConfirm: async () => {
        const data = await post(invoice, 'cancel', {}, 'cancel this invoice');
        if (data) {
          adminSuccessToast('Invoice cancelled.');
          void load();
        }
      },
    });

  const openPayment = (invoice: AdminInvoice, full: boolean) => {
    setPaying(invoice);
    setPayFull(full);
    setPayAmount(full ? String(invoice.balanceDue) : '');
    setPayMethod('Cash');
    setPayReference('');
    setPayEmail(Boolean(invoice.billToEmail));
  };

  const payValue = paying ? (payFull ? paying.balanceDue : Number(payAmount) || 0) : 0;

  const submitPayment = async (event: FormEvent) => {
    event.preventDefault();
    if (!paying) return;
    const amount = payValue;
    if (!Number.isFinite(amount) || amount <= 0) return adminErrorToast('Enter the amount received.');
    if (amount > paying.balanceDue) return adminErrorToast(`The balance due is ${money(paying.balanceDue)}.`);
    if (payMethod !== 'Cash' && !payReference.trim()) return adminErrorToast('Enter the payment reference.');
    const data = await post(paying, 'payments', { amount, method: payMethod, reference: payReference.trim(), sendEmail: payEmail }, 'record this payment');
    if (!data) return;
    const updated: AdminInvoice = data.invoice;
    const outcome = updated.status === 'paid' ? `${updated.invoiceNumber} is fully paid.${stockMessage(data.stock)}` : `Balance ${money(updated.balanceDue)}.`;
    (data.stock?.error ? adminErrorToast : adminSuccessToast)(`${money(amount)} recorded. ${outcome}${data.emailedTo ? ` Emailed to ${data.emailedTo}.` : ''}`);
    setPaying(null);
    void load();
  };

  const submitVoid = async (event: FormEvent) => {
    event.preventDefault();
    if (!voiding) return;
    if (!voidReason.trim()) return adminErrorToast('Say why the payment is being voided.');
    const data = await post(voiding.invoice, `payments/${voiding.payment.index}/void`, { reason: voidReason.trim() }, 'void this payment');
    if (!data) return;
    adminSuccessToast(`Payment of ${money(voiding.payment.amount)} voided. Balance now ${money(data.invoice.balanceDue)}.${data.stockReturned ? ' The sale was reversed and undelivered copies are back in stock.' : ''}`);
    setVoiding(null);
    void load();
  };

  const openEmail = (invoice: AdminInvoice) => {
    setEmailing(invoice);
    setEmailTo(invoice.billToEmail || '');
  };

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault();
    if (!emailing) return;
    if (!EMAIL_PATTERN.test(emailTo.trim())) return adminErrorToast('Enter a valid email address.');
    const data = await post(emailing, 'email', { email: emailTo.trim() }, 'email this invoice');
    if (!data) return;
    adminSuccessToast(data.message || 'Invoice emailed.');
    setEmailing(null);
  };

  const copyLink = async (invoice: AdminInvoice) => {
    try {
      await navigator.clipboard.writeText(invoiceShareUrl(invoice));
      adminSuccessToast('Invoice link copied.');
    } catch {
      adminErrorToast('Could not copy the link.');
    }
  };

  const whatsappHref = (invoice: AdminInvoice) =>
    `https://wa.me/${whatsappDigits(invoice.billToContact)}?text=${encodeURIComponent(
      `Hope Publishing House invoice ${invoice.invoiceNumber}\n${money(invoice.total, invoice.currency)} · balance ${money(invoice.balanceDue, invoice.currency)}\nView, print or download: ${invoiceShareUrl(invoice)}`,
    )}`;

  const download = async (invoice: AdminInvoice) => {
    setBusy(`${invoice.id}:pdf`);
    try {
      await downloadInvoicePdf(invoice);
    } catch {
      adminErrorToast('Could not make the PDF. Use Print and choose Save as PDF instead.');
    } finally {
      setBusy(null);
    }
  };

  const deliverySaved = (result: DeliverySaved) => {
    setDelivering(null);
    replace(result.invoice);
    const parts = [`${result.deliveryNote.deliveryNoteNumber} saved: ${result.deliveryNote.totalCopies} copies.`];
    if (result.stockTaken) parts.push(`${result.stockTaken} taken out of stock.`);
    if (result.deliveryNote.amountCollected > 0) parts.push(`${money(result.deliveryNote.amountCollected)} collected and posted to ${result.invoice.invoiceNumber}.`);
    if (result.stock) parts.push(stockMessage(result.stock).trim());
    if (result.collectionError) parts.push(`The money was NOT recorded: ${result.collectionError}`);
    (result.collectionError || result.stock?.error ? adminErrorToast : adminSuccessToast)(parts.join(' '));
    setViewingNote(result.deliveryNote);
    if (viewing?.id === result.invoice.id) void openInvoice(result.invoice);
    void load();
  };

  const isBusy = (invoice: AdminInvoice, action: string) => busy === `${invoice.id}:${action}`;
  const canEdit = (invoice: AdminInvoice) => invoice.status !== 'cancelled' && !invoice.saleReference && !(invoice.fulfilment?.notes);
  const canDeliver = (invoice: AdminInvoice) => invoice.status !== 'cancelled' && invoice.status !== 'requested' && (invoice.fulfilment?.remaining ?? 1) > 0;

  /** The buttons for one invoice, shared by the table row and the preview dialog. */
  const actions = (invoice: AdminInvoice, compact: boolean) => (
    <>
      {invoice.status === 'requested' ? (
        <Button size="sm" className="h-8 text-xs" onClick={() => void issue(invoice)} disabled={isBusy(invoice, 'issue')}>
          {isBusy(invoice, 'issue') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Issue
        </Button>
      ) : null}
      {['issued', 'partially_paid', 'requested'].includes(invoice.status) ? (
        <>
          <Button size="sm" variant="outline" className="h-8 border-emerald-300 bg-emerald-50 text-xs text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100" onClick={() => openPayment(invoice, true)}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Mark paid
          </Button>
          {compact ? null : <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openPayment(invoice, false)}><Banknote className="h-3.5 w-3.5" /> Part payment</Button>}
        </>
      ) : null}
      {canDeliver(invoice) ? (
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setDelivering(invoice)}><Truck className="h-3.5 w-3.5" /> {compact ? 'Deliver' : 'Delivery note'}</Button>
      ) : null}
      {invoice.status === 'paid' && !invoice.saleReference && invoice.stockError ? (
        <Button size="sm" variant="outline" className="h-8 border-rose-300 text-xs text-rose-800" title={invoice.stockError} onClick={() => void retryStock(invoice)} disabled={isBusy(invoice, 'record-sale')}>
          {isBusy(invoice, 'record-sale') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Update stock
        </Button>
      ) : null}
      {compact ? null : (
        <>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => printInvoice(invoice)}><Printer className="h-3.5 w-3.5" /> Print</Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => void download(invoice)} disabled={isBusy(invoice, 'pdf')}>
            {isBusy(invoice, 'pdf') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} PDF
          </Button>
          {invoice.status !== 'requested' && invoice.status !== 'cancelled' ? (
            <>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openEmail(invoice)}><Mail className="h-3.5 w-3.5" /> Email</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
                <a href={whatsappHref(invoice)} target="_blank" rel="noreferrer"><MessageCircle className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp</a>
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => void copyLink(invoice)}><Copy className="h-3.5 w-3.5" /> Link</Button>
            </>
          ) : null}
          {canEdit(invoice) ? <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setEditing(invoice); setEditorOpen(true); }}><Pencil className="h-3.5 w-3.5" /> Edit</Button> : null}
          {invoice.status !== 'cancelled' && invoice.amountPaid === 0 && !(invoice.fulfilment?.notes) ? (
            <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive" onClick={() => cancel(invoice)}><XCircle className="h-3.5 w-3.5" /> Cancel</Button>
          ) : null}
        </>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      {summary?.waitingRequests ? (
        <button
          type="button"
          onClick={() => setStatus('requested')}
          className="flex w-full items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-left text-sm text-sky-900 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100"
        >
          <Inbox className="h-5 w-5 shrink-0" />
          <span><strong>{summary.waitingRequests} older invoice {summary.waitingRequests === 1 ? 'request is' : 'requests are'} waiting.</strong> Check the prices, then issue {summary.waitingRequests === 1 ? 'it' : 'them'}.</span>
        </button>
      ) : null}
      {summary?.stockProblems ? (
        <p className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span><strong>{summary.stockProblems} paid {summary.stockProblems === 1 ? 'invoice has' : 'invoices have'} not come out of stock</strong> because copies were short. Add the stock, then press Update stock on {summary.stockProblems === 1 ? 'it' : 'each'}.</span>
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={FileText} label="Invoiced" value={money(summary?.invoiced || 0)} detail={`${summary?.count ?? 0} invoices · ${periodLabel(period)}`} />
        <KpiCard icon={CheckCircle2} label="Paid" value={money(summary?.paid || 0)} detail={`${summary?.paidCount ?? 0} fully paid`} />
        <KpiCard icon={Clock} label="Pending (owed)" value={money(summary?.outstanding || 0)} detail={`${summary?.pendingCount ?? 0} not fully paid`} />
        <KpiCard icon={AlertTriangle} label="Overdue" value={money(summary?.overdue || 0)} detail={`${summary?.overdueCount ?? 0} past the due date`} />
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Payment status">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              role="tab"
              aria-selected={status === filter.value}
              onClick={() => setStatus(filter.value)}
              className={cn('rounded-full px-3 py-1 text-xs font-medium', status === filter.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <form className="relative flex-1" onSubmit={(event) => { event.preventDefault(); setQuery(search.trim()); }}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Invoice no., customer, reference or book, then Enter" className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm" />
        </form>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-9" onClick={() => void load()} disabled={loading} aria-label="Refresh"><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /></Button>
          <Button size="sm" className="h-9" onClick={() => { setEditing(null); setEditorOpen(true); }}><FilePlus2 className="h-4 w-4" /> New invoice</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Invoice</th>
              <th className="px-3 py-2 font-medium">Bill to</th>
              <th className="px-3 py-2 font-medium">Books</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
              <th className="px-3 py-2 text-right font-medium">Paid</th>
              <th className="px-3 py-2 text-right font-medium">Balance</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">{loading ? 'Loading…' : 'No invoices here.'}</td></tr>
            ) : invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t border-border/60 align-top">
                <td className="px-3 py-2">
                  <button type="button" className="font-mono text-xs font-semibold text-primary hover:underline" onClick={() => void openInvoice(invoice)}>{invoice.invoiceNumber}</button>
                  <p className="text-[11px] text-muted-foreground">
                    {invoiceDate(invoice.issueDate || invoice.createdAt)} · {invoice.source === 'request' ? 'Website' : invoice.source === 'quotation' ? `From ${invoice.orderReference}` : 'Counter'}
                  </p>
                  {invoice.dueDate && invoice.status !== 'paid' && invoice.status !== 'cancelled' ? (
                    <p className={cn('text-[11px]', isOverdue(invoice) ? 'font-semibold text-destructive' : 'text-muted-foreground')}>Due {invoiceDate(invoice.dueDate)}</p>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  {invoice.billToName}
                  <p className="text-[11px] text-muted-foreground">{[invoice.billToContact, invoice.billToEmail].filter(Boolean).join(' · ')}</p>
                </td>
                <td className="max-w-[240px] px-3 py-2 text-xs">
                  {invoice.items.map((line) => `${line.title} ×${line.quantity}`).join(', ')}
                  <div className="mt-1"><FulfilmentPill invoice={invoice} /></div>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums">{money(invoice.total, invoice.currency)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-emerald-700 dark:text-emerald-300">{invoice.amountPaid ? money(invoice.amountPaid, invoice.currency) : '—'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{invoice.status === 'cancelled' ? '—' : money(invoice.balanceDue, invoice.currency)}</td>
                <td className="px-3 py-2">
                  <InvoiceStatusPill invoice={invoice} />
                  {invoice.saleReceiptNumber ? <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><Package className="h-3 w-3" /> Stock updated · {invoice.saleReceiptNumber}</p> : null}
                  {invoice.stockError && !invoice.saleReference ? <p className="mt-1 max-w-[160px] text-[11px] font-medium text-destructive">Stock not updated</p> : null}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap justify-end gap-1">
                    {actions(invoice, true)}
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Open ${invoice.invoiceNumber}`} title="Open, print or share" onClick={() => void openInvoice(invoice)}><FileText className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editorOpen ? (
        <InvoiceEditorDialog<AdminInvoice>
          key={editing?.id || 'new'}
          invoice={editing}
          defaults={defaults}
          headers={headers}
          onClose={() => setEditorOpen(false)}
          onSaved={(saved, emailedTo) => {
            setEditorOpen(false);
            replace(saved);
            adminSuccessToast(editing ? 'Invoice updated.' : `${saved.invoiceNumber} issued.${emailedTo ? ` Emailed to ${emailedTo}.` : ''}`);
            if (!editing) void openInvoice(saved);
            void load();
            onDefaultsChanged();
          }}
        />
      ) : null}

      {delivering ? <NewDeliveryNoteDialog key={delivering.id} invoice={delivering} headers={headers} onClose={() => setDelivering(null)} onSaved={deliverySaved} /> : null}
      <DeliveryNoteViewDialog note={viewingNote} onClose={() => setViewingNote(null)} />

      <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          {viewing ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">{viewing.invoiceNumber} <InvoiceStatusPill invoice={viewing} /> <FulfilmentPill invoice={viewing} /></DialogTitle>
                <DialogDescription>
                  {viewing.billToName} · {money(viewing.total, viewing.currency)}{viewing.status !== 'cancelled' ? ` · paid ${money(viewing.amountPaid, viewing.currency)} · balance ${money(viewing.balanceDue, viewing.currency)}` : ''}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-1.5">{actions(viewing, false)}</div>
              {viewing.stockError && !viewing.saleReference ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100"><strong>Stock not updated:</strong> {viewing.stockError}</p>
              ) : null}
              {viewing.customerNote ? (
                <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100"><strong>Customer note:</strong> {viewing.customerNote}</p>
              ) : null}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-border/60 p-3 text-xs">
                  <p className="mb-1 font-semibold">Payments</p>
                  {viewing.payments.length ? (
                    <ul className="space-y-1 text-muted-foreground">
                      {viewing.payments.map((payment) => (
                        <li key={`${payment.at}-${payment.index}`} className={cn('flex items-start justify-between gap-2', payment.voided && 'line-through opacity-70')}>
                          <span>
                            {receiptDate(payment.at)} · <strong className="text-foreground">{money(payment.amount, viewing.currency)}</strong> · {payment.method}
                            {payment.reference ? ` · ${payment.reference}` : ''}{payment.deliveryNoteId ? ' · on delivery' : ''}{payment.by ? ` · by ${payment.by}` : ''}
                            {payment.voided ? <span className="block no-underline">Voided{payment.voidedBy ? ` by ${payment.voidedBy}` : ''}: {payment.voidReason}</span> : null}
                          </span>
                          {!payment.voided && viewing.status !== 'cancelled' ? (
                            <button type="button" className="shrink-0 text-destructive hover:underline" onClick={() => { setVoiding({ invoice: viewing, payment }); setVoidReason(''); }}>
                              <Ban className="mr-0.5 inline h-3 w-3" /> Void
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-muted-foreground">No payments yet.</p>}
                </div>
                <div className="rounded-lg border border-border/60 p-3 text-xs">
                  <p className="mb-1 font-semibold">Delivery notes</p>
                  {viewNotes.length ? (
                    <ul className="space-y-1 text-muted-foreground">
                      {viewNotes.map((note) => (
                        <li key={note.id} className="flex items-center justify-between gap-2">
                          <button type="button" className="text-left hover:underline" onClick={() => setViewingNote(note)}>
                            <span className="font-mono font-semibold text-foreground">{note.deliveryNoteNumber}</span> · {invoiceDate(note.deliveryDate)} · {note.totalCopies} copies
                            {note.amountCollected > 0 ? ` · ${money(note.amountCollected)} collected` : ''}
                          </button>
                          <DeliveryStatusPill note={note} />
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-muted-foreground">Nothing delivered yet.</p>}
                  {viewing.fulfilment && viewing.fulfilment.remaining > 0 && viewing.status !== 'cancelled' ? (
                    <p className="mt-2">{viewing.fulfilment.remaining} of {viewing.fulfilment.ordered} copies still to deliver.</p>
                  ) : null}
                </div>
              </div>
              <InvoicePreview invoice={viewing} />
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(paying)} onOpenChange={(open) => !open && setPaying(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitPayment} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{payFull ? 'Mark as paid' : 'Record part payment'}</DialogTitle>
              <DialogDescription>{paying ? `${paying.invoiceNumber} · ${paying.billToName}` : ''}</DialogDescription>
            </DialogHeader>
            <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs font-medium" role="radiogroup" aria-label="Amount">
              {[{ full: true, label: 'Full balance' }, { full: false, label: 'Part payment' }].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  role="radio"
                  aria-checked={payFull === option.full}
                  onClick={() => { setPayFull(option.full); if (!option.full) setPayAmount(''); }}
                  className={cn('flex-1 rounded-md px-3 py-1.5', payFull === option.full ? 'bg-background shadow-sm' : 'text-muted-foreground')}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {!payFull ? (
              <label className={labelClass}>
                Amount received (MWK)
                <input type="number" min={0} max={paying?.balanceDue} step="any" value={payAmount} onChange={(event) => setPayAmount(event.target.value)} required autoFocus className={inputClass} />
              </label>
            ) : null}
            <PaymentMethodFields method={payMethod} reference={payReference} onMethod={setPayMethod} onReference={setPayReference} />
            {paying ? (
              <SumRows rows={[
                ['Invoice total', money(paying.total)],
                ['Paid before', money(paying.amountPaid), 'muted'],
                ['This payment', money(Math.min(payValue, paying.balanceDue))],
                ['Balance after', money(Math.max(0, paying.balanceDue - payValue)), 'strong'],
              ]} />
            ) : null}
            {paying && payValue >= paying.balanceDue && paying.items.some((line) => line.productId) ? (
              <p className="text-xs text-muted-foreground">
                The invoice becomes <strong className="text-foreground">Paid</strong> and its books come out of stock (copies already delivered are not taken twice).
              </p>
            ) : null}
            {paying?.billToEmail ? (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={payEmail} onChange={(event) => setPayEmail(event.target.checked)} /> Email the updated invoice to {paying.billToEmail}
              </label>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaying(null)}>Close</Button>
              <Button type="submit" disabled={Boolean(paying && busy === `${paying.id}:payments`)}>
                {paying && busy === `${paying.id}:payments` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                {payFull ? 'Mark paid' : 'Record payment'} · {money(payValue)}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(voiding)} onOpenChange={(open) => !open && setVoiding(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitVoid} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Void payment</DialogTitle>
              <DialogDescription>
                {voiding ? `${money(voiding.payment.amount)} ${voiding.payment.method} on ${receiptDate(voiding.payment.at)} · ${voiding.invoice.invoiceNumber}` : ''}
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              The payment stays on record, crossed out, and the balance goes back up.
              {voiding?.invoice.saleReference ? ' The invoice will no longer be paid, so its sale receipt is cancelled and any copies not yet delivered go back into stock.' : ''}
            </p>
            <label className={labelClass}>
              Reason (required)
              <input value={voidReason} onChange={(event) => setVoidReason(event.target.value)} maxLength={300} required autoFocus placeholder="e.g. entered twice, cheque bounced" className={inputClass} />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setVoiding(null)}>Close</Button>
              <Button type="submit" variant="destructive" disabled={Boolean(voiding && busy?.startsWith(`${voiding.invoice.id}:payments/`))}><Ban className="h-4 w-4" /> Void payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(emailing)} onOpenChange={(open) => !open && setEmailing(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitEmail} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Email invoice</DialogTitle>
              <DialogDescription>{emailing ? `${emailing.invoiceNumber} · ${emailing.billToName}` : ''}</DialogDescription>
            </DialogHeader>
            <label className={labelClass}>
              Customer email
              <input value={emailTo} onChange={(event) => setEmailTo(event.target.value)} type="email" required autoFocus className={inputClass} />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEmailing(null)}>Close</Button>
              <Button type="submit" disabled={Boolean(emailing && busy === `${emailing.id}:email`)}><Mail className="h-4 w-4" /> Send invoice</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
