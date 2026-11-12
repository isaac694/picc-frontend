'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, Clock3, Download, FileSpreadsheet, Hourglass, Loader2, PackagePlus, Printer, RefreshCw, Repeat, Search, Truck, Wallet } from 'lucide-react';
import { KpiCard } from '@/components/admin/DashboardBits';
import { adminErrorToast } from '@/components/admin/admin-toast';
import { Pill, type Tone } from '@/components/admin/store-docs/bits';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { printHtml } from '@/lib/book-labels';
import { downloadReport, periodLabel, periodParams, periodSlug, withParams, type Period } from '@/lib/admin-reports';
import {
  daysAgoText, FRESHNESS_LABEL, longDay, monthLabel, nextDueText, restockReportHtml, timeOfDay,
  type RestockFreshness, type RestockReport, type RestockReportBook, type RestockTimelineEntry, type StockReceipt,
} from '@/lib/book-inventory';
import { documentAmount, downloadHtmlPdf, invoiceDate } from '@/lib/store-invoice';
import { money, receiptDate } from '@/lib/store-receipt';
import { cn } from '@/lib/utils';

const FRESHNESS_TONE: Record<RestockFreshness, Tone> = { recent: 'green', aging: 'amber', stale: 'red', never: 'grey' };
type View = 'all' | RestockFreshness | 'due';
type Sort = 'oldest' | 'newest' | 'title' | 'due';

/** A timeline entry as a goods received note, so it opens in the usual GRN view. */
const asReceipt = (entry: RestockTimelineEntry): StockReceipt => ({
  id: entry.id, receiptNumber: entry.receiptNumber, supplier: entry.supplier, supplierReference: entry.supplierReference, receivedAt: entry.receivedAt,
  lines: entry.lines, totalCopies: entry.totalCopies, totalCost: entry.totalCost, note: entry.note, createdBy: entry.createdBy,
  cancelledAt: entry.cancelledAt, cancelledBy: entry.cancelledBy, cancelReason: entry.cancelReason, createdAt: entry.enteredAt,
});

/**
 * When each book was last restocked, to the minute, and the restocks of the period on a timeline: how
 * long since copies came in, how much of the last delivery has sold, how often a book is restocked and
 * when the next restock is likely to be needed.
 */
