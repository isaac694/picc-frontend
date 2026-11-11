'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Banknote, CheckCircle2, Copy, Download, FilePlus2, FileText, Inbox, Loader2, Mail, MessageCircle, Pencil, Printer, Receipt, RefreshCw, Search, Send, XCircle,
} from 'lucide-react';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import InvoiceEditorDialog, { type InvoiceDefaults } from '@/components/admin/InvoiceEditorDialog';
import PeriodFilter from '@/components/admin/PeriodFilter';
import { KpiCard } from '@/components/admin/DashboardBits';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import InvoicePreview from '@/components/store/InvoicePreview';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiFetch } from '@/lib/api';
import { periodLabel, periodParams, withParams, type Period } from '@/lib/admin-reports';
import { money, receiptDate, REFERENCE_HINTS } from '@/lib/store-receipt';
import { downloadInvoicePdf, invoiceDate, invoiceShareUrl, INVOICE_STATUS_LABEL, printInvoice, type AdminInvoice, type InvoiceStatus } from '@/lib/store-invoice';
import { cn } from '@/lib/utils';

type Summary = { count: number; waitingRequests: number; invoiced: number; paid: number; outstanding: number };

const PAYMENT_METHODS = ['Cash', 'POS', 'Bank Transfer', 'Airtel Money agent', 'TNM Mpamba'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUS_STYLES: Record<InvoiceStatus, string> = {
  requested: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  issued: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  partially_paid: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
};

/** Malawi number in the form WhatsApp links need, or '' when there is none. */
const whatsappDigits = (phone?: string | null) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 9) return `265${digits}`;
  if (digits.length === 10 && digits.startsWith('0')) return `265${digits.slice(1)}`;
  return digits.startsWith('265') ? digits : '';
};

