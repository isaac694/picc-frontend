'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Loader2, PackagePlus, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { adminErrorToast } from '@/components/admin/admin-toast';
import { inputClass, labelClass, SumRows } from '@/components/admin/store-docs/bits';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';
import { money, receiptDate } from '@/lib/store-receipt';
import type { InventoryBook, StockMovement, StockReceipt } from '@/lib/book-inventory';
import { cn } from '@/lib/utils';

type ReceiveLine = { key: string; productId: string; title: string; quantity: string; unitCost: string };
let seed = 0;
const nextKey = () => `r-${(seed += 1)}`;

/** Copies arriving from the printer or a supplier, several books on one receipt. */
export function ReceiveStockDialog({
  books,
  start,
  headers,
  onClose,
  onSaved,
}: {
  books: InventoryBook[];
  /** Books to start with, e.g. everything on the reorder list. */
  start: Array<{ book: InventoryBook; quantity?: number }>;
  headers: () => Record<string, string>;
  onClose: () => void;
  onSaved: (receipt: StockReceipt) => void;
}) {
  const [lines, setLines] = useState<ReceiveLine[]>(() => start.map(({ book, quantity }) => ({
    key: nextKey(), productId: book.productId, title: book.title, quantity: quantity ? String(quantity) : '', unitCost: book.averageCost === null ? '' : String(book.averageCost),
  })));
  const [search, setSearch] = useState('');
  const [supplier, setSupplier] = useState('');
  const [supplierReference, setSupplierReference] = useState('');
  // Now, in the browser's own time, as a datetime-local value.
  const [opened] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [receivedAt, setReceivedAt] = useState(opened);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return books.filter((book) => !lines.some((line) => line.productId === book.productId))
      .filter((book) => `${book.title} ${book.author || ''} ${book.barcode || ''}`.toLowerCase().includes(query)).slice(0, 8);
  }, [books, lines, search]);

  const add = (book: InventoryBook) => {
    setLines((current) => [...current, { key: nextKey(), productId: book.productId, title: book.title, quantity: '', unitCost: book.averageCost === null ? '' : String(book.averageCost) }]);
    setSearch('');
  };
  const update = (key: string, patch: Partial<ReceiveLine>) => setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  const copies = lines.reduce((sum, line) => sum + (Math.floor(Number(line.quantity)) || 0), 0);
  const cost = lines.reduce((sum, line) => sum + (Math.floor(Number(line.quantity)) || 0) * (Number(line.unitCost) || 0), 0);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!lines.length) return adminErrorToast('Add at least one book.');
    if (lines.some((line) => !Number.isInteger(Number(line.quantity)) || Number(line.quantity) < 1)) return adminErrorToast('Enter the number of copies received for each book.');
    setSaving(true);
    try {
      const response = await apiFetch('/api/admin/store/inventory/receipts', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          supplier: supplier.trim(), supplierReference: supplierReference.trim(), receivedAt: receivedAt ? new Date(receivedAt).toISOString() : null, note: note.trim(),
          lines: lines.map((line) => ({ productId: line.productId, quantity: Number(line.quantity), unitCost: line.unitCost.trim() === '' ? null : Number(line.unitCost) })),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) return adminErrorToast(data?.error || 'Unable to save the restock.');
      onSaved(data.receipt);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <form onSubmit={save} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Receive stock</DialogTitle>
            <DialogDescription>Copies delivered by the printer or a supplier. The cost per copy is optional; it is used to value the stock.</DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Add a book: title, author or barcode" className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm" aria-label="Find a book to add" />
            {matches.length ? (
              <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
                {matches.map((book) => (
                  <li key={book.productId}>
                    <button type="button" onClick={() => add(book)} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted">
                      <span className="truncate">{book.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{book.stock} in stock</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {lines.length ? (
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr><th className="px-2 py-1.5 font-medium">Book</th><th className="w-28 px-2 py-1.5 font-medium">Copies</th><th className="w-36 px-2 py-1.5 font-medium">Cost / copy</th><th className="w-28 px-2 py-1.5 text-right font-medium">Cost</th><th className="w-8" /></tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {lines.map((line) => (
                    <tr key={line.key}>
                      <td className="px-2 py-1.5 font-medium">{line.title}</td>
                      <td className="px-2 py-1.5"><input type="number" min={1} step={1} value={line.quantity} onChange={(event) => update(line.key, { quantity: event.target.value })} className="h-9 w-full rounded-md border border-border bg-background px-2" aria-label={`Copies of ${line.title} received`} required /></td>
                      <td className="px-2 py-1.5"><input type="number" min={0} step="any" value={line.unitCost} onChange={(event) => update(line.key, { unitCost: event.target.value })} placeholder="Optional" className="h-9 w-full rounded-md border border-border bg-background px-2" aria-label={`Cost per copy of ${line.title}`} /></td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">{line.unitCost.trim() ? money((Number(line.quantity) || 0) * (Number(line.unitCost) || 0)) : '—'}</td>
                      <td className="px-1"><Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setLines((current) => current.filter((entry) => entry.key !== line.key))} aria-label={`Remove ${line.title}`}><Trash2 className="h-4 w-4" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">Search above to add the books that arrived.</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>Supplier / printer
              <input value={supplier} onChange={(event) => setSupplier(event.target.value)} maxLength={191} placeholder="e.g. Lilongwe Press" className={inputClass} />
            </label>
            <label className={labelClass}>Their invoice or delivery note no.
              <input value={supplierReference} onChange={(event) => setSupplierReference(event.target.value)} maxLength={120} className={inputClass} />
            </label>
            <label className={labelClass}>Date &amp; time received
              <input type="datetime-local" value={receivedAt} max={opened} onChange={(event) => setReceivedAt(event.target.value)} required className={inputClass} />
            </label>
            <label className={labelClass}>Note
              <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} placeholder="Boxes, condition, anything short" className={inputClass} />
            </label>
          </div>

          <SumRows rows={[['Copies received', copies], ['Total cost', money(cost), 'strong']]} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
            <Button type="submit" disabled={saving || !lines.length}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />} Add {copies} {copies === 1 ? 'copy' : 'copies'} to stock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Damaged, lost or returned copies, or a shelf count that sets the stock to what is really there. */
export function AdjustStockDialog({
  book,
  reasons,
  headers,
  onClose,
  onSaved,
}: {
  book: InventoryBook;
  reasons: string[];
  headers: () => Record<string, string>;
  onClose: () => void;
  onSaved: (stock: number, change: number) => void;
}) {
  const [mode, setMode] = useState<'count' | 'change'>('count');
  const [counted, setCounted] = useState(String(book.stock));
  const [direction, setDirection] = useState<'remove' | 'add'>('remove');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState(reasons[0] || 'stock count');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const change = mode === 'count' ? (Number.isInteger(Number(counted)) ? Number(counted) - book.stock : 0) : (direction === 'remove' ? -1 : 1) * (Math.floor(Number(amount)) || 0);
  const after = book.stock + change;

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (change === 0) return adminErrorToast(mode === 'count' ? 'The count matches the system; nothing to change.' : 'Enter how many copies.');
    if (after < 0) return adminErrorToast(`Only ${book.stock} copies are in stock.`);
    setSaving(true);
    try {
      const response = await apiFetch('/api/admin/store/inventory/adjustments', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ productId: book.productId, reason: mode === 'count' ? 'stock count' : reason, note: note.trim(), ...(mode === 'count' ? { countedStock: Number(counted) } : { change }) }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) return adminErrorToast(data?.error || 'Unable to adjust the stock.');
      onSaved(data.stock, change);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={save} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Adjust stock</DialogTitle>
            <DialogDescription>{book.title} · {book.stock} in stock now</DialogDescription>
          </DialogHeader>
          <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs font-medium" role="radiogroup" aria-label="Adjustment type">
            {([['count', 'Stock count'], ['change', 'Add or remove']] as const).map(([value, label]) => (
              <button key={value} type="button" role="radio" aria-checked={mode === value} onClick={() => setMode(value)} className={cn('flex-1 rounded-md px-3 py-1.5', mode === value ? 'bg-background shadow-sm' : 'text-muted-foreground')}>{label}</button>
            ))}
          </div>
          {mode === 'count' ? (
            <label className={labelClass}>Copies counted on the shelf
              <input type="number" min={0} step={1} value={counted} onChange={(event) => setCounted(event.target.value)} required autoFocus className={inputClass} />
            </label>
          ) : (
            <>
              <div className="flex gap-2">
                <select value={direction} onChange={(event) => setDirection(event.target.value as 'remove' | 'add')} className="h-10 rounded-md border border-border bg-background px-2 text-sm" aria-label="Add or remove">
                  <option value="remove">Remove</option>
                  <option value="add">Add</option>
                </select>
                <input type="number" min={1} step={1} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Copies" required autoFocus className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm" aria-label="Copies" />
              </div>
              <label className={labelClass}>Reason
                <select value={reason} onChange={(event) => setReason(event.target.value)} className={inputClass}>
                  {reasons.filter((entry) => entry !== 'stock count').map((entry) => <option key={entry} value={entry}>{entry[0].toUpperCase() + entry.slice(1)}</option>)}
                </select>
              </label>
            </>
          )}
          <label className={labelClass}>Note {mode === 'change' && reason === 'other' ? '(required)' : '(optional)'}
            <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} placeholder={mode === 'count' ? 'e.g. end of month count' : 'What happened'} className={inputClass} />
          </label>
          <SumRows rows={[['In stock now', book.stock], ['Change', change > 0 ? `+${change}` : change], ['Stock after', after, 'strong']]} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
            <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <SlidersHorizontal className="h-4 w-4" />} Save adjustment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Every stock change for one book with the balance after each, newest first. */
export function StockCardDialog({ book, headers, onClose, onRestock }: { book: InventoryBook; headers: () => Record<string, string>; onClose: () => void; onRestock: () => void }) {
  const [movements, setMovements] = useState<StockMovement[] | null>(null);
  const [matches, setMatches] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const response = await apiFetch(`/api/admin/store/inventory/books/${encodeURIComponent(book.productId)}/movements`, { headers: headers(), cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!alive) return;
      if (!response.ok) {
        adminErrorToast(data?.error || 'Unable to load the stock card.');
        setMovements([]);
        return;
      }
      setMovements(Array.isArray(data?.movements) ? data.movements : []);
      setMatches(data?.ledgerMatches !== false);
    })();
    return () => {
      alive = false;
    };
  }, [book.productId, headers]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Stock card · {book.title}</DialogTitle>
          <DialogDescription>{book.stock} in stock · {book.committed} promised on invoices · reorder at {book.reorderLevel}{book.averageCost !== null ? ` · average cost ${money(book.averageCost)}` : ''}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end"><Button size="sm" variant="outline" onClick={onRestock}><Plus className="h-4 w-4" /> Receive stock</Button></div>
        {!matches ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-900">The movements below do not add up to the stock figure. Do a stock count to set it right.</p> : null}
        {movements === null ? (
          <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
        ) : movements.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No stock changes recorded yet. Sales, restocks and adjustments appear here from now on.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-2 py-1.5 font-medium">Date</th><th className="px-2 py-1.5 font-medium">What</th><th className="px-2 py-1.5 font-medium">Reference</th><th className="px-2 py-1.5 text-right font-medium">In / out</th><th className="px-2 py-1.5 text-right font-medium">Balance</th></tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="whitespace-nowrap px-2 py-1.5 text-xs text-muted-foreground">{receiptDate(movement.createdAt)}</td>
                    <td className="px-2 py-1.5">
                      <span className="capitalize">{movement.reason}</span>
                      {movement.note || movement.createdBy ? <span className="block text-[11px] text-muted-foreground">{[movement.note, movement.createdBy ? `by ${movement.createdBy}` : null].filter(Boolean).join(' · ')}</span> : null}
                    </td>
                    <td className="px-2 py-1.5 font-mono text-xs">{movement.reference || '—'}</td>
                    <td className={cn('px-2 py-1.5 text-right font-semibold tabular-nums', movement.change > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300')}>{movement.change > 0 ? `+${movement.change}` : movement.change}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{movement.stockAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
