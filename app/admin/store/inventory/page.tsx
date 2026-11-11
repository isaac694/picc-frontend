'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle, Boxes, ClipboardList, Download, FileSpreadsheet, FileText, History, Loader2, PackagePlus, PackageX, Printer, RefreshCw, Search, SlidersHorizontal, Wallet, XCircle,
} from 'lucide-react';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { KpiCard } from '@/components/admin/DashboardBits';
import PeriodFilter from '@/components/admin/PeriodFilter';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';
import { AdjustStockDialog, ReceiveStockDialog, StockCardDialog } from '@/components/admin/inventory/InventoryDialogs';
import { inputClass, labelClass, Pill, type Tone } from '@/components/admin/store-docs/bits';
import { DocumentPreview } from '@/components/store/InvoicePreview';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiFetch } from '@/lib/api';
import { printHtml } from '@/lib/book-labels';
import { downloadReport, periodLabel, periodParams, periodSlug, withParams, type Period } from '@/lib/admin-reports';
import {
  INVENTORY_STATUS_LABEL, receiptHtml, reorderListHtml, type InventoryBook, type InventoryStatus, type InventorySummary, type StockMovement, type StockReceipt,
} from '@/lib/book-inventory';
import { downloadHtmlPdf, documentAmount, invoiceDate } from '@/lib/store-invoice';
import { money, receiptDate } from '@/lib/store-receipt';
import { cn } from '@/lib/utils';

const TONES: Record<InventoryStatus, Tone> = { ok: 'green', low: 'amber', short: 'orange', out: 'red' };
const FILTERS = [
  { value: 'all', label: 'All books' },
  { value: 'reorder', label: 'Needs reorder' },
  { value: 'low', label: 'Low or promised out' },
  { value: 'out', label: 'Out of stock' },
] as const;
type Filter = (typeof FILTERS)[number]['value'];
type Tab = 'stock' | 'restocks' | 'movements';

