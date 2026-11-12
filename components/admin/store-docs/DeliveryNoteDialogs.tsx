'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Download, Loader2, Printer, Truck } from 'lucide-react';
import { adminErrorToast } from '@/components/admin/admin-toast';
import { DocumentPreview } from '@/components/store/InvoicePreview';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';
import { money } from '@/lib/store-receipt';
import { invoiceDate, type AdminInvoice } from '@/lib/store-invoice';
import {
  DELIVERY_STATUS_LABEL, deliveryNoteHtml, downloadDeliveryNotePdf, printDeliveryNote, type DeliveryNote,
} from '@/lib/store-documents';
import { inputClass, labelClass, PaymentMethodFields, Pill, SumRows, todayInput } from './bits';

export type DeliverySaved = {
  deliveryNote: DeliveryNote;
  invoice: AdminInvoice;
  stockTaken?: number;
  stock?: { updated: boolean; copiesTaken?: number; error?: string } | null;
  collectionError?: string | null;
};

export type CollectState = { amount: string; method: string; reference: string };

export function readCollection(collect: CollectState, balance: number) {
  const amount = Number(collect.amount) || 0;
  if (amount < 0) return { error: 'Enter a valid amount.' };
  if (amount > balance) return { error: `The invoice balance is ${money(balance)}. Collect that amount or less.` };
  if (amount > 0 && collect.method !== 'Cash' && !collect.reference.trim()) return { error: 'Enter the payment reference.' };
  return { amount };
}

/** Money handed over with the books, with what the invoice balance becomes. */
export function CollectFields({ collect, onChange, balance }: { collect: CollectState; onChange: (next: CollectState) => void; balance: number }) {
  const amount = Math.min(balance, Math.max(0, Number(collect.amount) || 0));
  return (
    <fieldset className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
      <legend className="px-1 text-xs font-semibold text-emerald-900 dark:text-emerald-200">Money collected on delivery</legend>
      <div className="flex items-end gap-2">
        <label className={`${labelClass} flex-1`}>
          Amount (MWK)
          <input type="number" min={0} max={balance} step="any" value={collect.amount} onChange={(event) => onChange({ ...collect, amount: event.target.value })} placeholder="0" className={inputClass} />
        </label>
        <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => onChange({ ...collect, amount: String(balance) })} disabled={balance <= 0}>Full balance</Button>
      </div>
      {amount > 0 ? (
        <PaymentMethodFields method={collect.method} reference={collect.reference} onMethod={(method) => onChange({ ...collect, method })} onReference={(reference) => onChange({ ...collect, reference })} />
      ) : null}
      <SumRows rows={[
        ['Invoice balance now', money(balance)],
        ['Collected on delivery', `− ${money(amount)}`],
        ['Balance after delivery', money(balance - amount), 'strong'],
      ]} />
      <p className="text-[11px] text-muted-foreground">It is recorded as a payment on the invoice{amount >= balance && balance > 0 ? ', which is then fully paid' : ''}.</p>
    </fieldset>
  );
}

