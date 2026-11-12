'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Banknote, BookOpen, CheckCircle2, Clock, FilePlus2, FileText, PackageCheck, Printer, RefreshCw, Search, Truck, XCircle } from 'lucide-react';
import InvoiceEditorDialog, { type InvoiceDefaults } from '@/components/admin/InvoiceEditorDialog';
import { KpiCard } from '@/components/admin/DashboardBits';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';
import { periodLabel, periodParams, withParams, type Period } from '@/lib/admin-reports';
import { money } from '@/lib/store-receipt';
import { invoiceDate, type AdminInvoice } from '@/lib/store-invoice';
import { printDeliveryNote, type DeliveryNote } from '@/lib/store-documents';
import { cn } from '@/lib/utils';
import { inputClass, labelClass } from './bits';
import { ConfirmDeliveryDialog, DeliveryNoteViewDialog, DeliveryStatusPill, NewDeliveryNoteDialog, type DeliverySaved } from './DeliveryNoteDialogs';
import { stockMessage } from './InvoicesPanel';

type Summary = { count: number; dispatched: number; delivered: number; copies: number; value: number; collected: number };
const FILTERS = [
  { value: '', label: 'All' },
  { value: 'dispatched', label: 'Out for delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function DeliveryNotesPanel({ headers, period, defaults, onOpenInvoices }: { headers: () => Record<string, string>; period: Period; defaults: InvoiceDefaults | null; onOpenInvoices: () => void }) {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState<DeliveryNote | null>(null);
  const [confirming, setConfirming] = useState<{ note: DeliveryNote; balanceDue: number | null } | null>(null);
  const [cancelling, setCancelling] = useState<DeliveryNote | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [delivering, setDelivering] = useState<AdminInvoice | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch(withParams('/api/admin/store/delivery-notes', { ...periodParams(period), status, q: query }), { headers: headers(), cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!response.ok) return adminErrorToast(data?.error || 'Unable to load delivery notes.');
      setNotes(Array.isArray(data?.deliveryNotes) ? data.deliveryNotes : []);
      setSummary(data?.summary || null);
    } finally {
      setLoading(false);
    }
  }, [period, status, query, headers]);

  useEffect(() => {
    void load();
  }, [load]);

  const replace = (updated: DeliveryNote) => {
    setNotes((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
    setViewing((current) => (current?.id === updated.id ? updated : current));
  };

  /** Opens the confirm dialog, then fetches the invoice balance so the money collected can be checked. */
  const openConfirm = async (note: DeliveryNote) => {
    setConfirming({ note, balanceDue: null });
    const response = await apiFetch(`/api/admin/store/invoices/${encodeURIComponent(note.invoiceId)}`, { headers: headers(), cache: 'no-store' });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setConfirming(null);
      return adminErrorToast(data?.error || 'Could not load the invoice.');
    }
    setConfirming((current) => (current?.note.id === note.id ? { note, balanceDue: Number(data.invoice.balanceDue) || 0 } : current));
  };

  const confirmed = (result: DeliverySaved) => {
    setConfirming(null);
    replace(result.deliveryNote);
    const parts = [`${result.deliveryNote.deliveryNoteNumber} ${result.deliveryNote.receivedByName ? `signed for by ${result.deliveryNote.receivedByName}` : 'updated'}.`];
    if (result.deliveryNote.amountCollected > 0) parts.push(`${money(result.deliveryNote.amountCollected)} collected in total; invoice ${result.invoice.invoiceNumber} balance is now ${money(result.invoice.balanceDue)}.`);
    if (result.stock) parts.push(stockMessage(result.stock).trim());
    if (result.collectionError) parts.push(`The money was NOT recorded: ${result.collectionError}`);
    (result.collectionError || result.stock?.error ? adminErrorToast : adminSuccessToast)(parts.join(' '));
    void load();
  };

  /** A new delivery note was saved, from scratch (with its invoice) or from an existing invoice. */
  const created = (result: DeliverySaved & { invoiceCreated?: boolean }) => {
    setCreating(false);
    setDelivering(null);
    const note = result.deliveryNote;
    const parts = [`${note.deliveryNoteNumber} saved: ${note.totalCopies} ${note.totalCopies === 1 ? 'copy' : 'copies'} to ${note.deliverToName}.`];
    if (result.invoiceCreated) parts.push(`Invoice ${result.invoice.invoiceNumber} raised for ${money(result.invoice.total)}.`);
    if (note.amountCollected > 0) parts.push(`${money(note.amountCollected)} collected; balance ${money(result.invoice.balanceDue)}.`);
    if (result.stock) parts.push(stockMessage(result.stock).trim());
    if (result.collectionError) parts.push(`The money was NOT recorded: ${result.collectionError}`);
    (result.collectionError || result.stock?.error ? adminErrorToast : adminSuccessToast)(parts.join(' '));
    setViewing(note);
    void load();
  };

  const submitCancel = async (event: FormEvent) => {
    event.preventDefault();
    if (!cancelling) return;
    if (!cancelReason.trim()) return adminErrorToast('Say why the delivery is cancelled.');
    setSaving(true);
    try {
      const response = await apiFetch(`/api/admin/store/delivery-notes/${encodeURIComponent(cancelling.id)}/cancel`, { method: 'POST', headers: headers(), body: JSON.stringify({ reason: cancelReason.trim() }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) return adminErrorToast(data?.error || 'Unable to cancel this delivery note.');
      replace(data.deliveryNote);
      setCancelling(null);
      adminSuccessToast(`${data.deliveryNote.deliveryNoteNumber} cancelled.${data.stockReturned ? ` ${data.stockReturned} ${data.stockReturned === 1 ? 'copy is' : 'copies are'} back in stock.` : ''}`);
      void load();
    } finally {
      setSaving(false);
    }
  };

  const actions = (note: DeliveryNote) => (
    <>
      {note.status === 'dispatched' ? (
        <Button size="sm" className="h-8 text-xs" onClick={() => void openConfirm(note)}><PackageCheck className="h-3.5 w-3.5" /> Confirm received</Button>
      ) : null}
      {note.status === 'delivered' ? (
        <Button size="sm" variant="outline" className="h-8 border-emerald-300 bg-emerald-50 text-xs text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100" onClick={() => void openConfirm(note)}>
          <Banknote className="h-3.5 w-3.5" /> Money collected
        </Button>
      ) : null}
      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => printDeliveryNote(note)}><Printer className="h-3.5 w-3.5" /> Print</Button>
      {note.status !== 'cancelled' && note.amountCollected === 0 ? (
        <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive" onClick={() => { setCancelling(note); setCancelReason(''); }}><XCircle className="h-3.5 w-3.5" /> Cancel</Button>
      ) : null}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Truck} label="Delivery notes" value={summary?.count ?? 0} detail={`${summary?.delivered ?? 0} delivered · ${summary?.dispatched ?? 0} out · ${periodLabel(period)}`} />
        <KpiCard icon={BookOpen} label="Copies delivered" value={summary?.copies ?? 0} detail={`${money(summary?.value || 0)} at invoice prices`} />
        <KpiCard icon={Banknote} label="Collected on delivery" value={money(summary?.collected || 0)} detail="Posted to the invoices as payments" />
        <KpiCard icon={Clock} label="Awaiting signature" value={summary?.dispatched ?? 0} detail="Confirm when the signed note is back" />
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Delivery status">
          {FILTERS.map((filter) => (
            <button key={filter.value} type="button" role="tab" aria-selected={status === filter.value} onClick={() => setStatus(filter.value)} className={cn('rounded-full px-3 py-1 text-xs font-medium', status === filter.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>
              {filter.label}
            </button>
          ))}
        </div>
        <form className="relative flex-1" onSubmit={(event) => { event.preventDefault(); setQuery(search.trim()); }}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Delivery note, invoice, customer or book, then Enter" className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm" />
        </form>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-9" onClick={() => void load()} disabled={loading} aria-label="Refresh"><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /></Button>
          <Button size="sm" variant="outline" className="h-9" onClick={onOpenInvoices}><FileText className="h-4 w-4" /> Invoices</Button>
          <Button size="sm" className="h-9" onClick={() => setCreating(true)}><FilePlus2 className="h-4 w-4" /> New delivery note</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Delivery note</th>
              <th className="px-3 py-2 font-medium">Deliver to</th>
              <th className="px-3 py-2 font-medium">Books</th>
              <th className="px-3 py-2 text-right font-medium">Copies</th>
              <th className="px-3 py-2 text-right font-medium">Collected</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {notes.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">{loading ? 'Loading…' : 'No delivery notes here. Choose New delivery note to send books out.'}</td></tr>
            ) : notes.map((note) => (
              <tr key={note.id} className={cn('border-t border-border/60 align-top', note.status === 'cancelled' && 'text-muted-foreground')}>
                <td className="px-3 py-2">
                  <button type="button" className="font-mono text-xs font-semibold text-primary hover:underline" onClick={() => setViewing(note)}>{note.deliveryNoteNumber}</button>
                  <p className="text-[11px] text-muted-foreground">{invoiceDate(note.deliveryDate)} · {note.invoiceNumber}</p>
                </td>
                <td className="px-3 py-2">
                  {note.deliverToName}
                  <p className="text-[11px] text-muted-foreground">{[note.deliverToAddress, note.deliverToContact].filter(Boolean).join(' · ')}</p>
                </td>
                <td className="max-w-[240px] px-3 py-2 text-xs">{note.items.map((line) => `${line.title} ×${line.qtyDelivered}`).join(', ')}</td>
                <td className="px-3 py-2 text-right tabular-nums">{note.totalCopies}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{note.amountCollected > 0 ? money(note.amountCollected) : '—'}</td>
                <td className="px-3 py-2">
                  <DeliveryStatusPill note={note} />
                  {note.receivedByName ? <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><CheckCircle2 className="h-3 w-3" /> {note.receivedByName}</p> : null}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap justify-end gap-1">
                    {note.status === 'dispatched' ? <Button size="sm" className="h-8 text-xs" onClick={() => void openConfirm(note)}><PackageCheck className="h-3.5 w-3.5" /> Received</Button> : null}
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Open ${note.deliveryNoteNumber}`} onClick={() => setViewing(note)}><FileText className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating ? (
        <InvoiceEditorDialog<DeliverySaved & { invoiceCreated?: boolean }>
          key="new-delivery"
          kind="delivery"
          invoice={null}
          defaults={defaults}
          headers={headers}
          onClose={() => setCreating(false)}
          onSaved={created}
          onPickInvoice={(invoice) => {
            setCreating(false);
            setDelivering(invoice);
          }}
        />
      ) : null}
      {delivering ? <NewDeliveryNoteDialog key={delivering.id} invoice={delivering} headers={headers} onClose={() => setDelivering(null)} onSaved={created} /> : null}

      <DeliveryNoteViewDialog note={viewing} onClose={() => setViewing(null)} actions={viewing ? actions(viewing) : null} />

      {confirming ? (
        <ConfirmDeliveryDialog key={confirming.note.id} note={confirming.note} balanceDue={confirming.balanceDue} headers={headers} onClose={() => setConfirming(null)} onSaved={confirmed} />
      ) : null}

      <Dialog open={Boolean(cancelling)} onOpenChange={(open) => !open && setCancelling(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitCancel} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Cancel {cancelling?.deliveryNoteNumber}?</DialogTitle>
              <DialogDescription>Use this when the books did not go, or came back.</DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              The copies count as not delivered again. If the invoice is not yet paid, they go back into stock; if it is paid, they stay sold to the customer for the next delivery.
            </p>
            <label className={labelClass}>Reason (required)
              <input value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} maxLength={500} required autoFocus placeholder="e.g. customer closed, wrong address" className={inputClass} />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCancelling(null)}>Close</Button>
              <Button type="submit" variant="destructive" disabled={saving}>Cancel delivery note</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
