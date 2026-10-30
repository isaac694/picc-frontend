'use client';

import type { ComponentType, ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BookMarked,
  BookOpen,
  Boxes,
  Download,
  FileText,
  Package,
  Search,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadRegistrationsExcel, downloadRegistrationsPdf, type ExportColumn } from '@/lib/event-registration-export';
import { formatAdminDate, formatMoney } from '@/lib/admin-payments';

export type BookStat = {
  productId: string;
  id: string | null;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  isActive: boolean;
  inCatalogue: boolean;
  hardCopyEnabled: boolean;
  softCopyEnabled: boolean;
  hardCopyPrice: number;
  softCopyPrice: number;
  hardCopyStock: number;
  stockValue: number;
  hardSold: number;
  softSold: number;
  copiesSold: number;
  hardRevenue: number;
  softRevenue: number;
  revenue: number;
  pendingCount: number;
  pendingAmount: number;
  cancelledCount: number;
  hardSoldInPeriod: number;
  softSoldInPeriod: number;
  revenueInPeriod: number;
  buyers: number;
  readersStarted: number;
  readersFinished: number;
  lastSoldAt: string | null;
};

export type BookTotals = {
  books: number;
  activeBooks: number;
  hardSold: number;
  softSold: number;
  copiesSold: number;
  hardRevenue: number;
  softRevenue: number;
  revenue: number;
  revenueInPeriod: number;
  soldInPeriod: number;
  pendingCount: number;
  pendingAmount: number;
  hardCopyStock: number;
  stockValue: number;
  outOfStock: number;
  lowStock: number;
  readersStarted: number;
  readersFinished: number;
};

export type BookPerformance = {
  periodDays: number;
  currency: string;
  lowStockThreshold: number;
  totals: BookTotals;
  books: BookStat[];
};

type SortKey = 'sold' | 'revenue' | 'stock' | 'title';

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: 'sold', label: 'Most copies sold' },
  { key: 'revenue', label: 'Most money made' },
  { key: 'stock', label: 'Lowest stock first' },
  { key: 'title', label: 'Title A–Z' },
];

// Hard copy and soft copy keep the same colour everywhere on this board.
const HARD_FILL = 'bg-[#2a78d6] dark:bg-[#3987e5]';
const SOFT_FILL = 'bg-[#eb6834] dark:bg-[#d95926]';

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

type StockLevel = 'none' | 'out' | 'low' | 'ok';

function stockLevel(book: BookStat, threshold: number): StockLevel {
  if (!book.inCatalogue || !book.hardCopyEnabled) return 'none';
  if (book.hardCopyStock <= 0) return 'out';
  if (book.hardCopyStock <= threshold) return 'low';
  return 'ok';
}