/** Sends some or all of an invoice's books out on a new delivery note. */
export function NewDeliveryNoteDialog({
  invoice,
  headers,
  onClose,
  onSaved,
}: {
  invoice: AdminInvoice;
  headers: () => Record<string, string>;
  onClose: () => void;
  onSaved: (result: DeliverySaved) => void;
}) {
  const fulfilment = invoice.fulfilment;
  const lineState = invoice.items.map((line, index) => {
    const delivered = fulfilment?.lines[index]?.delivered ?? 0;
    return { line: index, title: line.title, productId: line.productId || null, ordered: line.quantity, delivered, remaining: Math.max(0, line.quantity - delivered), unitPrice: line.unitPrice };
  });
  const [quantities, setQuantities] = useState<number[]>(() => lineState.map((line) => line.remaining));
  const [deliveryDate, setDeliveryDate] = useState(todayInput());
  const [deliverToName, setDeliverToName] = useState(invoice.billToName);
  const [deliverToAddress, setDeliverToAddress] = useState(invoice.billToAddress || '');
  const [deliverToContact, setDeliverToContact] = useState(invoice.billToContact || '');
  const [deliveredByName, setDeliveredByName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [received, setReceived] = useState(false);
  const [receivedByName, setReceivedByName] = useState('');
  const [collect, setCollect] = useState<CollectState>({ amount: '', method: 'Cash', reference: '' });
  const [saving, setSaving] = useState(false);

  const copies = quantities.reduce((sum, quantity) => sum + quantity, 0);
  const value = lineState.reduce((sum, line, index) => sum + quantities[index] * line.unitPrice, 0);
  // Copies leave stock now unless the paid invoice already took them.
  const stockNow = lineState.reduce((sum, line, index) => {
    if (!line.productId) return sum;
    const out = invoice.stockOut?.[index] ?? 0;
    return sum + Math.max(0, line.delivered + quantities[index] - out);
  }, 0);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (copies === 0) return adminErrorToast('Enter how many copies are going out.');
    if (received && !receivedByName.trim()) return adminErrorToast('Enter the name of the person who received the books.');
    const collection = readCollection(collect, invoice.balanceDue);
    if (collection.error) return adminErrorToast(collection.error);
    setSaving(true);
    try {
      const response = await apiFetch(`/api/admin/store/invoices/${encodeURIComponent(invoice.id)}/delivery-notes`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          items: lineState.map((line, index) => ({ line: line.line, qtyDelivered: quantities[index] })).filter((entry) => entry.qtyDelivered > 0),
          deliveryDate,
          deliverToName: deliverToName.trim(),
          deliverToAddress: deliverToAddress.trim(),
          deliverToContact: deliverToContact.trim(),
          deliveredByName: deliveredByName.trim(),
          remarks: remarks.trim(),
          received,
          receivedByName: receivedByName.trim(),
          receivedAt: received ? deliveryDate : null,
          collect: received && collection.amount ? { amount: collection.amount, method: collect.method, reference: collect.reference.trim() } : null,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) return adminErrorToast(data?.error || 'Unable to save the delivery note.');
      onSaved(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <form onSubmit={save} className="space-y-5">
          <DialogHeader>
            <DialogTitle>New delivery note · {invoice.invoiceNumber}</DialogTitle>
            <DialogDescription>
              {invoice.billToName} · {fulfilment ? `${fulfilment.delivered} of ${fulfilment.ordered} copies delivered so far` : 'nothing delivered yet'}. Enter how many copies go out on this delivery.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-2 py-1.5 font-medium">Book title</th>
                  <th className="px-2 py-1.5 text-right font-medium">Ordered</th>
                  <th className="px-2 py-1.5 text-right font-medium">Delivered before</th>
                  <th className="px-2 py-1.5 text-right font-medium">Still to deliver</th>
                  <th className="w-28 px-2 py-1.5 font-medium">This delivery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {lineState.map((line, index) => (
                  <tr key={line.line} className={line.remaining === 0 ? 'text-muted-foreground' : ''}>
                    <td className="px-2 py-1.5 font-medium">{line.title}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{line.ordered}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{line.delivered}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{line.remaining}</td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        min={0}
                        max={line.remaining}
                        value={quantities[index]}
                        disabled={line.remaining === 0}
                        onChange={(event) => {
                          const next = Math.min(line.remaining, Math.max(0, Math.floor(Number(event.target.value) || 0)));
                          setQuantities((current) => current.map((quantity, position) => (position === index ? next : quantity)));
                        }}
                        className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                        aria-label={`Copies of ${line.title} on this delivery`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">{copies}</strong> {copies === 1 ? 'copy' : 'copies'} worth {money(value)} at the invoice prices.{' '}
            {stockNow > 0 ? <>{stockNow} {stockNow === 1 ? 'copy leaves' : 'copies leave'} stock now.</> : invoice.saleReference ? 'The paid invoice already took these copies out of stock.' : null}
          </p>

          <section className="grid gap-3 sm:grid-cols-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#087989] sm:col-span-2">Deliver to</p>
            <label className={`${labelClass} sm:col-span-2`}>Name / Organisation
              <input value={deliverToName} onChange={(event) => setDeliverToName(event.target.value)} maxLength={191} required className={inputClass} />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>Address
              <input value={deliverToAddress} onChange={(event) => setDeliverToAddress(event.target.value)} maxLength={500} className={inputClass} />
            </label>
            <label className={labelClass}>Contact
              <input value={deliverToContact} onChange={(event) => setDeliverToContact(event.target.value)} maxLength={80} className={inputClass} />
            </label>
            <label className={labelClass}>Delivery date
              <input type="date" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} required className={inputClass} />
            </label>
            <label className={labelClass}>Delivered by
              <input value={deliveredByName} onChange={(event) => setDeliveredByName(event.target.value)} maxLength={191} placeholder="Driver or staff name (you, if empty)" className={inputClass} />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>Delivery remarks
              <textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={2} maxLength={2000} placeholder="Number of boxes, vehicle, anything short or damaged" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
            </label>
          </section>

          <section className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={received} onChange={(event) => setReceived(event.target.checked)} />
              Handed over now: the customer has received and signed for the books
            </label>
            {received ? (
              <>
                <label className={labelClass}>Received by
                  <input value={receivedByName} onChange={(event) => setReceivedByName(event.target.value)} maxLength={191} required placeholder="Name of the person who signed" className={inputClass} />
                </label>
                {invoice.balanceDue > 0 ? <CollectFields collect={collect} onChange={setCollect} balance={invoice.balanceDue} /> : <p className="text-xs text-muted-foreground">The invoice is fully paid, so there is nothing to collect.</p>}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Leave this off when the books are only leaving now; confirm the delivery (and any money taken) when the signed note comes back.</p>
            )}
          </section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
            <Button type="submit" disabled={saving || copies === 0}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />} Save delivery note · {copies} {copies === 1 ? 'copy' : 'copies'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** The signed note came back: record who received it, and any money they handed over. */
export function ConfirmDeliveryDialog({
  note,
  balanceDue,
  headers,
  onClose,
  onSaved,
}: {
  note: DeliveryNote;
  /** The invoice balance, so the collected amount can be checked; null while it loads. */
  balanceDue: number | null;
  headers: () => Record<string, string>;
  onClose: () => void;
  onSaved: (result: DeliverySaved) => void;
}) {
  const signing = note.status === 'dispatched';
  const [receivedByName, setReceivedByName] = useState('');
  const [receivedAt, setReceivedAt] = useState(todayInput());
  const [remarks, setRemarks] = useState(note.remarks || '');
  const [collect, setCollect] = useState<CollectState>({ amount: '', method: 'Cash', reference: '' });
  const [saving, setSaving] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (signing && !receivedByName.trim()) return adminErrorToast('Enter the name of the person who received the books.');
    const collection = readCollection(collect, balanceDue ?? 0);
    if (collection.error) return adminErrorToast(collection.error);
    if (!signing && !collection.amount) return adminErrorToast('Enter the amount collected.');
    setSaving(true);
    try {
      const response = await apiFetch(`/api/admin/store/delivery-notes/${encodeURIComponent(note.id)}/confirm`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          receivedByName: receivedByName.trim(),
          receivedAt,
          remarks: remarks.trim(),
          collect: collection.amount ? { amount: collection.amount, method: collect.method, reference: collect.reference.trim() } : null,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) return adminErrorToast(data?.error || 'Unable to confirm this delivery.');
      onSaved(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={save} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{signing ? 'Confirm delivery' : 'Record money collected'} · {note.deliveryNoteNumber}</DialogTitle>
            <DialogDescription>{note.deliverToName} · {note.totalCopies} copies · invoice {note.invoiceNumber}</DialogDescription>
          </DialogHeader>
          {signing ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>Received by
                <input value={receivedByName} onChange={(event) => setReceivedByName(event.target.value)} maxLength={191} required autoFocus placeholder="Name on the signed note" className={inputClass} />
              </label>
              <label className={labelClass}>Date received
                <input type="date" value={receivedAt} onChange={(event) => setReceivedAt(event.target.value)} required className={inputClass} />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>Delivery remarks
                <textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={2} maxLength={2000} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
              </label>
            </div>
          ) : null}
          {balanceDue === null ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading the invoice balance…</p>
          ) : balanceDue > 0 ? (
            <CollectFields collect={collect} onChange={setCollect} balance={balanceDue} />
          ) : (
            <p className="text-xs text-muted-foreground">The invoice is fully paid, so there is nothing to collect.</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
            <Button type="submit" disabled={saving || balanceDue === null}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {signing ? 'Confirm delivered' : 'Record money'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const NOTE_TONES = { dispatched: 'amber', delivered: 'green', cancelled: 'red' } as const;

export const DeliveryStatusPill = ({ note }: { note: DeliveryNote }) => <Pill tone={NOTE_TONES[note.status]}>{DELIVERY_STATUS_LABEL[note.status]}</Pill>;

/** A delivery note as it prints, with print and download. */
export function DeliveryNoteViewDialog({ note, onClose, actions }: { note: DeliveryNote | null; onClose: () => void; actions?: ReactNode }) {
  const [downloading, setDownloading] = useState(false);
  const render = useMemo(() => (note ? (origin: string) => deliveryNoteHtml(note, origin) : null), [note]);
  const download = async () => {
    if (!note) return;
    setDownloading(true);
    try {
      await downloadDeliveryNotePdf(note);
    } catch {
      adminErrorToast('Could not make the PDF. Use Print and choose Save as PDF instead.');
    } finally {
      setDownloading(false);
    }
  };
  return (
    <Dialog open={Boolean(note)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        {note && render ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">{note.deliveryNoteNumber} <DeliveryStatusPill note={note} /></DialogTitle>
              <DialogDescription>
                {note.deliverToName} · {invoiceDate(note.deliveryDate)} · {note.totalCopies} copies · invoice {note.invoiceNumber}
                {note.amountCollected > 0 ? ` · ${money(note.amountCollected)} collected` : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => printDeliveryNote(note)}><Printer className="h-3.5 w-3.5" /> Print</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => void download()} disabled={downloading}>
                {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} PDF
              </Button>
              {actions}
            </div>
            <DocumentPreview render={render} title={`Delivery note ${note.deliveryNoteNumber}`} />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
