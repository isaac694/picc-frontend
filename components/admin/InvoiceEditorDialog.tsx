'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Camera, FilePlus2, FileText, Loader2, Plus, Search, Trash2, Truck } from 'lucide-react';
import BookCameraScanner from '@/components/store/BookCameraScanner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { adminErrorToast } from '@/components/admin/admin-toast';
import { CollectFields, readCollection, type CollectState, type DeliverySaved } from '@/components/admin/store-docs/DeliveryNoteDialogs';
import { todayInput } from '@/components/admin/store-docs/bits';
import { apiFetch } from '@/lib/api';
import { codeFromScan } from '@/lib/book-labels';
import { money } from '@/lib/store-receipt';
import { invoiceDate, invoiceTotals, type AdminInvoice } from '@/lib/store-invoice';
import type { AdminQuotation } from '@/lib/store-documents';
import { cn } from '@/lib/utils';

type FoundBook = { productId: string; barcode: string | null; title: string; author?: string | null; price: number };
type EditorLine = { key: string; productId: string | null; title: string; isbnEdition: string; quantity: number; unitPrice: number };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputClass = 'h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm text-foreground';
const labelClass = 'block text-xs font-medium text-muted-foreground';
let keySeed = 0;
const nextKey = () => `line-${(keySeed += 1)}`;
const dateInput = (value?: string | null) => (value ? new Date(value).toISOString().slice(0, 10) : '');
const inDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

export type InvoiceDefaults = { paymentInstructions: string | null; termsDays: number; quotationTerms?: string | null; quotationValidDays?: number };

/** The fields the editor reads from an invoice or a quotation. */
export type EditableDocument = Pick<AdminInvoice, 'id' | 'billToName' | 'billToAddress' | 'billToContact' | 'billToEmail' | 'items' | 'discount' | 'delivery' | 'customerReference'> & {
  status: string;
  invoiceNumber?: string | null;
  quotationNumber?: string;
  orderReference?: string | null;
  amountPaid?: number;
  dueDate?: string | null;
  validUntil?: string | null;
  paymentInstructions?: string | null;
  terms?: string | null;
};

/**
 * Creates or edits a counter invoice or quotation, or writes a new delivery note. Books come from scanning
 * a label, typing a barcode or searching by title; staff can also type a free line, and set their own
 * prices, discount and delivery. A delivery note written here raises its invoice at the same time, so
 * what the customer owes is always on an invoice; the "From an invoice" tab delivers one that exists.
 * Mount it fresh (with a new `key`) each time it opens; it starts from `invoice`, or a blank document.
 */
