'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, BookOpen, CalendarClock, Clock, FileText, Loader2, Minus, Repeat, Sparkles, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminErrorToast } from '@/components/admin/admin-toast';
import { BarRow, CHART_COLORS, ChartCard, KpiCard, TrendChart, shortDay, shortMonth } from '@/components/admin/DashboardBits';
import { periodLabel, periodParams, periodSlug, withParams, type Period } from '@/lib/admin-reports';
import { apiFetch, resolveMediaImageUrl } from '@/lib/api';
import {
  FORMAT_LABELS,
  WEEKDAYS,
  bookMoney as money,
  downloadBestSellersPdf,
  hourRange,
  rankBooks,
  reportTotals,
  restockSoon,
  stockLeftLabel,
  unsoldBooks,
  type BestSellerReport,
  type RankedBook,
  type SalesFormat,
} from '@/lib/best-sellers-report';
import { cn } from '@/lib/utils';

const FORMATS: SalesFormat[] = ['all', 'hard', 'soft'];
const TAB_LABELS: Record<SalesFormat, string> = { all: 'All copies', hard: 'Hard copies', soft: 'Soft copies' };
const MEDALS = ['bg-[#c9a227] text-white', 'bg-slate-400 text-white', 'bg-amber-700 text-white'];
const TABLE_ROWS = 15;

const shortDate = (value: string) => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function Cover({ book, className }: { book: RankedBook; className?: string }) {
  const src = resolveMediaImageUrl(book.coverImageUrl);
  return src ? (
    <img src={src} alt="" className={cn('rounded object-cover shadow-sm', className)} />
  ) : (
    <span className={cn('flex items-center justify-center rounded bg-muted text-muted-foreground', className)}><BookOpen className="h-4 w-4" /></span>
  );
}

function Movement({ book, comparing }: { book: RankedBook; comparing: boolean }) {
  if (!comparing) return <span className="text-muted-foreground">—</span>;
  if (book.movement === null) return <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">New</span>;
  if (book.movement === 0) return <span className="inline-flex items-center text-muted-foreground" aria-label="Same place"><Minus className="h-3 w-3" /></span>;
  const up = book.movement > 0;
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[11px] font-semibold', up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')} aria-label={`${up ? 'Up' : 'Down'} ${Math.abs(book.movement)}`}>
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}{Math.abs(book.movement)}
    </span>
  );
}