export default function RestockReportPanel({
  headers,
  period,
  reloadKey,
  onOpenReceipt,
  onRestock,
}: {
  headers: () => Record<string, string>;
  period: Period;
  /** Changes whenever stock changes elsewhere on the page, to reload. */
  reloadKey: number;
  onOpenReceipt: (receipt: StockReceipt) => void;
  onRestock: (productId: string) => void;
}) {
  const [report, setReport] = useState<RestockReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>('all');
  const [sort, setSort] = useState<Sort>('oldest');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch(withParams('/api/admin/store/inventory/restock-report', periodParams(period)), { headers: headers(), cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!response.ok) return adminErrorToast(data?.error || 'Unable to load the restock report.');
      setReport(data);
    } finally {
      setLoading(false);
    }
  }, [headers, period]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const books = useMemo(() => {
    const query = search.trim().toLowerCase();
    const at = (book: RestockReportBook) => (book.lastRestock ? new Date(book.lastRestock.at).getTime() : 0);
    const due = (book: RestockReportBook) => (book.dueNow ? 0 : book.nextRestockDue ? new Date(book.nextRestockDue).getTime() : Number.MAX_SAFE_INTEGER);
    return (report?.books || [])
      .filter((book) => (view === 'all' ? true : view === 'due' ? book.dueNow : book.freshness === view))
      .filter((book) => !query || `${book.title} ${book.barcode || ''} ${book.lastRestock?.receiptNumber || ''} ${book.lastRestock?.supplier || ''}`.toLowerCase().includes(query))
      .sort((a, b) => (sort === 'title' ? a.title.localeCompare(b.title) : sort === 'newest' ? at(b) - at(a) : sort === 'due' ? due(a) - due(b) : at(a) - at(b)));
  }, [report, view, sort, search]);

  // The period's restocks grouped by the day they arrived, newest day first.
  const days = useMemo(() => {
    const groups: Array<{ day: string; entries: RestockTimelineEntry[] }> = [];
    for (const entry of report?.timeline || []) {
      const day = longDay(entry.receivedAt);
      const group = groups.at(-1);
      if (group && group.day === day) group.entries.push(entry);
      else groups.push({ day, entries: [entry] });
    }
    return groups;
  }, [report]);

  const exportBooks = async (format: 'excel' | 'pdf') => {
    if (!report) return;
    setBusy(format);
    try {
      await downloadReport({
        format,
        title: `Restock report · ${periodLabel(period)}`,
        fileName: `restock-report-${periodSlug(period)}`,
        columns: [
          { key: 'title', label: 'Book' }, { key: 'lastDate', label: 'Last restocked' }, { key: 'lastTime', label: 'Time' }, { key: 'ago', label: 'Days since' },
          { key: 'grn', label: 'GRN' }, { key: 'supplier', label: 'Supplier' }, { key: 'lastCopies', label: 'Copies last time' }, { key: 'soldSince', label: 'Sold since' },
          { key: 'sellThrough', label: 'Sell-through' }, { key: 'every', label: 'Restocked every (days)' }, { key: 'times', label: 'Times restocked' },
          { key: 'periodCopies', label: 'Received in period' }, { key: 'stock', label: 'In stock' }, { key: 'free', label: 'Free' }, { key: 'nextDue', label: 'Next restock due' }, { key: 'freshness', label: 'Freshness' },
        ],
        rows: books.map((book) => ({
          title: book.title,
          lastDate: book.lastRestock ? invoiceDate(book.lastRestock.at) : 'Never',
          lastTime: book.lastRestock ? timeOfDay(book.lastRestock.at) : '',
          ago: book.daysSinceLastRestock === null ? '' : String(book.daysSinceLastRestock),
          grn: book.lastRestock?.receiptNumber || '',
          supplier: book.lastRestock?.supplier || '',
          lastCopies: book.lastRestock ? String(book.lastRestock.quantity) : '',
          soldSince: book.lastRestock ? String(book.soldSinceLastRestock) : '',
          sellThrough: book.sellThrough === null ? '' : `${book.sellThrough}%`,
          every: book.averageGapDays === null ? '' : String(book.averageGapDays),
          times: String(book.restocksAllTime),
          periodCopies: String(book.period.copies),
          stock: String(book.stock),
          free: String(book.free),
          nextDue: nextDueText(book),
          freshness: FRESHNESS_LABEL[book.freshness],
        })),
        summary: [
          ['Last restock', report.summary.lastRestock ? `${receiptDate(report.summary.lastRestock.at)} · ${report.summary.lastRestock.receiptNumber}` : 'None'],
          ['Restocks in period', report.summary.restocks], ['Copies received', report.summary.copies], ['Cost of stock received', money(report.summary.cost)],
          ['Average days between restocks', report.summary.averageGapDays ?? '—'],
        ],
      });
    } catch {
      adminErrorToast('Could not make the file.');
    } finally {
      setBusy(null);
    }
  };

  const summary = report?.summary;
  const last = summary?.lastRestock;
  const lastEntry = last ? report?.timeline.find((entry) => entry.receiptNumber === last.receiptNumber) : null;
  const maxMonth = Math.max(1, ...(report?.months || []).map((month) => month.copies));

  return (
    <div className="space-y-4">
      {/* The most recent restock, to the minute. */}
      <section className="overflow-hidden rounded-xl border border-[#087989]/30 bg-gradient-to-br from-[#E4F1F3] to-card dark:from-[#087989]/15">
        <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-[#087989] text-white shadow-sm">
              {last ? (
                <>
                  <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{new Date(last.at).toLocaleDateString('en-GB', { month: 'short' })}</span>
                  <span className="text-2xl font-bold leading-none">{new Date(last.at).getDate()}</span>
                </>
              ) : <PackagePlus className="h-7 w-7" />}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#087989]">Last restock</p>
              {last ? (
                <>
                  <p className="text-xl font-semibold">{longDay(last.at)} <span className="text-muted-foreground">at</span> {timeOfDay(last.at)}</p>
                  <p className="text-sm text-muted-foreground">
                    {daysAgoText(last.daysAgo)} · <span className="font-mono text-xs">{last.receiptNumber}</span> · {last.copies} copies of {last.titles} {last.titles === 1 ? 'title' : 'titles'}{last.supplier ? ` from ${last.supplier}` : ''}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Received by {last.createdBy || 'staff'} · entered {receiptDate(last.enteredAt)}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No restock recorded yet. Use Receive stock when copies arrive from the printer.</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {lastEntry ? <Button size="sm" variant="outline" onClick={() => onOpenReceipt(asReceipt(lastEntry))}>Open {last?.receiptNumber}</Button> : null}
            <Button size="sm" variant="outline" onClick={() => report && printHtml(restockReportHtml(report, periodLabel(period)), 'Restock report')} disabled={!report}><Printer className="h-4 w-4" /> Print report</Button>
            <Button size="sm" onClick={() => report && void downloadHtmlPdf(restockReportHtml(report, periodLabel(period)), `restock-report-${periodSlug(period)}.pdf`)} disabled={!report}><Download className="h-4 w-4" /> Report PDF</Button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Truck} label="Restocks" value={summary?.restocks ?? 0} detail={`${periodLabel(period)}${summary?.cancelled ? ` · ${summary.cancelled} cancelled` : ''}`} />
        <KpiCard icon={PackagePlus} label="Copies received" value={summary?.copies ?? 0} detail={`${summary?.titlesRestocked ?? 0} titles restocked`} />
        <KpiCard icon={Wallet} label="Cost of stock received" value={money(summary?.cost || 0)} detail="At the cost entered on each GRN" />
        <KpiCard icon={Repeat} label="Restock every" value={summary?.averageGapDays === null || summary?.averageGapDays === undefined ? '—' : `${summary.averageGapDays} days`} detail="Average gap between restocks, all time" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Freshness: how long since each book last had copies in. */}
        <section className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Hourglass className="h-4 w-4 text-[#087989]" /> Since the last restock</h2>
            <span className="text-xs text-muted-foreground">{report?.books.length ?? 0} titles</span>
          </div>
          {report ? (
            <>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden>
                {(['recent', 'aging', 'stale', 'never'] as const).map((key) => (
                  <div key={key} style={{ width: `${(summary![key] / Math.max(1, report.books.length)) * 100}%` }} className={cn(key === 'recent' && 'bg-emerald-500', key === 'aging' && 'bg-amber-400', key === 'stale' && 'bg-rose-500', key === 'never' && 'bg-slate-300 dark:bg-slate-600')} />
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(['recent', 'aging', 'stale', 'never'] as const).map((key) => (
                  <button key={key} type="button" onClick={() => setView(view === key ? 'all' : key)} aria-pressed={view === key} className={cn('rounded-lg border px-3 py-2 text-left transition-colors', view === key ? 'border-primary bg-primary/5' : 'border-border/60 hover:bg-muted')}>
                    <span className="block text-lg font-semibold tabular-nums">{summary![key]}</span>
                    <span className="text-[11px] text-muted-foreground">{FRESHNESS_LABEL[key]}</span>
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setView(view === 'due' ? 'all' : 'due')} aria-pressed={view === 'due'} className={cn('mt-2 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm', view === 'due' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'border-amber-200 bg-amber-50/60 hover:bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20')}>
                <span className="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-100"><CalendarClock className="h-4 w-4" /> Due for restock now</span>
                <span className="text-xs text-amber-900 dark:text-amber-100"><strong className="text-base">{summary!.dueNow}</strong> now · {summary!.dueSoon} more within 14 days</span>
              </button>
            </>
          ) : <p className="mt-6 text-center text-sm text-muted-foreground">{loading ? 'Loading…' : '—'}</p>}
        </section>

        {/* Copies received per month in the period. */}
        <section className="rounded-xl border border-border/60 bg-card p-4">
          <h2 className="text-sm font-semibold">Copies received by month</h2>
          {report?.months.length ? (
            <ul className="mt-3 space-y-2">
              {report.months.map((month) => (
                <li key={month.month} className="text-xs">
                  <div className="flex justify-between"><span className="font-medium">{monthLabel(month.month)}</span><span className="tabular-nums text-muted-foreground">{month.copies} copies · {month.restocks} GRN · {money(month.cost)}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-[#087989]" style={{ width: `${(month.copies / maxMonth) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          ) : <p className="mt-6 text-center text-xs text-muted-foreground">No restocks in this period.</p>}
        </section>
      </div>

      {/* Every book: when it was last restocked, and what has happened since. */}
      <section className="space-y-2">
        <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-3 lg:flex-row lg:items-center">
          <h2 className="text-sm font-semibold lg:w-48">Last restock of each book</h2>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title, barcode, GRN or supplier" className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm" />
          </div>
          <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="h-9 rounded-md border border-border bg-background px-2 text-sm" aria-label="Sort books">
            <option value="oldest">Longest since restock first</option>
            <option value="newest">Most recently restocked first</option>
            <option value="due">Next due first</option>
            <option value="title">Title A–Z</option>
          </select>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-9" onClick={() => void exportBooks('excel')} disabled={Boolean(busy) || !report}>{busy === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Excel</Button>
            <Button size="sm" variant="outline" className="h-9" onClick={() => void exportBooks('pdf')} disabled={Boolean(busy) || !report}>{busy === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} PDF</Button>
            <Button size="sm" variant="outline" className="h-9" onClick={() => void load()} disabled={loading} aria-label="Refresh"><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /></Button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Book</th>
                <th className="px-3 py-2 font-medium">Last restocked</th>
                <th className="px-3 py-2 text-right font-medium">Copies</th>
                <th className="px-3 py-2 font-medium" title="Share of the last delivery sold since it arrived">Sold since</th>
                <th className="px-3 py-2 text-right font-medium" title="Average days between restocks">Every</th>
                <th className="px-3 py-2 text-right font-medium">In period</th>
                <th className="px-3 py-2 text-right font-medium">Stock</th>
                <th className="px-3 py-2 font-medium">Next due</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {books.length === 0 ? (
                <tr><td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">{loading ? 'Loading…' : 'No books here.'}</td></tr>
              ) : books.map((book) => (
                <tr key={book.productId} className="border-t border-border/60 align-top">
                  <td className="px-3 py-2">
                    <span className="font-medium">{book.title}</span>
                    <div className="mt-1"><Pill tone={FRESHNESS_TONE[book.freshness]}>{FRESHNESS_LABEL[book.freshness]}</Pill></div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {book.lastRestock ? (
                      <>
                        <span className="font-medium">{invoiceDate(book.lastRestock.at)}</span>
                        <span className="ml-1.5 inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] tabular-nums"><Clock3 className="h-3 w-3" />{timeOfDay(book.lastRestock.at)}</span>
                        <p className="text-[11px] text-muted-foreground">{daysAgoText(book.daysSinceLastRestock)} · <span className="font-mono">{book.lastRestock.receiptNumber}</span>{book.lastRestock.supplier ? ` · ${book.lastRestock.supplier}` : ''}</p>
                      </>
                    ) : <span className="text-xs text-muted-foreground">Never restocked</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{book.lastRestock?.quantity ?? '—'}</td>
                  <td className="min-w-[130px] px-3 py-2">
                    {book.sellThrough === null ? <span className="text-xs text-muted-foreground">—</span> : (
                      <>
                        <div className="flex justify-between text-[11px]"><span>{book.soldSinceLastRestock} of {book.lastRestock?.quantity}</span><span className="font-semibold">{book.sellThrough}%</span></div>
                        <div className="mt-1 h-1.5 rounded-full bg-muted"><div className={cn('h-1.5 rounded-full', book.sellThrough >= 80 ? 'bg-rose-500' : book.sellThrough >= 50 ? 'bg-amber-400' : 'bg-emerald-500')} style={{ width: `${book.sellThrough}%` }} /></div>
                      </>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right text-xs">{book.averageGapDays === null ? '—' : `${book.averageGapDays} days`}<p className="text-[11px] text-muted-foreground">{book.restocksAllTime}× in all</p></td>
                  <td className="px-3 py-2 text-right tabular-nums">{book.period.copies || '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{book.stock}<p className="text-[11px] text-muted-foreground">{book.free} free</p></td>
                  <td className={cn('whitespace-nowrap px-3 py-2 text-xs', book.dueNow && 'font-semibold text-amber-700 dark:text-amber-300')}>{nextDueText(book)}</td>
                  <td className="px-3 py-2 text-right"><Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onRestock(book.productId)}><PackagePlus className="h-3.5 w-3.5" /> Restock</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* The restocks of the period, day by day with the time each arrived. */}
        <section className="rounded-xl border border-border/60 bg-card p-4">
          <h2 className="text-sm font-semibold">Restock timeline · {periodLabel(period)}</h2>
          {days.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No restocks in this period.</p> : (
            <ol className="mt-3 space-y-4">
              {days.map((group) => (
                <li key={group.day}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#087989]">{group.day}</p>
                  <ol className="space-y-2 border-l-2 border-[#087989]/30 pl-4">
                    {group.entries.map((entry) => (
                      <li key={entry.id} className="relative">
                        <span className={cn('absolute -left-[23px] top-2 h-3 w-3 rounded-full border-2 border-card', entry.cancelledAt ? 'bg-rose-400' : 'bg-[#087989]')} />
                        <button type="button" onClick={() => onOpenReceipt(asReceipt(entry))} className={cn('w-full rounded-lg border border-border/60 px-3 py-2 text-left hover:bg-muted', entry.cancelledAt && 'opacity-60')}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded bg-[#087989]/10 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-[#087989]"><Clock3 className="h-3 w-3" />{timeOfDay(entry.receivedAt)}</span>
                              <span className="font-mono text-xs font-semibold">{entry.receiptNumber}</span>
                              {entry.cancelledAt ? <Pill tone="red">Cancelled</Pill> : null}
                            </span>
                            <span className="text-xs tabular-nums"><strong>{entry.totalCopies}</strong> copies · {money(entry.totalCost)}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{entry.lines.map((line) => `${line.title} ×${line.quantity}`).join(', ')}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{entry.supplier || 'Supplier not given'}{entry.supplierReference ? ` · ref. ${entry.supplierReference}` : ''} · by {entry.createdBy || 'staff'}{entry.cancelReason ? ` · cancelled: ${entry.cancelReason}` : ''}</p>
                        </button>
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="h-fit rounded-xl border border-border/60 bg-card p-4">
          <h2 className="text-sm font-semibold">By supplier</h2>
          {report?.suppliers.length ? (
            <ul className="mt-3 divide-y divide-border/60">
              {report.suppliers.map((entry) => (
                <li key={entry.supplier} className="py-2 text-sm">
                  <div className="flex justify-between gap-2"><span className="font-medium">{entry.supplier}</span><span className="tabular-nums">{entry.copies} copies</span></div>
                  <p className="text-[11px] text-muted-foreground">{entry.restocks} {entry.restocks === 1 ? 'restock' : 'restocks'} · {entry.titles} titles · {documentAmount(entry.cost)} MWK · last {receiptDate(entry.lastAt)}</p>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-xs text-muted-foreground">No restocks in this period.</p>}
        </section>
      </div>
    </div>
  );
}