export default function InvoiceEditorDialog<Saved = AdminInvoice | AdminQuotation | DeliverySaved>({
  kind = 'invoice',
  invoice,
  defaults,
  headers,
  onClose,
  onSaved,
  onPickInvoice,
}: {
  kind?: 'invoice' | 'quotation' | 'delivery';
  invoice: EditableDocument | null;
  defaults: InvoiceDefaults | null;
  headers: () => Record<string, string>;
  onClose: () => void;
  onSaved: (document: Saved, emailedTo: string | null) => void;
  /** Delivery notes only: deliver an existing invoice instead. */
  onPickInvoice?: (invoice: AdminInvoice) => void;
}) {
  const editing = Boolean(invoice);
  const isQuote = kind === 'quotation';
  const isDelivery = kind === 'delivery';
  const [mode, setMode] = useState<'new' | 'invoice'>('new');
  const [deliveryDate, setDeliveryDate] = useState(todayInput());
  const [deliveredByName, setDeliveredByName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [received, setReceived] = useState(false);
  const [receivedByName, setReceivedByName] = useState('');
  const [collect, setCollect] = useState<CollectState>({ amount: '', method: 'Cash', reference: '' });
  const number = invoice?.invoiceNumber || invoice?.quotationNumber || '';
  const [lines, setLines] = useState<EditorLine[]>(() =>
    (invoice?.items || []).map((line) => ({ key: nextKey(), productId: line.productId || null, title: line.title, isbnEdition: line.isbnEdition || '', quantity: line.quantity, unitPrice: line.unitPrice })),
  );
  const [code, setCode] = useState('');
  const [found, setFound] = useState<{ query: string; books: FoundBook[] }>({ query: '', books: [] });
  const [lookupError, setLookupError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [billToName, setBillToName] = useState(invoice?.billToName || '');
  const [billToAddress, setBillToAddress] = useState(invoice?.billToAddress || '');
  const [billToContact, setBillToContact] = useState(invoice?.billToContact || '');
  const [billToEmail, setBillToEmail] = useState(invoice?.billToEmail || '');
  const [discount, setDiscount] = useState(invoice?.discount ? String(invoice.discount) : '');
  const [delivery, setDelivery] = useState(invoice?.delivery ? String(invoice.delivery) : '');
  // An invoice's due date, or how long a quotation's prices hold.
  const [dueDate, setDueDate] = useState(() => (invoice
    ? dateInput(isQuote ? invoice.validUntil : invoice.dueDate)
    : inDays(isQuote ? defaults?.quotationValidDays ?? 30 : defaults?.termsDays ?? 14)));
  // Payment instructions on an invoice, quotation terms on a quotation.
  const [paymentInstructions, setPaymentInstructions] = useState(
    (isQuote ? invoice?.terms ?? defaults?.quotationTerms : invoice?.paymentInstructions || defaults?.paymentInstructions) || '',
  );
  const [sendEmail, setSendEmail] = useState(true);
  const [saving, setSaving] = useState(false);

  // A title search is only worth running for two or more characters that are not a barcode.
  const query = code.trim();
  const searchable = query.length >= 2 && !/^HB\d{4,}$/i.test(query);
  // Results belong to the text they were found for, so stale ones never show for newer typing.
  const matches = found.query === query ? found.books : [];
  const setMatches = (books: FoundBook[]) => setFound({ query, books });

  // Title search as staff type; a scanned or typed barcode is looked up on Enter.
  useEffect(() => {
    if (!searchable) return;
    let alive = true;
    const timer = window.setTimeout(async () => {
      const response = await apiFetch(`/api/store/scan-search?q=${encodeURIComponent(query)}`);
      const data = await response.json().catch(() => null);
      if (alive) setFound({ query, books: Array.isArray(data?.books) ? data.books : [] });
    }, 250);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [query, searchable]);

  const addBook = (book: FoundBook) => {
    setLines((current) => {
      const existing = current.find((line) => line.productId === book.productId);
      if (existing) return current.map((line) => (line === existing ? { ...line, quantity: line.quantity + 1 } : line));
      return [...current, { key: nextKey(), productId: book.productId, title: book.title, isbnEdition: '', quantity: 1, unitPrice: book.price }];
    });
    // Clearing the text also hides the results, since they belong to the old text.
    setCode('');
    setLookupError('');
  };

  const lookUp = async (value: string) => {
    const cleaned = codeFromScan(value);
    if (!cleaned) return;
    setLookupError('');
    const response = await apiFetch(`/api/store/scan/${encodeURIComponent(cleaned)}`);
    const data = await response.json().catch(() => null);
    if (response.ok && data?.book) return addBook(data.book);
    if (response.status === 409 && Array.isArray(data?.books)) return setMatches(data.books);
    setLookupError(data?.error || 'No book matches that code.');
  };

  const addFreeLine = () => setLines((current) => [...current, { key: nextKey(), productId: null, title: '', isbnEdition: '', quantity: 1, unitPrice: 0 }]);
  const updateLine = (key: string, patch: Partial<EditorLine>) => setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  const removeLine = (key: string) => setLines((current) => current.filter((line) => line.key !== key));

  const totals = useMemo(
    () => invoiceTotals({ items: lines, discount: Number(discount) || 0, delivery: Number(delivery) || 0, amountPaid: invoice?.amountPaid || 0 }),
    [lines, discount, delivery, invoice?.amountPaid],
  );

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (lines.length === 0) return adminErrorToast('Add at least one book.');
    if (lines.some((line) => !line.title.trim())) return adminErrorToast('Give every line a title.');
    if (!billToName.trim()) return adminErrorToast('Enter the name or organisation to bill.');
    if (billToEmail.trim() && !EMAIL_PATTERN.test(billToEmail.trim())) return adminErrorToast('Enter a valid email address, or leave it empty.');
    if ((Number(discount) || 0) > totals.subtotal) return adminErrorToast(`The discount cannot be more than the subtotal (${money(totals.subtotal)}).`);
    if (invoice?.amountPaid && invoice.amountPaid > totals.total) return adminErrorToast(`The customer has already paid ${money(invoice.amountPaid)}, more than this total.`);
    if (isDelivery) return saveDelivery();
    setSaving(true);
    try {
      const path = isQuote ? '/api/admin/store/quotations' : '/api/admin/store/invoices';
      const response = await apiFetch(editing ? `${path}/${encodeURIComponent(invoice!.id)}` : path, {
        method: editing ? 'PUT' : 'POST',
        headers: headers(),
        body: JSON.stringify({
          billToName: billToName.trim(),
          billToAddress: billToAddress.trim(),
          billToContact: billToContact.trim(),
          billToEmail: billToEmail.trim(),
          discount: Number(discount) || 0,
          delivery: Number(delivery) || 0,
          ...(isQuote ? { validUntil: dueDate || null, terms: paymentInstructions.trim() } : { dueDate: dueDate || null, paymentInstructions: paymentInstructions.trim() }),
          sendEmail: !editing && sendEmail && Boolean(billToEmail.trim()),
          items: lines.map((line) => ({
            ...(line.productId ? { productId: line.productId } : { title: line.title.trim() }),
            isbnEdition: line.isbnEdition.trim(),
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) return adminErrorToast(data?.error || `Unable to save this ${kind}.`);
      onSaved(isQuote ? data.quotation : data.invoice, data.emailedTo || null);
    } finally {
      setSaving(false);
    }
  };

  const copies = lines.reduce((sum, line) => sum + line.quantity, 0);

  /** Writes the delivery note and the invoice raised with it, in one request. */
  const saveDelivery = async () => {
    if (!deliveryDate) return adminErrorToast('Enter the delivery date.');
    if (received && !receivedByName.trim()) return adminErrorToast('Enter the name of the person who received the books.');
    const collection = received ? readCollection(collect, totals.total) : { amount: 0 };
    if (collection.error) return adminErrorToast(collection.error);
    setSaving(true);
    try {
      const response = await apiFetch('/api/admin/store/delivery-notes', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          deliverToName: billToName.trim(),
          deliverToAddress: billToAddress.trim(),
          deliverToContact: billToContact.trim(),
          billToEmail: billToEmail.trim(),
          discount: Number(discount) || 0,
          delivery: Number(delivery) || 0,
          dueDate: dueDate || null,
          paymentInstructions: paymentInstructions.trim(),
          items: lines.map((line) => ({
            ...(line.productId ? { productId: line.productId } : { title: line.title.trim() }),
            isbnEdition: line.isbnEdition.trim(),
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
          deliveryDate,
          deliveredByName: deliveredByName.trim(),
          remarks: remarks.trim(),
          received,
          receivedByName: receivedByName.trim(),
          receivedAt: received ? deliveryDate : null,
          collect: collection.amount ? { amount: collection.amount, method: collect.method, reference: collect.reference.trim() } : null,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) return adminErrorToast(data?.error || 'Unable to save the delivery note.');
      onSaved(data as Saved, null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <form onSubmit={save} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${number}` : isDelivery ? 'New delivery note' : isQuote ? 'New quotation' : 'New invoice'}</DialogTitle>
            <DialogDescription>
              {isDelivery
                ? mode === 'new'
                  ? 'Scan or search the books going out. Their invoice is raised with the delivery note, the copies leave stock now, and any cash handed over is recorded on that invoice.'
                  : 'Choose an invoice to send its books out. Only invoices with copies still to deliver are listed.'
                : isQuote
                  ? 'Scan or search books to add them. A quotation holds no stock; turn it into an invoice when the customer accepts.'
                  : editing && invoice!.status === 'requested'
                    ? 'Check the books and prices, add any discount or delivery, then save and issue it.'
                    : 'Scan or search books to add them. Copies leave stock when they are delivered or when the invoice is fully paid, whichever comes first.'}
            </DialogDescription>
          </DialogHeader>

          {isDelivery ? (
            <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/40 p-1" role="tablist" aria-label="How to make the delivery note">
              {([['new', 'New delivery', FilePlus2], ['invoice', 'From an invoice', FileText]] as const).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  onClick={() => setMode(value)}
                  className={cn('flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium', mode === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          ) : null}

          {isDelivery && mode === 'invoice' ? (
            <InvoicePicker headers={headers} onPick={(picked) => onPickInvoice?.(picked)} />
          ) : (<>
          <section className="space-y-2">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      if (matches.length === 1) addBook(matches[0]);
                      else void lookUp(code);
                    }
                  }}
                  placeholder="Scan a barcode, or type a title"
                  className={`${inputClass} pl-8 font-mono`}
                  aria-label="Book barcode or title"
                  autoFocus={!editing}
                />
                {matches.length ? (
                  <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
                    {matches.map((book) => (
                      <li key={book.productId}>
                        <button type="button" onClick={() => addBook(book)} className="flex w-full justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted">
                          <span className="truncate">{book.title}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{money(book.price)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => setScanning((value) => !value)} aria-label="Scan with camera"><Camera className="h-4 w-4" /></Button>
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={addFreeLine}><Plus className="h-4 w-4" /> Line</Button>
            </div>
            {scanning ? (
              <BookCameraScanner
                onClose={() => setScanning(false)}
                onCode={(value) => {
                  setScanning(false);
                  void lookUp(value);
                }}
              />
            ) : null}
            {lookupError ? <p className="text-xs text-destructive">{lookupError}</p> : null}

            {lines.length ? (
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full min-w-[620px] text-sm">
                  <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-2 py-1.5 font-medium">Book title</th>
                      <th className="px-2 py-1.5 font-medium">ISBN / Edition</th>
                      <th className="w-20 px-2 py-1.5 font-medium">Qty</th>
                      <th className="w-28 px-2 py-1.5 font-medium">Unit price</th>
                      <th className="w-28 px-2 py-1.5 text-right font-medium">Amount</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {lines.map((line) => (
                      <tr key={line.key}>
                        <td className="px-2 py-1.5">
                          {line.productId ? (
                            <span className="font-medium">{line.title}</span>
                          ) : (
                            <input value={line.title} onChange={(event) => updateLine(line.key, { title: event.target.value })} placeholder="Title" maxLength={191} className={inputClass} aria-label="Line title" />
                          )}
                        </td>
                        <td className="px-2 py-1.5">
                          <input value={line.isbnEdition} onChange={(event) => updateLine(line.key, { isbnEdition: event.target.value })} placeholder="Optional" maxLength={120} className={inputClass} aria-label={`ISBN or edition for ${line.title || 'line'}`} />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min={1} max={5000} value={line.quantity} onChange={(event) => updateLine(line.key, { quantity: Math.min(5000, Math.max(1, Number(event.target.value) || 1)) })} className={inputClass} aria-label={`Quantity of ${line.title || 'line'}`} />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min={0} step="any" value={line.unitPrice} onChange={(event) => updateLine(line.key, { unitPrice: Math.max(0, Number(event.target.value) || 0) })} className={inputClass} aria-label={`Unit price of ${line.title || 'line'}`} />
                        </td>
                        <td className="whitespace-nowrap px-2 py-1.5 text-right font-medium tabular-nums">{money(line.quantity * line.unitPrice)}</td>
                        <td className="px-1 py-1.5">
                          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeLine(line.key)} aria-label={`Remove ${line.title || 'line'}`}><Trash2 className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">No books yet. Scan a label, search a title, or add a free line.</p>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#087989] sm:col-span-2">{isDelivery ? 'Deliver to (and bill to)' : isQuote ? 'Quotation for' : 'Bill to'}</p>
            <label className={`${labelClass} sm:col-span-2`}>Name / Organisation *
              <input value={billToName} onChange={(event) => setBillToName(event.target.value)} maxLength={191} className={`${inputClass} mt-1`} required />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>Address
              <input value={billToAddress} onChange={(event) => setBillToAddress(event.target.value)} maxLength={500} className={`${inputClass} mt-1`} />
            </label>
            <label className={labelClass}>Contact (phone)
              <input value={billToContact} onChange={(event) => setBillToContact(event.target.value)} maxLength={80} type="tel" className={`${inputClass} mt-1`} />
            </label>
            <label className={labelClass}>Email
              <input value={billToEmail} onChange={(event) => setBillToEmail(event.target.value)} maxLength={191} type="email" className={`${inputClass} mt-1`} />
            </label>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              {invoice
                ? <>Customer reference <span className="font-mono text-foreground">{invoice.customerReference || '—'}</span>{isQuote ? null : <> · Order ref. <span className="font-mono text-foreground">{invoice.orderReference || '—'}</span></>}</>
                : `The references are generated when the ${isDelivery ? 'delivery note' : kind} is saved. A returning customer (same email or phone) keeps their customer reference.`}
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_240px]">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className={labelClass}>Discount (MWK)
                <input type="number" min={0} step="any" value={discount} onChange={(event) => setDiscount(event.target.value)} className={`${inputClass} mt-1`} />
              </label>
              <label className={labelClass}>Delivery (MWK)
                <input type="number" min={0} step="any" value={delivery} onChange={(event) => setDelivery(event.target.value)} className={`${inputClass} mt-1`} />
              </label>
              <label className={labelClass}>{isQuote ? 'Valid until' : 'Due date'}
                <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={`${inputClass} mt-1`} />
              </label>
              <label className={`${labelClass} sm:col-span-3`}>{isQuote ? 'Quotation terms' : 'Payment instructions'}
                <textarea
                  value={paymentInstructions}
                  onChange={(event) => setPaymentInstructions(event.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder={isQuote ? 'How long prices hold, availability, delivery and how to accept' : 'Bank name, account name and number, mobile money number, and what to quote as the reference'}
                  className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-2 text-sm text-foreground"
                />
                <span className="mt-1 block text-[11px]">{isDelivery ? 'Printed on the invoice raised with this delivery.' : `The next ${kind} starts with what you enter here.`}</span>
              </label>
            </div>
            <dl className="h-fit space-y-1.5 rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{money(totals.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd className="tabular-nums">− {money(totals.discount)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className="tabular-nums">{money(totals.delivery)}</dd></div>
              <div className="flex justify-between border-t border-border pt-1.5 font-semibold"><dt>{isQuote ? 'Total quoted' : 'Invoice total'}</dt><dd className="tabular-nums">{money(totals.total)}</dd></div>
              {invoice?.amountPaid ? (
                <div className="flex justify-between text-muted-foreground"><dt>Already paid</dt><dd className="tabular-nums">{money(invoice.amountPaid)}</dd></div>
              ) : null}
            </dl>
          </section>

          {isDelivery ? (
            <section className="grid gap-3 rounded-lg border border-border/60 p-3 sm:grid-cols-2">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#087989] sm:col-span-2"><Truck className="h-4 w-4" /> Delivery</p>
              <label className={labelClass}>Delivery date *
                <input type="date" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} required className={`${inputClass} mt-1`} />
              </label>
              <label className={labelClass}>Delivered by
                <input value={deliveredByName} onChange={(event) => setDeliveredByName(event.target.value)} maxLength={191} placeholder="Driver or staff name (you, if empty)" className={`${inputClass} mt-1`} />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>Delivery remarks
                <textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={2} maxLength={2000} placeholder="Number of boxes, vehicle, anything short or damaged" className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-2 text-sm text-foreground" />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
                <input type="checkbox" checked={received} onChange={(event) => setReceived(event.target.checked)} />
                Handed over now: the customer has received and signed for the books
              </label>
              {received ? (
                <div className="space-y-3 sm:col-span-2">
                  <label className={labelClass}>Received by *
                    <input value={receivedByName} onChange={(event) => setReceivedByName(event.target.value)} maxLength={191} required placeholder="Name of the person who signed" className={`${inputClass} mt-1`} />
                  </label>
                  <CollectFields collect={collect} onChange={setCollect} balance={totals.total} />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground sm:col-span-2">Leave this off when the books are only leaving now; confirm the delivery (and any money taken) when the signed note comes back.</p>
              )}
            </section>
          ) : null}
          </>)}

          <DialogFooter className="items-center gap-3 sm:justify-between">
            {isDelivery ? <span /> : !editing ? (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sendEmail && Boolean(billToEmail.trim())} onChange={(event) => setSendEmail(event.target.checked)} disabled={!billToEmail.trim()} />
                Email it to the customer
              </label>
            ) : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Close</Button>
              {isDelivery && mode === 'invoice' ? null : (
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isDelivery ? <Truck className="h-4 w-4" /> : null}
                  {editing
                    ? 'Save changes'
                    : isDelivery
                      ? `Save delivery note · ${copies} ${copies === 1 ? 'copy' : 'copies'} · ${money(totals.total)}`
                      : `${isQuote ? 'Save quotation' : 'Issue invoice'} · ${money(totals.total)}`}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Invoices with books still to go out, newest first, to deliver from. */
function InvoicePicker({ headers, onPick }: { headers: () => Record<string, string>; onPick: (invoice: AdminInvoice) => void }) {
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<{ query: string; invoices: AdminInvoice[] } | null>(null);
  const query = search.trim();

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(async () => {
      const response = await apiFetch(`/api/admin/store/invoices${query ? `?q=${encodeURIComponent(query)}` : ''}`, { headers: headers(), cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!alive) return;
      const all: AdminInvoice[] = response.ok && Array.isArray(data?.invoices) ? data.invoices : [];
      const toDeliver = all.filter((entry) => !['cancelled', 'requested'].includes(entry.status) && (entry.fulfilment ? entry.fulfilment.remaining > 0 : true));
      setResult({ query, invoices: toDeliver });
    }, query ? 250 : 0);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [query, headers]);

  const invoices = result?.invoices || [];
  return (
    <section className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Invoice number, customer or book" className={`${inputClass} pl-8`} aria-label="Find an invoice" autoFocus />
      </div>
      <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-border/60">
        {!result ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground"><Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" /> Loading invoices…</p>
        ) : invoices.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">No invoice with books still to deliver{query ? ' matches that search' : ''}. Use New delivery to write one from scratch.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {invoices.map((entry) => (
              <li key={entry.id}>
                <button type="button" onClick={() => onPick(entry)} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted" aria-label={`Deliver ${entry.invoiceNumber}`}>
                  <span className="min-w-0">
                    <span className="font-mono text-xs font-semibold text-primary">{entry.invoiceNumber}</span>
                    <span className="ml-2 font-medium">{entry.billToName}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{invoiceDate(entry.issueDate || entry.createdAt)} · {entry.items.map((line) => `${line.title} ×${line.quantity}`).join(', ')}</span>
                  </span>
                  <span className="shrink-0 text-right text-[11px] text-muted-foreground">
                    <span className="block font-medium text-foreground">{entry.fulfilment ? `${entry.fulfilment.remaining} of ${entry.fulfilment.ordered}` : '—'} to deliver</span>
                    {entry.balanceDue > 0 ? `${money(entry.balanceDue)} owed` : 'Paid'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