export default function BookInventoryPage() {
  const { token, email, password, loginError, setEmail, setPassword, handleLogin } = useAdminAuth();
  const [tab, setTab] = useState<Tab>('stock');
  const [period, setPeriod] = useState<Period>({ preset: 'month' });
  const [books, setBooks] = useState<InventoryBook[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [velocityDays, setVelocityDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [receiving, setReceiving] = useState<Array<{ book: InventoryBook; quantity?: number }> | null>(null);
  const [adjusting, setAdjusting] = useState<InventoryBook | null>(null);
  const [card, setCard] = useState<InventoryBook | null>(null);
  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [receiptSummary, setReceiptSummary] = useState<{ count: number; copies: number; cost: number } | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<StockReceipt | null>(null);
  const [cancellingReceipt, setCancellingReceipt] = useState<StockReceipt | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementReason, setMovementReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const headers = useCallback(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }), [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiFetch(withParams('/api/admin/store/inventory', periodParams(period)), { headers: headers(), cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!response.ok) return adminErrorToast(data?.error || 'Unable to load the inventory.');
      setBooks(Array.isArray(data?.books) ? data.books : []);
      setSummary(data?.summary || null);
      setReasons(Array.isArray(data?.reasons) ? data.reasons : []);
      setVelocityDays(data?.velocityDays || 30);
      if (tab === 'restocks') {
        const r = await apiFetch(withParams('/api/admin/store/inventory/receipts', periodParams(period)), { headers: headers(), cache: 'no-store' });
        const d = await r.json().catch(() => null);
        if (r.ok) {
          setReceipts(Array.isArray(d?.receipts) ? d.receipts : []);
          setReceiptSummary(d?.summary || null);
        }
      }
      if (tab === 'movements') {
        const r = await apiFetch(withParams('/api/admin/store/inventory/movements', { ...periodParams(period), reason: movementReason }), { headers: headers(), cache: 'no-store' });
        const d = await r.json().catch(() => null);
        if (r.ok) setMovements(Array.isArray(d?.movements) ? d.movements : []);
      }
    } finally {
      setLoading(false);
    }
  }, [token, period, headers, tab, movementReason]);

  useEffect(() => {
    void load();
  }, [load]);

  const shown = useMemo(() => {
    const query = search.trim().toLowerCase();
    return books
      .filter((book) => (filter === 'reorder' ? book.suggestedReorder > 0 : filter === 'low' ? book.status === 'low' || book.status === 'short' : filter === 'out' ? book.status === 'out' : true))
      .filter((book) => !query || `${book.title} ${book.author || ''} ${book.barcode || ''}`.toLowerCase().includes(query));
  }, [books, filter, search]);
  const reorderBooks = useMemo(() => books.filter((book) => book.suggestedReorder > 0), [books]);

  const saveReorderLevel = async (book: InventoryBook, value: string) => {
    const level = Number(value);
    if (!Number.isInteger(level) || level < 0 || level === book.reorderLevel) return;
    const response = await apiFetch(`/api/admin/store/inventory/books/${encodeURIComponent(book.productId)}`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ reorderLevel: level }) });
    const data = await response.json().catch(() => null);
    if (!response.ok) return adminErrorToast(data?.error || 'Unable to save the reorder level.');
    adminSuccessToast(`${book.title}: reorder at ${level}.`);
    void load();
  };

  const exportStock = async (format: 'excel' | 'pdf') => {
    setBusy(`stock:${format}`);
    try {
      await downloadReport({
        format,
        title: `Book stock · ${invoiceDate(new Date().toISOString())}`,
        fileName: `book-stock-${periodSlug(period)}`,
        columns: [
          { key: 'title', label: 'Book' }, { key: 'barcode', label: 'Barcode' }, { key: 'stock', label: 'In stock' }, { key: 'committed', label: 'Promised' }, { key: 'free', label: 'Free to sell' },
          { key: 'reorderLevel', label: 'Reorder level' }, { key: 'soldRecently', label: `Sold ${velocityDays} days` }, { key: 'suggestedReorder', label: 'Suggested order' },
          { key: 'averageCost', label: 'Average cost' }, { key: 'valueAtCost', label: 'Value at cost' }, { key: 'price', label: 'Price' }, { key: 'valueAtPrice', label: 'Value at price' }, { key: 'status', label: 'Status' },
        ],
        rows: shown.map((book) => ({
          title: book.title, barcode: book.barcode || '', stock: String(book.stock), committed: String(book.committed), free: String(book.free), reorderLevel: String(book.reorderLevel),
          soldRecently: String(book.soldRecently), suggestedReorder: String(book.suggestedReorder), averageCost: book.averageCost === null ? '' : documentAmount(book.averageCost),
          valueAtCost: book.valueAtCost === null ? '' : documentAmount(book.valueAtCost), price: documentAmount(book.price), valueAtPrice: documentAmount(book.valueAtPrice), status: INVENTORY_STATUS_LABEL[book.status],
        })),
        summary: summary ? [
          ['Titles', shown.length], ['Copies in stock', summary.copies], ['Promised on invoices', summary.committed],
          ['Value at cost', money(summary.valueAtCost)], ['Value at selling price', money(summary.valueAtPrice)],
        ] : [],
      });
    } catch {
      adminErrorToast('Could not make the file.');
    } finally {
      setBusy(null);
    }
  };

  const exportMovements = async (format: 'excel' | 'pdf') => {
    setBusy(`movements:${format}`);
    try {
      await downloadReport({
        format,
        title: `Stock movements · ${periodLabel(period)}`,
        fileName: `stock-movements-${periodSlug(period)}`,
        columns: [
          { key: 'date', label: 'Date' }, { key: 'book', label: 'Book' }, { key: 'reason', label: 'What' }, { key: 'reference', label: 'Reference' },
          { key: 'change', label: 'In / out' }, { key: 'stockAfter', label: 'Balance' }, { key: 'note', label: 'Note' }, { key: 'by', label: 'By' },
        ],
        rows: movements.map((movement) => ({
          date: receiptDate(movement.createdAt), book: movement.bookTitle, reason: movement.reason, reference: movement.reference || '',
          change: movement.change > 0 ? `+${movement.change}` : String(movement.change), stockAfter: String(movement.stockAfter), note: movement.note || '', by: movement.createdBy || '',
        })),
        summary: [['Copies in', movements.filter((m) => m.change > 0).reduce((s, m) => s + m.change, 0)], ['Copies out', -movements.filter((m) => m.change < 0).reduce((s, m) => s + m.change, 0)]],
      });
    } catch {
      adminErrorToast('Could not make the file.');
    } finally {
      setBusy(null);
    }
  };

  const submitCancelReceipt = async (event: FormEvent) => {
    event.preventDefault();
    if (!cancellingReceipt) return;
    setBusy('cancel');
    try {
      const response = await apiFetch(`/api/admin/store/inventory/receipts/${encodeURIComponent(cancellingReceipt.id)}/cancel`, { method: 'POST', headers: headers(), body: JSON.stringify({ reason: cancelReason.trim() }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) return adminErrorToast(data?.error || 'Unable to cancel this restock.');
      adminSuccessToast(`${data.receipt.receiptNumber} cancelled; ${data.receipt.totalCopies} copies taken back out of stock.`);
      setCancellingReceipt(null);
      setViewingReceipt(null);
      void load();
    } finally {
      setBusy(null);
    }
  };

  const receiptRender = useMemo(() => (viewingReceipt ? (origin: string) => receiptHtml(viewingReceipt, origin) : null), [viewingReceipt]);

  if (!token) {
    return <AdminLoginCard email={email} password={password} loginError={loginError} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={handleLogin} />;
  }

  const allReasons = ['restock', 'sale', 'invoice delivery', 'invoice paid', 'sale cancelled', 'delivery cancelled', 'payment voided', 'restock cancelled', 'opening stock', ...reasons.filter((entry) => entry !== 'stock count'), 'stock count'];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/70">Hope Publishing House</p>
          <h1 className="text-2xl font-semibold">Book inventory</h1>
          <p className="text-sm text-muted-foreground">Stock on hand, what is promised on invoices, restocks from the printer, and every change to each book&apos;s stock.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => printHtml(reorderListHtml(reorderBooks), 'Reorder list')} disabled={!reorderBooks.length}><ClipboardList className="h-4 w-4" /> Reorder list ({reorderBooks.length})</Button>
          <Button onClick={() => setReceiving([])}><PackagePlus className="h-4 w-4" /> Receive stock</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Boxes} label="Copies in stock" value={summary?.copies ?? '—'} detail={`${summary?.titles ?? 0} titles`} />
        <KpiCard icon={Wallet} label="Stock value at cost" value={money(summary?.valueAtCost || 0)} detail={`${money(summary?.valueAtPrice || 0)} at selling price${summary?.uncostedTitles ? ` · ${summary.uncostedTitles} titles have no cost yet` : ''}`} />
        <KpiCard icon={AlertTriangle} label="Need reordering" value={summary?.toReorder ?? 0} detail={`${summary?.low ?? 0} low · ${summary?.short ?? 0} promised out · ${summary?.out ?? 0} out of stock`} />
        <KpiCard icon={FileText} label="Promised on invoices" value={summary?.committed ?? 0} detail="Copies invoiced but not yet delivered or paid" />
      </div>

      <nav className="flex gap-1 overflow-x-auto rounded-xl border border-border/60 bg-card p-1" aria-label="Inventory">
        {([['stock', 'Stock', Boxes], ['restocks', 'Restocks', PackagePlus], ['movements', 'Stock movements', History]] as const).map(([key, label, Icon]) => (
          <button key={key} type="button" onClick={() => setTab(key)} aria-current={tab === key ? 'page' : undefined} className={cn('flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium', tab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </nav>

      <div className="rounded-xl border border-border/60 bg-card p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">{tab === 'stock' ? 'Period for the received / out columns' : 'Period'}</p>
        <PeriodFilter value={period} onChange={setPeriod} />
        {tab === 'stock' && summary ? (
          <p className="mt-2 text-xs text-muted-foreground">{periodLabel(period)}: {summary.received} copies received ({money(summary.receivedCost)}), {summary.copiesOut} sold or delivered, {summary.adjusted >= 0 ? '+' : ''}{summary.adjusted} adjusted.</p>
        ) : null}
      </div>

      {tab === 'stock' ? (
        <>
          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-3 lg:flex-row lg:items-center">
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="Stock filter">
              {FILTERS.map((entry) => (
                <button key={entry.value} type="button" role="tab" aria-selected={filter === entry.value} onClick={() => setFilter(entry.value)} className={cn('rounded-full px-3 py-1 text-xs font-medium', filter === entry.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>{entry.label}</button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title, author or barcode" className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm" />
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="h-9" onClick={() => void exportStock('excel')} disabled={Boolean(busy)}>{busy === 'stock:excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Excel</Button>
              <Button size="sm" variant="outline" className="h-9" onClick={() => void exportStock('pdf')} disabled={Boolean(busy)}>{busy === 'stock:pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} PDF</Button>
              <Button size="sm" variant="outline" className="h-9" onClick={() => void load()} disabled={loading} aria-label="Refresh"><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /></Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Book</th>
                  <th className="px-3 py-2 text-right font-medium">In stock</th>
                  <th className="px-3 py-2 text-right font-medium" title="On open invoices, not yet delivered or paid">Promised</th>
                  <th className="px-3 py-2 text-right font-medium">Free</th>
                  <th className="px-3 py-2 text-right font-medium">Reorder at</th>
                  <th className="px-3 py-2 text-right font-medium">Sold {velocityDays}d</th>
                  <th className="px-3 py-2 text-right font-medium">Lasts</th>
                  <th className="px-3 py-2 text-right font-medium">Value at cost</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 ? (
                  <tr><td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">{loading ? 'Loading…' : 'No books here.'}</td></tr>
                ) : shown.map((book) => (
                  <tr key={book.productId} className="border-t border-border/60 align-top">
                    <td className="px-3 py-2">
                      <button type="button" className="text-left font-medium hover:underline" onClick={() => setCard(book)}>{book.title}</button>
                      <p className="text-[11px] text-muted-foreground">{[book.author, book.barcode, book.isActive ? null : 'not on sale'].filter(Boolean).join(' · ')}</p>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{book.stock}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{book.committed || '—'}</td>
                    <td className={cn('px-3 py-2 text-right tabular-nums', book.free <= 0 && 'font-semibold text-destructive')}>{book.free}</td>
                    <td className="px-3 py-2 text-right">
                      <input type="number" min={0} step={1} defaultValue={book.reorderLevel} key={`${book.productId}-${book.reorderLevel}`} onBlur={(event) => void saveReorderLevel(book, event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} className="h-8 w-16 rounded-md border border-border bg-background px-2 text-right text-sm" aria-label={`Reorder level for ${book.title}`} />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{book.soldRecently}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right text-xs text-muted-foreground">{book.daysOfCover === null ? '—' : `${book.daysOfCover} days`}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{book.valueAtCost === null ? <span className="text-xs text-muted-foreground">no cost</span> : money(book.valueAtCost)}</td>
                    <td className="px-3 py-2">
                      <Pill tone={TONES[book.status]}>{INVENTORY_STATUS_LABEL[book.status]}</Pill>
                      {book.suggestedReorder ? <p className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">Order {book.suggestedReorder}</p> : null}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setReceiving([{ book, quantity: book.suggestedReorder || undefined }])}><PackagePlus className="h-3.5 w-3.5" /> Restock</Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setAdjusting(book)}><SlidersHorizontal className="h-3.5 w-3.5" /> Adjust</Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCard(book)} aria-label={`Stock card for ${book.title}`} title="Stock card"><History className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {reorderBooks.length ? (
            <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              <p><strong>{reorderBooks.length} {reorderBooks.length === 1 ? 'book needs' : 'books need'} reordering</strong>: {reorderBooks.reduce((sum, book) => sum + book.suggestedReorder, 0)} copies suggested, enough for a month of sales plus what is promised.</p>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => void downloadHtmlPdf(reorderListHtml(reorderBooks), 'reorder-list.pdf')}><Download className="h-4 w-4" /> Reorder list PDF</Button>
                <Button size="sm" onClick={() => setReceiving(reorderBooks.map((book) => ({ book, quantity: book.suggestedReorder })))}><PackagePlus className="h-4 w-4" /> Receive these</Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {tab === 'restocks' ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <KpiCard icon={PackagePlus} label="Restocks" value={receiptSummary?.count ?? 0} detail={periodLabel(period)} />
            <KpiCard icon={Boxes} label="Copies received" value={receiptSummary?.copies ?? 0} />
            <KpiCard icon={Wallet} label="Cost of stock received" value={money(receiptSummary?.cost || 0)} />
          </div>
          <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-3 py-2 font-medium">Receipt</th><th className="px-3 py-2 font-medium">From</th><th className="px-3 py-2 font-medium">Books</th><th className="px-3 py-2 text-right font-medium">Copies</th><th className="px-3 py-2 text-right font-medium">Cost</th><th className="px-3 py-2" /></tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">{loading ? 'Loading…' : 'No restocks in this period. Use Receive stock when copies arrive.'}</td></tr>
                ) : receipts.map((receipt) => (
                  <tr key={receipt.id} className={cn('border-t border-border/60 align-top', receipt.cancelledAt && 'text-muted-foreground line-through')}>
                    <td className="px-3 py-2">
                      <button type="button" className="font-mono text-xs font-semibold text-primary hover:underline" onClick={() => setViewingReceipt(receipt)}>{receipt.receiptNumber}</button>
                      <p className="text-[11px] text-muted-foreground">{invoiceDate(receipt.receivedAt)}{receipt.createdBy ? ` · ${receipt.createdBy}` : ''}</p>
                    </td>
                    <td className="px-3 py-2">{receipt.supplier || '—'}<p className="text-[11px] text-muted-foreground">{receipt.supplierReference}</p></td>
                    <td className="max-w-[280px] px-3 py-2 text-xs">{receipt.lines.map((line) => `${line.title} ×${line.quantity}`).join(', ')}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{receipt.totalCopies}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{money(receipt.totalCost)}</td>
                    <td className="px-3 py-2 text-right">
                      {receipt.cancelledAt ? <Pill tone="red">Cancelled</Pill> : <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewingReceipt(receipt)} aria-label={`Open ${receipt.receiptNumber}`}><FileText className="h-4 w-4" /></Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {tab === 'movements' ? (
        <>
          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-3 sm:flex-row sm:items-center">
            <select value={movementReason} onChange={(event) => setMovementReason(event.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-sm capitalize" aria-label="Kind of change">
              <option value="">Every kind of change</option>
              {[...new Set(allReasons)].map((entry) => <option key={entry} value={entry}>{entry}</option>)}
            </select>
            <span className="flex-1 text-xs text-muted-foreground">
              {movements.filter((m) => m.change > 0).reduce((s, m) => s + m.change, 0)} in · {-movements.filter((m) => m.change < 0).reduce((s, m) => s + m.change, 0)} out
            </span>
            <Button size="sm" variant="outline" className="h-9" onClick={() => void exportMovements('excel')} disabled={Boolean(busy)}><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
            <Button size="sm" variant="outline" className="h-9" onClick={() => void exportMovements('pdf')} disabled={Boolean(busy)}><Download className="h-4 w-4" /> PDF</Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-3 py-2 font-medium">Date</th><th className="px-3 py-2 font-medium">Book</th><th className="px-3 py-2 font-medium">What</th><th className="px-3 py-2 font-medium">Reference</th><th className="px-3 py-2 text-right font-medium">In / out</th><th className="px-3 py-2 text-right font-medium">Balance</th></tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">{loading ? 'Loading…' : 'No stock changes in this period.'}</td></tr>
                ) : movements.map((movement) => (
                  <tr key={movement.id} className="border-t border-border/60 align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">{receiptDate(movement.createdAt)}</td>
                    <td className="px-3 py-2">{movement.bookTitle}</td>
                    <td className="px-3 py-2"><span className="capitalize">{movement.reason}</span>{movement.note ? <span className="block text-[11px] text-muted-foreground">{movement.note}</span> : null}</td>
                    <td className="px-3 py-2 font-mono text-xs">{movement.reference || '—'}</td>
                    <td className={cn('px-3 py-2 text-right font-semibold tabular-nums', movement.change > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300')}>{movement.change > 0 ? `+${movement.change}` : movement.change}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{movement.stockAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {receiving ? (
        <ReceiveStockDialog
          books={books}
          start={receiving}
          headers={headers}
          onClose={() => setReceiving(null)}
          onSaved={(receipt) => {
            setReceiving(null);
            adminSuccessToast(`${receipt.receiptNumber}: ${receipt.totalCopies} copies added to stock${receipt.totalCost ? ` (${money(receipt.totalCost)})` : ''}.`);
            setViewingReceipt(receipt);
            void load();
          }}
        />
      ) : null}
      {adjusting ? (
        <AdjustStockDialog
          book={adjusting}
          reasons={reasons}
          headers={headers}
          onClose={() => setAdjusting(null)}
          onSaved={(stock, change) => {
            adminSuccessToast(`${adjusting.title}: ${change > 0 ? `+${change}` : change}, now ${stock} in stock.`);
            setAdjusting(null);
            void load();
          }}
        />
      ) : null}
      {card ? <StockCardDialog key={card.productId} book={card} headers={headers} onClose={() => setCard(null)} onRestock={() => { setReceiving([{ book: card }]); setCard(null); }} /> : null}

      <Dialog open={Boolean(viewingReceipt)} onOpenChange={(open) => !open && setViewingReceipt(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          {viewingReceipt && receiptRender ? (
            <>
              <DialogHeader>
                <DialogTitle>{viewingReceipt.receiptNumber}</DialogTitle>
                <DialogDescription>{viewingReceipt.supplier || 'Supplier not given'} · {invoiceDate(viewingReceipt.receivedAt)} · {viewingReceipt.totalCopies} copies · {money(viewingReceipt.totalCost)}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => printHtml(receiptHtml(viewingReceipt), viewingReceipt.receiptNumber)}><Printer className="h-3.5 w-3.5" /> Print</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => void downloadHtmlPdf(receiptHtml(viewingReceipt), `${viewingReceipt.receiptNumber}.pdf`)}><Download className="h-3.5 w-3.5" /> PDF</Button>
                {!viewingReceipt.cancelledAt ? (
                  <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive" onClick={() => { setCancellingReceipt(viewingReceipt); setCancelReason(''); }}><XCircle className="h-3.5 w-3.5" /> Cancel restock</Button>
                ) : null}
              </div>
              <DocumentPreview render={receiptRender} title={viewingReceipt.receiptNumber} />
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cancellingReceipt)} onOpenChange={(open) => !open && setCancellingReceipt(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitCancelReceipt} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Cancel {cancellingReceipt?.receiptNumber}?</DialogTitle>
              <DialogDescription>For a restock entered by mistake. Its {cancellingReceipt?.totalCopies} copies are taken back out of stock and the average cost is put back.</DialogDescription>
            </DialogHeader>
            <label className={labelClass}>Reason (required)
              <input value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} maxLength={500} required autoFocus placeholder="e.g. entered twice" className={inputClass} />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCancellingReceipt(null)}>Close</Button>
              <Button type="submit" variant="destructive" disabled={busy === 'cancel'}><PackageX className="h-4 w-4" /> Cancel restock</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