/** Which books sell best, hard and soft copies, for the period chosen on the sales page. */
export default function BestSellersPanel({ token, period, refreshKey }: { token: string; period: Period; refreshKey?: unknown }) {
  const [report, setReport] = useState<BestSellerReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<SalesFormat>('all');
  const [showAll, setShowAll] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiFetch(withParams('/api/admin/store/best-sellers', periodParams(period)), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!alive) return;
        if (!response.ok) {
          adminErrorToast(data?.error || 'Unable to load the best sellers.');
          return;
        }
        setReport(data);
      })
      .catch(() => alive && adminErrorToast('Unable to load the best sellers.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [token, period, refreshKey]);

  const books = useMemo(() => report?.books || [], [report]);
  const ranked = useMemo(() => rankBooks(books, format), [books, format]);
  const totals = useMemo(() => reportTotals(books, format), [books, format]);
  const restock = useMemo(() => (format === 'soft' ? [] : restockSoon(books)), [books, format]);
  const unsold = useMemo(() => unsoldBooks(books, format), [books, format]);
  const patterns = report?.patterns[format];
  const comparing = Boolean(report?.period.previousFrom);
  const comparedWith = report?.period.previousFrom && report.period.previousTo
    ? `${shortDate(report.period.previousFrom)} to ${shortDate(report.period.previousTo)}`
    : null;
  const series = [
    ...(format !== 'soft' ? [{ key: 'hard', label: 'Hard copies', color: CHART_COLORS.primary }] : []),
    ...(format !== 'hard' ? [{ key: 'soft', label: 'Soft copies', color: CHART_COLORS.gold }] : []),
  ];
  const maxWeekday = Math.max(1, ...(patterns?.weekdays || []));

  const exportPdf = async () => {
    if (!report) return;
    setExporting(true);
    try {
      await downloadBestSellersPdf({ report, format, periodLabel: periodLabel(period), comparedWith, fileName: `best-sellers-${format}-${periodSlug(period)}` });
    } catch {
      adminErrorToast('Unable to create the PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm" aria-labelledby="best-sellers-title">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 id="best-sellers-title" className="flex items-center gap-2 text-sm font-semibold"><Trophy className="h-4 w-4 text-[#c9a227]" /> Best-selling books</h2>
          <p className="text-xs text-muted-foreground">
            {periodLabel(period)}{comparedWith ? `, compared with ${comparedWith}` : ''}. Paid sales only: online, counter and scanned labels.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5" role="tablist" aria-label="Copies">
            {FORMATS.map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={format === value}
                onClick={() => setFormat(value)}
                className={cn('rounded-md px-3 py-1 text-xs font-medium transition-colors', format === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                {TAB_LABELS[value]}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={() => void exportPdf()} disabled={!report || exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Best sellers PDF
          </Button>
        </div>
      </div>

      {!report ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading best sellers" /></div>
      ) : (
        <div className={cn('space-y-4 transition-opacity', loading && 'opacity-60')}>
          {ranked.length ? (
            <ol className="grid gap-3 md:grid-cols-3">
              {ranked.slice(0, 3).map((book, index) => (
                <li key={book.productId} className={cn('relative flex gap-3 rounded-xl border p-3', index === 0 ? 'border-[#c9a227] bg-[#c9a227]/10' : 'border-border/60 bg-muted/30')}>
                  <span className={cn('absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow', MEDALS[index])}>{index + 1}</span>
                  <Cover book={book} className="h-24 w-16 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-tight">{book.title}</p>
                    {book.author ? <p className="truncate text-[11px] text-muted-foreground">{book.author}</p> : null}
                    <p className="mt-1.5 text-lg font-bold leading-none">{book.units.toLocaleString()} <span className="text-xs font-medium text-muted-foreground">copies</span></p>
                    <p className="text-xs text-muted-foreground">{money(book.revenue)} · {Math.round(book.share * 100)}% of copies</p>
                    {format === 'all' ? (
                      <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted" title={`${book.hardUnits} hard, ${book.softUnits} soft`}>
                        <span className="bg-[#1e3a5f]" style={{ width: `${(book.hardUnits / book.units) * 100}%` }} />
                        <span className="bg-[#c9a227]" style={{ width: `${(book.softUnits / book.units) * 100}%` }} />
                      </div>
                    ) : null}
                    <p className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      {format === 'all' ? <span>{book.hardUnits} hard · {book.softUnits} soft</span> : null}
                      <Movement book={book} comparing={comparing} />
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-lg bg-muted/40 py-8 text-center text-sm text-muted-foreground">No {format === 'all' ? '' : `${TAB_LABELS[format].toLowerCase()} `}sold in this period.</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={totals.change !== null && totals.change < 0 ? TrendingDown : TrendingUp}
              label="Copies sold"
              value={totals.units}
              detail={totals.change === null ? (format === 'all' ? `${totals.hardUnits} hard · ${totals.softUnits} soft` : FORMAT_LABELS[format]) : `${totals.change > 0 ? '+' : ''}${totals.change}% on before (${totals.previousUnits})`}
            />
            <KpiCard icon={Sparkles} label="Sales value" value={money(totals.revenue)} detail={`${patterns?.orders ?? 0} orders · average ${money(patterns?.averageOrder ?? 0)}`} />
            <KpiCard icon={Repeat} label="Buyers" value={patterns?.buyers ?? 0} detail={`${patterns?.repeatBuyers ?? 0} came back for more`} />
            <KpiCard
              icon={Clock}
              label="Busiest time"
              value={patterns?.busiestWeekday != null ? WEEKDAYS[patterns.busiestWeekday] : '—'}
              detail={patterns?.busiestHour != null ? `Most copies sell ${hourRange(patterns.busiestHour)}` : 'Not enough sales yet'}
            />
          </div>

          {ranked.length ? (
            <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
              <ChartCard title={report.trend.unit === 'day' ? 'Copies sold per day' : 'Copies sold per month'}>
                <TrendChart data={report.trend.points} xKey="key" formatX={report.trend.unit === 'day' ? shortDay : shortMonth} series={series} />
              </ChartCard>
              <ChartCard title="Copies by day of the week" action={<CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />}>
                {WEEKDAYS.map((day, index) => <BarRow key={day} label={day} value={patterns?.weekdays[index] ?? 0} max={maxWeekday} />)}
                {format !== 'hard' && totals.readersStarted ? (
                  <p className="border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                    E-books: {totals.readersStarted} started reading, {totals.readersFinished} finished.
                  </p>
                ) : null}
              </ChartCard>
            </div>
          ) : null}

          {restock.length || unsold.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {restock.length ? (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/30">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200"><AlertTriangle className="h-3.5 w-3.5" /> Restock soon</h3>
                  <ul className="mt-2 space-y-1 text-xs">
                    {restock.map((book) => (
                      <li key={book.productId} className="flex justify-between gap-3">
                        <span className="truncate">{book.title}</span>
                        <span className="shrink-0 font-semibold">{book.stock} left · {stockLeftLabel(book)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-amber-900/70 dark:text-amber-200/70">At the pace of the last 30 days.</p>
                </div>
              ) : null}
              {unsold.length ? (
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <h3 className="text-xs font-semibold">Not sold in this period ({unsold.length})</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {unsold.slice(0, 12).map((book) => <span key={book.productId} className="rounded-full bg-background px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-border">{book.title}</span>)}
                    {unsold.length > 12 ? <span className="px-1 text-[11px] text-muted-foreground">and {unsold.length - 12} more (in the PDF)</span> : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {ranked.length ? (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-muted text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">#</th>
                      <th className="px-3 py-2 font-medium">Move</th>
                      <th className="px-3 py-2 font-medium">Book</th>
                      <th className="px-3 py-2 text-right font-medium">Hard</th>
                      <th className="px-3 py-2 text-right font-medium">Soft</th>
                      <th className="px-3 py-2 text-right font-medium">Sales value</th>
                      <th className="px-3 py-2 font-medium">Share of copies</th>
                      <th className="px-3 py-2 font-medium">Hard copy stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAll ? ranked : ranked.slice(0, TABLE_ROWS)).map((book) => {
                      const warn = book.hardCopyEnabled && book.inCatalogue && (book.stock <= 0 || (book.daysOfStockLeft !== null && book.daysOfStockLeft <= 14));
                      return (
                        <tr key={book.productId} className="border-t border-border/60">
                          <td className="px-3 py-2 font-semibold tabular-nums">{book.rank}</td>
                          <td className="px-3 py-2"><Movement book={book} comparing={comparing} /></td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Cover book={book} className="h-9 w-6 shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium">{book.title}</p>
                                <p className="text-[11px] text-muted-foreground">{book.author || ''}{book.buyers ? `${book.author ? ' · ' : ''}${book.buyers} ${book.buyers === 1 ? 'buyer' : 'buyers'}` : ''}</p>
                              </div>
                            </div>
                          </td>
                          <td className={cn('px-3 py-2 text-right tabular-nums', format === 'soft' && 'text-muted-foreground')}>{book.hardUnits}</td>
                          <td className={cn('px-3 py-2 text-right tabular-nums', format === 'hard' && 'text-muted-foreground')}>{book.softUnits}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{money(book.revenue)}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${book.share * 100}%` }} /></div>
                              <span className="tabular-nums text-muted-foreground">{Math.round(book.share * 100)}%</span>
                            </div>
                          </td>
                          <td className={cn('whitespace-nowrap px-3 py-2', warn && 'font-semibold text-rose-600 dark:text-rose-400')}>
                            {book.hardCopyEnabled && book.inCatalogue ? stockLeftLabel(book) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {ranked.length > TABLE_ROWS ? (
                <div className="border-t border-border/60 p-2 text-center">
                  <Button size="sm" variant="ghost" onClick={() => setShowAll((value) => !value)}>{showAll ? 'Show top 15 only' : `Show all ${ranked.length} books`}</Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