const STOCK_BADGE: Record<StockLevel, { label: string; className: string }> = {
  none: { label: 'No hard copy', className: 'border-border bg-muted text-muted-foreground' },
  out: { label: 'Out of stock', className: 'border-red-200 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200' },
  low: { label: 'Running low', className: 'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200' },
  ok: { label: 'In stock', className: 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' },
};

export function StoreBookPerformance({ data, loading }: { data: BookPerformance | null; loading: boolean }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('sold');
  const [exporting, setExporting] = useState(false);

  const currency = data?.currency || 'MWK';
  const money = (value: number) => formatMoney(value, currency);
  const totals = data?.totals;
  const threshold = data?.lowStockThreshold ?? 5;
  const books = data?.books || [];

  const needle = query.trim().toLowerCase();
  const visible = books
    .filter((book) => !needle || `${book.title} ${book.author || ''}`.toLowerCase().includes(needle))
    .sort((a, b) => {
      if (sort === 'revenue') return b.revenue - a.revenue || b.copiesSold - a.copiesSold;
      if (sort === 'title') return a.title.localeCompare(b.title);
      if (sort === 'stock') {
        const stockOf = (book: BookStat) => (stockLevel(book, threshold) === 'none' ? Number.POSITIVE_INFINITY : book.hardCopyStock);
        return stockOf(a) - stockOf(b) || b.copiesSold - a.copiesSold;
      }
      return b.copiesSold - a.copiesSold || b.revenue - a.revenue;
    });

  const bestSellers = books.filter((book) => book.copiesSold > 0).slice(0, 8);
  const maxSold = Math.max(...bestSellers.map((book) => book.copiesSold), 1);
  const alerts = books
    .filter((book) => ['out', 'low'].includes(stockLevel(book, threshold)))
    .sort((a, b) => a.hardCopyStock - b.hardCopyStock);

  const exportBooks = async (format: 'excel' | 'pdf') => {
    if (visible.length === 0) return;
    setExporting(true);
    try {
      const columns: ExportColumn[] = [
        { key: 'title', label: 'Book' },
        { key: 'hardPrice', label: 'Hard copy price' },
        { key: 'softPrice', label: 'Soft copy price' },
        { key: 'hardSold', label: 'Hard copies sold' },
        { key: 'softSold', label: 'Soft copies sold' },
        { key: 'sold', label: 'Total sold' },
        { key: 'hardRevenue', label: 'Hard copy sales' },
        { key: 'softRevenue', label: 'Soft copy sales' },
        { key: 'revenue', label: 'Total sales' },
        { key: 'stock', label: 'Stock left' },
        { key: 'stockValue', label: 'Stock value' },
        { key: 'pending', label: 'Unpaid orders' },
      ];
      const blank = Object.fromEntries(columns.map((column) => [column.key, ''])) as Record<string, string>;
      const rows: Array<Record<string, string>> = visible.map((book) => ({
        title: `${book.title}${book.author ? ` — ${book.author}` : ''}`,
        hardPrice: book.hardCopyEnabled ? money(book.hardCopyPrice) : '—',
        softPrice: book.softCopyEnabled && book.softCopyPrice ? money(book.softCopyPrice) : '—',
        hardSold: String(book.hardSold),
        softSold: String(book.softSold),
        sold: String(book.copiesSold),
        hardRevenue: money(book.hardRevenue),
        softRevenue: money(book.softRevenue),
        revenue: money(book.revenue),
        stock: stockLevel(book, threshold) === 'none' ? '—' : String(book.hardCopyStock),
        stockValue: stockLevel(book, threshold) === 'none' ? '—' : money(book.stockValue),
        pending: book.pendingCount ? `${book.pendingCount} (${money(book.pendingAmount)})` : '0',
      }));
      const sum = (pick: (book: BookStat) => number) => visible.reduce((total, book) => total + pick(book), 0);
      rows.push(blank);
      rows.push({
        ...blank,
        title: `TOTAL — ${visible.length} books`,
        hardSold: String(sum((b) => b.hardSold)),
        softSold: String(sum((b) => b.softSold)),
        sold: String(sum((b) => b.copiesSold)),
        hardRevenue: money(sum((b) => b.hardRevenue)),
        softRevenue: money(sum((b) => b.softRevenue)),
        revenue: money(sum((b) => b.revenue)),
        stock: String(sum((b) => (b.inCatalogue ? b.hardCopyStock : 0))),
        stockValue: money(sum((b) => (b.inCatalogue ? b.stockValue : 0))),
        pending: `${sum((b) => b.pendingCount)} (${money(sum((b) => b.pendingAmount))})`,
      });

      const day = new Date().toISOString().slice(0, 10);
      if (format === 'excel') {
        downloadRegistrationsExcel({ fileName: `book-sales-by-title-${day}.xls`, sheetName: 'Book sales', columns, rows });
      } else {
        await downloadRegistrationsPdf({ title: `Book sales by title — ${day}`, fileName: `book-sales-by-title-${day}.pdf`, columns, rows });
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 border-t border-border/60 pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Book performance</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Paid copies only. &ldquo;Last {data?.periodDays ?? 30} days&rdquo; follows the period picker above.
          </p>
        </div>
        <Legend />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Tile
          icon={BookOpen}
          label="Copies sold"
          value={totals ? totals.copiesSold.toLocaleString() : '—'}
          detail={totals ? `${totals.hardSold} hard · ${totals.softSold} soft` : ''}
          split={totals ? { hard: totals.hardSold, soft: totals.softSold } : undefined}
        />
        <Tile
          icon={Wallet}
          label="Book sales (all time)"
          value={totals ? money(totals.revenue) : '—'}
          detail={totals ? `${money(totals.hardRevenue)} hard · ${money(totals.softRevenue)} soft` : ''}
          split={totals ? { hard: totals.hardRevenue, soft: totals.softRevenue } : undefined}
        />
        <Tile
          icon={TrendingUp}
          label={`Last ${data?.periodDays ?? 30} days`}
          value={totals ? money(totals.revenueInPeriod) : '—'}
          detail={totals ? `${totals.soldInPeriod} ${totals.soldInPeriod === 1 ? 'copy' : 'copies'} sold` : ''}
        />
        <Tile
          icon={Boxes}
          label="Hard copies in stock"
          value={totals ? totals.hardCopyStock.toLocaleString() : '—'}
          detail={totals ? `Worth ${money(totals.stockValue)} at shelf price` : ''}
        />
        <Tile
          icon={AlertTriangle}
          label="Stock alerts"
          value={totals ? String(totals.outOfStock + totals.lowStock) : '—'}
          detail={totals ? `${totals.outOfStock} out · ${totals.lowStock} at ${threshold} or fewer` : ''}
          tone={totals && totals.outOfStock > 0 ? 'alert' : undefined}
        />
        <Tile
          icon={BookMarked}
          label="Soft copy readers"
          value={totals ? String(totals.readersFinished) : '—'}
          detail={totals ? `finished · ${totals.readersStarted} still reading` : ''}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-card p-3 shadow-sm xl:col-span-2">
          <h3 className="text-sm font-semibold">Best sellers</h3>
          <p className="text-[11px] text-muted-foreground">Copies sold per book, split by format.</p>
          <div className="mt-3 space-y-3">
            {bestSellers.map((book) => (
              <div key={book.productId} className="group">
                <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
                  <span className="truncate font-medium text-foreground">{book.title}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    <span className="font-semibold text-foreground">{book.copiesSold}</span> · {money(book.revenue)}
                  </span>
                </div>
                <div
                  className="flex h-2.5 gap-[2px]"
                  style={{ width: `${Math.max((book.copiesSold / maxSold) * 100, 2)}%` }}
                  title={`${book.title}: ${book.hardSold} hard, ${book.softSold} soft`}
                >
                  {book.hardSold > 0 ? (
                    <div className={`h-full rounded-l-[4px] ${book.softSold === 0 ? 'rounded-r-[4px]' : ''} ${HARD_FILL}`} style={{ flexGrow: book.hardSold }} />
                  ) : null}
                  {book.softSold > 0 ? (
                    <div className={`h-full rounded-r-[4px] ${book.hardSold === 0 ? 'rounded-l-[4px]' : ''} ${SOFT_FILL}`} style={{ flexGrow: book.softSold }} />
                  ) : null}
                </div>
              </div>
            ))}
            {bestSellers.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">{loading ? 'Loading…' : 'No paid book sales yet.'}</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-card p-3 shadow-sm">
          <h3 className="text-sm font-semibold">Restock soon</h3>
          <p className="text-[11px] text-muted-foreground">Hard copies at {threshold} or fewer.</p>
          <ul className="mt-3 divide-y divide-border/60">
            {alerts.slice(0, 8).map((book) => {
              const level = stockLevel(book, threshold);
              return (
                <li key={book.productId} className="flex items-center justify-between gap-3 py-2 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{book.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {book.hardSoldInPeriod} sold in last {data?.periodDays ?? 30} days
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STOCK_BADGE[level].className}`}>
                    {book.hardCopyStock} left
                  </span>
                </li>
              );
            })}
            {alerts.length === 0 ? (
              <li className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
                <Package className="h-4 w-4" /> Every hard copy book is well stocked.
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm">
        <div className="flex flex-col gap-2 border-b border-border/60 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold">Every book</h3>
            <p className="text-[11px] text-muted-foreground">
              {visible.length} of {books.length} books · {totals?.activeBooks ?? 0} on sale now
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a book or author"
                className="h-8 w-48 rounded-md border border-border bg-background pl-7 pr-2 text-xs"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
              aria-label="Sort books"
            >
              {SORTS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => void exportBooks('excel')} disabled={exporting || visible.length === 0}>
              <Download className="h-3.5 w-3.5" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => void exportBooks('pdf')} disabled={exporting || visible.length === 0}>
              <FileText className="h-3.5 w-3.5" /> PDF
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-semibold">Book</th>
                <th className="px-3 py-2 font-semibold">Price</th>
                <th className="px-3 py-2 text-right font-semibold">Hard sold</th>
                <th className="px-3 py-2 text-right font-semibold">Soft sold</th>
                <th className="px-3 py-2 font-semibold">Format split</th>
                <th className="px-3 py-2 text-right font-semibold">Total sales</th>
                <th className="px-3 py-2 font-semibold">Stock left</th>
                <th className="px-3 py-2 text-right font-semibold">Stock value</th>
                <th className="px-3 py-2 text-right font-semibold">Unpaid</th>
                <th className="px-3 py-2 text-right font-semibold">Buyers</th>
                <th className="px-3 py-2 font-semibold">Last sale</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((book) => {
                const level = stockLevel(book, threshold);
                const hardShare = pct(book.hardSold, book.copiesSold);
                return (
                  <tr key={book.productId} className="align-top">
                    <td className="px-4 py-2.5">
                      <div className="flex min-w-[220px] items-start gap-2.5">
                        <div className="h-12 w-9 shrink-0 overflow-hidden rounded bg-muted">
                          {book.coverImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={book.coverImageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <BookOpen className="m-auto mt-3.5 h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{book.title}</p>
                          {book.author ? <p className="text-[11px] text-muted-foreground">{book.author}</p> : null}
                          <div className="mt-1 flex flex-wrap gap-1">
                            {!book.inCatalogue ? <Pill>Removed from store</Pill> : null}
                            {book.inCatalogue && !book.isActive ? <Pill>Hidden</Pill> : null}
                            {book.readersFinished + book.readersStarted > 0 ? (
                              <Pill>
                                {book.readersFinished} finished · {book.readersStarted} reading
                              </Pill>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                      <p><span className="text-muted-foreground">Hard </span>{book.hardCopyEnabled ? money(book.hardCopyPrice) : '—'}</p>
                      <p><span className="text-muted-foreground">Soft </span>{book.softCopyEnabled && book.softCopyPrice ? money(book.softCopyPrice) : '—'}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      <p className="font-semibold">{book.hardSold}</p>
                      <p className="text-[11px] text-muted-foreground">{money(book.hardRevenue)}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      <p className="font-semibold">{book.softSold}</p>
                      <p className="text-[11px] text-muted-foreground">{money(book.softRevenue)}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      {book.copiesSold > 0 ? (
                        <div className="w-24" title={`${hardShare}% hard copy, ${100 - hardShare}% soft copy`}>
                          <div className="flex h-2 gap-[2px]">
                            {book.hardSold > 0 ? <div className={`rounded-l-[4px] ${book.softSold ? '' : 'rounded-r-[4px]'} ${HARD_FILL}`} style={{ flexGrow: book.hardSold }} /> : null}
                            {book.softSold > 0 ? <div className={`rounded-r-[4px] ${book.hardSold ? '' : 'rounded-l-[4px]'} ${SOFT_FILL}`} style={{ flexGrow: book.softSold }} /> : null}
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">{hardShare}% hard</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No sales yet</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      <p className="font-semibold">{money(book.revenue)}</p>
                      <p className="text-[11px] text-muted-foreground">{book.copiesSold} {book.copiesSold === 1 ? 'copy' : 'copies'}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      {level === 'none' ? (
                        <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] ${STOCK_BADGE.none.className}`}>{STOCK_BADGE.none.label}</span>
                      ) : (
                        <div className="whitespace-nowrap">
                          <p className="font-semibold tabular-nums">{book.hardCopyStock}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] ${STOCK_BADGE[level].className}`}>{STOCK_BADGE[level].label}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{level === 'none' ? '—' : money(book.stockValue)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {book.pendingCount > 0 ? (
                        <>
                          <p className="font-semibold">{book.pendingCount}</p>
                          <p className="text-[11px] text-muted-foreground">{money(book.pendingAmount)}</p>
                        </>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{book.buyers}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{book.lastSoldAt ? formatAdminDate(book.lastSoldAt) : '—'}</td>
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/admin/store/payments?productId=${encodeURIComponent(book.productId)}`}
                        className="whitespace-nowrap text-[11px] font-semibold text-primary hover:underline"
                      >
                        Payments →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              {loading ? 'Loading…' : needle ? 'No book matches that search.' : 'No books in the store yet.'}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className={`h-2.5 w-2.5 rounded-sm ${HARD_FILL}`} /> Hard copy
      </span>
      <span className="flex items-center gap-1.5">
        <span className={`h-2.5 w-2.5 rounded-sm ${SOFT_FILL}`} /> Soft copy
      </span>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-border bg-muted/60 px-1.5 py-px text-[10px] text-muted-foreground">{children}</span>;
}

function Tile({
  icon: Icon,
  label,
  value,
  detail,
  split,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
  split?: { hard: number; soft: number };
  tone?: 'alert';
}) {
  return (
    <div className={`rounded-lg border bg-card p-3 shadow-sm ${tone === 'alert' ? 'border-red-300 dark:border-red-900' : 'border-border/60'}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className={`h-3.5 w-3.5 ${tone === 'alert' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`} />
      </div>
      <p className="mt-2 truncate text-xl font-bold tabular-nums">{value}</p>
      {split && split.hard + split.soft > 0 ? (
        <div className="mt-1.5 flex h-1.5 gap-[2px]">
          {split.hard > 0 ? <div className={`rounded-l-[4px] ${split.soft ? '' : 'rounded-r-[4px]'} ${HARD_FILL}`} style={{ flexGrow: split.hard }} /> : null}
          {split.soft > 0 ? <div className={`rounded-r-[4px] ${split.hard ? '' : 'rounded-l-[4px]'} ${SOFT_FILL}`} style={{ flexGrow: split.soft }} /> : null}
        </div>
      ) : null}
      <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
    </div>
  );
}