export default function StoreInvoicesPage() {
  const { token, email, password, loginError, setEmail, setPassword, handleLogin } = useAdminAuth();
  const [period, setPeriod] = useState<Period>({ preset: 'month' });
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [defaults, setDefaults] = useState<InvoiceDefaults | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminInvoice | null>(null);
  const [viewing, setViewing] = useState<AdminInvoice | null>(null);
  const [paying, setPaying] = useState<AdminInvoice | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payReference, setPayReference] = useState('');
  const [payEmail, setPayEmail] = useState(false);
  const [emailing, setEmailing] = useState<AdminInvoice | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const headers = useCallback(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }), [token]);

  const load = useCallback(async () => {
    if (!token) return;
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
  }, [token, period, status, query, headers]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadDefaults = useCallback(async () => {
    if (!token) return;
    const response = await apiFetch('/api/admin/store/invoice-defaults', { headers: headers() });
    const data = await response.json().catch(() => null);
    if (response.ok) setDefaults({ paymentInstructions: data?.paymentInstructions || null, termsDays: data?.termsDays || 14 });
  }, [token, headers]);

  useEffect(() => {
    void loadDefaults();
  }, [loadDefaults]);

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
      if (!response.ok) {
        adminErrorToast(data?.error || `Unable to ${label}.`);
        return null;
      }
      if (data?.invoice) replace(data.invoice);
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

  const recordSale = async (invoice: AdminInvoice) => {
    const data = await post(invoice, 'record-sale', {}, 'record this sale');
    if (!data) return;
    adminSuccessToast(`Recorded as sale ${data.invoice.saleReceiptNumber}. Copies taken out of stock.`);
  };

  const cancel = (invoice: AdminInvoice) =>
    confirmDeleteToast({
      title: `Cancel ${invoice.invoiceNumber}?`,
      description: 'The invoice stays on record marked cancelled. Payments already recorded are not refunded here.',
      onConfirm: async () => {
        const data = await post(invoice, 'cancel', {}, 'cancel this invoice');
        if (data) {
          adminSuccessToast('Invoice cancelled.');
          void load();
        }
      },
    });

  const openPayment = (invoice: AdminInvoice) => {
    setPaying(invoice);
    setPayAmount(String(invoice.balanceDue));
    setPayMethod('Cash');
    setPayReference('');
    setPayEmail(Boolean(invoice.billToEmail));
  };

  const submitPayment = async (event: FormEvent) => {
    event.preventDefault();
    if (!paying) return;
    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) return adminErrorToast('Enter the amount received.');
    if (amount > paying.balanceDue) return adminErrorToast(`The balance due is ${money(paying.balanceDue)}.`);
    if (payMethod !== 'Cash' && !payReference.trim()) return adminErrorToast(`Enter the ${REFERENCE_HINTS[payMethod] || 'payment reference'}.`);
    const data = await post(paying, 'payments', { amount, method: payMethod, reference: payReference.trim(), sendEmail: payEmail }, 'record this payment');
    if (!data) return;
    const updated: AdminInvoice = data.invoice;
    adminSuccessToast(`${money(amount)} recorded. ${updated.status === 'paid' ? 'Invoice fully paid.' : `Balance ${money(updated.balanceDue)}.`}${data.emailedTo ? ` Emailed to ${data.emailedTo}.` : ''}`);
    setPaying(null);
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

  const openEditor = (invoice: AdminInvoice | null) => {
    setEditing(invoice);
    setEditorOpen(true);
  };

  if (!token) {
    return <AdminLoginCard email={email} password={password} loginError={loginError} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={handleLogin} />;
  }

  const isBusy = (invoice: AdminInvoice, action: string) => busy === `${invoice.id}:${action}`;
  const canEdit = (invoice: AdminInvoice) => invoice.status !== 'cancelled' && !invoice.saleReference;

  /** The buttons for one invoice, shared by the table row and the preview dialog. */
  const actions = (invoice: AdminInvoice, compact: boolean) => (
    <>
      {invoice.status === 'requested' ? (
        <Button size="sm" className="h-8 text-xs" onClick={() => void issue(invoice)} disabled={isBusy(invoice, 'issue')}>
          {isBusy(invoice, 'issue') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Issue
        </Button>
      ) : null}
      {['issued', 'partially_paid', 'requested'].includes(invoice.status) ? (
        <Button size="sm" variant="outline" className="h-8 border-emerald-300 bg-emerald-50 text-xs text-emerald-900 hover:bg-emerald-100" onClick={() => openPayment(invoice)}>
          <Banknote className="h-3.5 w-3.5" /> Payment
        </Button>
      ) : null}
      {invoice.status === 'paid' && !invoice.saleReference && invoice.items.some((line) => line.productId) ? (
        <Button size="sm" variant="outline" className="h-8 text-xs" title="Take the books out of stock and issue a receipt" onClick={() => void recordSale(invoice)} disabled={isBusy(invoice, 'record-sale')}>
          {isBusy(invoice, 'record-sale') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Receipt className="h-3.5 w-3.5" />} Record sale
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
          {canEdit(invoice) ? <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openEditor(invoice)}><Pencil className="h-3.5 w-3.5" /> Edit</Button> : null}
          {invoice.status !== 'cancelled' && !invoice.saleReference ? (
            <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive" onClick={() => cancel(invoice)}><XCircle className="h-3.5 w-3.5" /> Cancel</Button>
          ) : null}
        </>
      )}
    </>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/70">Hope Publishing House</p>
          <h1 className="text-2xl font-semibold">Book invoices</h1>
          <p className="text-sm text-muted-foreground">Issue invoices at the counter, answer customers&apos; invoice requests from the website, and record payments.</p>
        </div>
        <Button onClick={() => openEditor(null)}><FilePlus2 className="h-4 w-4" /> New invoice</Button>
      </div>

      {summary?.waitingRequests ? (
        <button
          type="button"
          onClick={() => setStatus('requested')}
          className="flex w-full items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-left text-sm text-sky-900 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100"
        >
          <Inbox className="h-5 w-5 shrink-0" />
          <span><strong>{summary.waitingRequests} invoice {summary.waitingRequests === 1 ? 'request is' : 'requests are'} waiting.</strong> Check the prices and add any delivery, then issue {summary.waitingRequests === 1 ? 'it' : 'them'}.</span>
        </button>
      ) : null}

      <div className="rounded-xl border border-border/60 bg-card p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Period for the figures and invoices below</p>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={FileText} label="Invoiced" value={money(summary?.invoiced || 0)} detail={periodLabel(period)} />
        <KpiCard icon={CheckCircle2} label="Paid" value={money(summary?.paid || 0)} />
        <KpiCard icon={Banknote} label="Outstanding" value={money(summary?.outstanding || 0)} />
        <KpiCard icon={Inbox} label="Requests waiting" value={summary?.waitingRequests ?? '—'} />
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-3 sm:flex-row">
        <form className="relative flex-1" onSubmit={(event) => { event.preventDefault(); setQuery(search.trim()); }}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Invoice no., customer, reference or book, then Enter" className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm" />
        </form>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-sm" aria-label="Status">
          <option value="">Any status</option>
          <option value="open">Not yet paid</option>
          <option value="requested">Requests waiting</option>
          <option value="issued">Issued</option>
          <option value="partially_paid">Partly paid</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <Button size="sm" variant="outline" className="h-9" onClick={() => void load()} disabled={loading} aria-label="Refresh"><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /></Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Invoice</th>
              <th className="px-3 py-2 font-medium">Bill to</th>
              <th className="px-3 py-2 font-medium">Books</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium">Balance</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">{loading ? 'Loading…' : 'No invoices here yet.'}</td></tr>
            ) : invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t border-border/60 align-top">
                <td className="px-3 py-2">
                  <button type="button" className="font-mono text-xs font-semibold text-primary hover:underline" onClick={() => setViewing(invoice)}>{invoice.invoiceNumber}</button>
                  <p className="text-[11px] text-muted-foreground">
                    {receiptDate(invoice.createdAt)} · {invoice.source === 'request' ? 'Website request' : 'Counter'}
                  </p>
                  {invoice.dueDate && invoice.status !== 'paid' && invoice.status !== 'cancelled' ? (
                    <p className={cn('text-[11px]', new Date(invoice.dueDate) < new Date() ? 'font-semibold text-destructive' : 'text-muted-foreground')}>Due {invoiceDate(invoice.dueDate)}</p>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  {invoice.billToName}
                  <p className="text-[11px] text-muted-foreground">{[invoice.billToContact, invoice.billToEmail].filter(Boolean).join(' · ')}</p>
                </td>
                <td className="max-w-[260px] px-3 py-2 text-xs">{invoice.items.map((line) => `${line.title} ×${line.quantity}`).join(', ')}</td>
                <td className="whitespace-nowrap px-3 py-2 font-semibold">{money(invoice.total, invoice.currency)}</td>
                <td className="whitespace-nowrap px-3 py-2">{invoice.status === 'cancelled' ? '—' : money(invoice.balanceDue, invoice.currency)}</td>
                <td className="px-3 py-2">
                  <span className={cn('whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold', STATUS_STYLES[invoice.status])}>{INVOICE_STATUS_LABEL[invoice.status]}</span>
                  {invoice.saleReceiptNumber ? <p className="mt-1 font-mono text-[11px] text-muted-foreground">Sale {invoice.saleReceiptNumber}</p> : null}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap justify-end gap-1">
                    {actions(invoice, true)}
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Open ${invoice.invoiceNumber}`} title="Open, print or share" onClick={() => setViewing(invoice)}><FileText className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editorOpen ? <InvoiceEditorDialog
        key={editing?.id || 'new'}
        invoice={editing}
        defaults={defaults}
        headers={headers}
        onClose={() => setEditorOpen(false)}
        onSaved={(saved, emailedTo) => {
          setEditorOpen(false);
          replace(saved);
          adminSuccessToast(editing ? 'Invoice updated.' : `${saved.invoiceNumber} issued.${emailedTo ? ` Emailed to ${emailedTo}.` : ''}`);
          if (!editing) setViewing(saved);
          void load();
          void loadDefaults();
        }}
      /> : null}

      <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          {viewing ? (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.invoiceNumber} · {INVOICE_STATUS_LABEL[viewing.status]}</DialogTitle>
                <DialogDescription>
                  {viewing.billToName} · {money(viewing.total, viewing.currency)}{viewing.status !== 'cancelled' ? ` · balance ${money(viewing.balanceDue, viewing.currency)}` : ''}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-1.5">{actions(viewing, false)}</div>
              {viewing.customerNote ? (
                <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100"><strong>Customer note:</strong> {viewing.customerNote}</p>
              ) : null}
              {viewing.payments.length ? (
                <div className="rounded-lg border border-border/60 p-3 text-xs">
                  <p className="mb-1 font-semibold">Payments</p>
                  <ul className="space-y-0.5 text-muted-foreground">
                    {viewing.payments.map((payment, index) => (
                      <li key={`${payment.at}-${index}`}>
                        {receiptDate(payment.at)} · <strong className="text-foreground">{money(payment.amount, viewing.currency)}</strong> · {payment.method}
                        {payment.reference ? ` · ${payment.reference}` : ''}{payment.by ? ` · by ${payment.by}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <InvoicePreview invoice={viewing} />
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(paying)} onOpenChange={(open) => !open && setPaying(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitPayment} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Record payment</DialogTitle>
              <DialogDescription>{paying ? `${paying.invoiceNumber} · ${paying.billToName} · balance ${money(paying.balanceDue, paying.currency)}` : ''}</DialogDescription>
            </DialogHeader>
            <label className="block text-xs text-muted-foreground">
              Amount received (MWK)
              <input type="number" min={0} step="any" value={payAmount} onChange={(event) => setPayAmount(event.target.value)} required autoFocus className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground" />
            </label>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Paid by">
              {PAYMENT_METHODS.map((entry) => (
                <button key={entry} type="button" role="radio" aria-checked={payMethod === entry} onClick={() => setPayMethod(entry)} className={cn('rounded-full border px-3 py-1 text-xs font-medium', payMethod === entry ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground/70 hover:bg-muted')}>
                  {entry}
                </button>
              ))}
            </div>
            {payMethod !== 'Cash' ? (
              <label className="block text-xs text-muted-foreground">
                {REFERENCE_HINTS[payMethod]} (required)
                <input value={payReference} onChange={(event) => setPayReference(event.target.value)} maxLength={120} required className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground" />
              </label>
            ) : null}
            {paying?.billToEmail ? (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={payEmail} onChange={(event) => setPayEmail(event.target.checked)} /> Email the updated invoice to {paying.billToEmail}
              </label>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaying(null)}>Close</Button>
              <Button type="submit" disabled={Boolean(paying && busy === `${paying.id}:payments`)}><Banknote className="h-4 w-4" /> Record payment</Button>
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
            <label className="block text-xs text-muted-foreground">
              Customer email
              <input value={emailTo} onChange={(event) => setEmailTo(event.target.value)} type="email" required autoFocus className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground" />
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
