'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarClock, Crown, FileSpreadsheet, FileText, FolderOpen, Gauge, Loader2, PackageCheck, Search, ShoppingBag, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminErrorToast } from '@/components/admin/admin-toast';
import BrandedStockDialog from '@/components/admin/BrandedStockDialog';
import { BarRow, CHART_COLORS, ChartCard, KpiCard, TrendChart, shortMonth } from '@/components/admin/DashboardBits';
import PeriodFilter from '@/components/admin/PeriodFilter';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { periodLabel, periodParams, periodSlug, withParams, type Period } from '@/lib/admin-reports';
import { apiFetch, resolveMediaImageUrl } from '@/lib/api';
import { downloadBrandedItemExcel, downloadBrandedItemPdf, reportDate, reportMoney as money, salesByMonth, summarizeSales, type BrandedSaleRow } from '@/lib/branded-item-report';
import { cn } from '@/lib/utils';

type ItemSales = {
  item: { id: string; name: string; category: string; imageUrl: string | null; price: number; stock: number; isActive: boolean; status: 'ok' | 'low' | 'out' };
  sales: BrandedSaleRow[];
  allTime: { units: number; revenue: number; restocked: number; unitsLast30Days: number };
};

const FILTERS = [
  { value: 'all', label: 'All sales' },
  { value: 'in person', label: 'In person' },
  { value: 'online', label: 'Online' },
  { value: 'owed', label: 'Still owed' },
  { value: 'uncollected', label: 'Not collected' },
] as const;
type Filter = (typeof FILTERS)[number]['value'];

const PAGE_SIZE = 50;
const FULL_MONTH = (key: string) => new Date(`${key}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

/** How long the stock lasts at the last 30 days' pace. */
function stockRunway(stock: number, unitsLast30Days: number) {
  if (stock <= 0) return { value: 'Out of stock', detail: 'Restock to keep selling' };
  if (!unitsLast30Days) return { value: 'No recent sales', detail: `${stock} in stock, none sold in 30 days` };
  const days = Math.round((stock / unitsLast30Days) * 30);
  const value = days < 1 ? 'Under a day' : days < 60 ? `About ${days} ${days === 1 ? 'day' : 'days'}` : `About ${Math.round(days / 30)} months`;
  return { value, detail: `At ${unitsLast30Days} sold in the last 30 days` };
}

/** One branded item's folder: every sale, what the sales say, and the reports to take away. */
export default function BrandedItemFolderPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || '');
  const { token } = useAdminAuth();
  const [data, setData] = useState<ItemSales | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<Period>({ preset: 'all' });
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [restocking, setRestocking] = useState(false);

  const load = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    try {
      const response = await apiFetch(withParams(`/api/admin/store/merchandise/${encodeURIComponent(id)}/sales`, periodParams(period)), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setLoadError(body?.error || 'Unable to load this item\'s sales.');
        return;
      }
      setLoadError('');
      setData(body);
    } catch {
      setLoadError('Unable to load this item\'s sales.');
    } finally {
      setLoading(false);
    }
  }, [token, id, period]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [period, filter, search]);

  const sales = useMemo(() => data?.sales || [], [data]);
  const shown = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sales.filter((sale) => {
      if (filter === 'in person' || filter === 'online') {
        if (sale.source !== filter) return false;
      }
      if (filter === 'owed' && sale.paymentStatus === 'paid') return false;
      if (filter === 'uncollected' && (sale.source === 'online' || sale.collectionStatus === 'collected')) return false;
      if (!query) return true;
      return [sale.buyer, sale.contact, sale.method, sale.reference, sale.note].some((field) => field?.toLowerCase().includes(query));
    });
  }, [sales, filter, search]);

  const summary = useMemo(() => summarizeSales(sales), [sales]);
  const months = useMemo(() => salesByMonth(sales), [sales]);
  const bestMonth = useMemo(() => months.reduce<(typeof months)[number] | null>((best, row) => (row.units > (best?.units ?? 0) ? row : best), null), [months]);
  const topBuyers = useMemo(() => {
    const totals = new Map<string, { label: string; units: number }>();
    for (const sale of sales) {
      const key = sale.buyer.trim().toLowerCase();
      const entry = totals.get(key) || { label: sale.buyer, units: 0 };
      entry.units += sale.quantity;
      totals.set(key, entry);
    }
    return [...totals.values()].sort((a, b) => b.units - a.units).slice(0, 5);
  }, [sales]);
  const byMethod = useMemo(() => {
    const totals = new Map<string, number>();
    for (const sale of sales) totals.set(sale.method || 'Not recorded', (totals.get(sale.method || 'Not recorded') || 0) + sale.amount);
    return [...totals.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [sales]);

  if (loadError && !data) {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-8 text-center">
        <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm">{loadError}</p>
        <Button asChild variant="outline" size="sm" className="mt-4"><Link href="/admin/store/merchandise/stats">Back to all folders</Link></Button>
      </div>
    );
  }

  if (!data) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading sales" /></div>;
  }

  const { item, allTime } = data;
  const image = resolveMediaImageUrl(item.imageUrl);
  const runway = stockRunway(item.stock, allTime.unitsLast30Days);
  const sellThrough = allTime.units + item.stock > 0 ? Math.round((allTime.units / (allTime.units + item.stock)) * 100) : 0;
  const filterLabel = FILTERS.find((entry) => entry.value === filter)?.label || 'All sales';
  const label = search.trim() ? `${filterLabel}, matching "${search.trim()}"` : filterLabel;
  const maxBuyer = Math.max(1, ...topBuyers.map((row) => row.units));
  const maxMethod = Math.max(1, ...byMethod.map((row) => row.value));

  const exportReport = async (format: 'pdf' | 'excel') => {
    setExporting(format);
    try {
      const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'branded-item';
      const report = { item, periodLabel: periodLabel(period), filterLabel: label, fileName: `${slug}-sales-${periodSlug(period)}`, rows: shown };
      if (format === 'pdf') await downloadBrandedItemPdf({ ...report, imageSrc: image });
      else downloadBrandedItemExcel(report);
    } catch {
      adminErrorToast('Unable to create the report. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-4">
      <Link href="/admin/store/merchandise/stats" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> All item folders
      </Link>

      <header className="overflow-hidden rounded-xl bg-[#1e3a5f] text-white shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <img src={image || '/store/items/placeholder.png'} alt="" className="h-24 w-24 shrink-0 rounded-lg bg-white object-cover ring-2 ring-white/30" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white/70"><FolderOpen className="h-3.5 w-3.5" /> {item.category}</p>
            <h1 className="mt-0.5 text-xl font-bold leading-tight">{item.name}</h1>
            <p className="mt-1 text-xs text-white/70">
              {money(item.price)} each · {allTime.units.toLocaleString()} sold in all, {money(allTime.revenue)}{item.isActive ? '' : ' · Not on sale'}
            </p>
            <div className="mt-2 max-w-sm">
              <div className="flex justify-between text-[11px] text-white/70">
                <span>{sellThrough}% of all stock sold</span>
                <span className={cn(item.status !== 'ok' && 'font-semibold text-amber-300')}>{item.stock} left</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-white/20"><div className="h-1.5 rounded-full bg-[#c9a227]" style={{ width: `${sellThrough}%` }} /></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-col">
            <Button size="sm" variant="secondary" onClick={() => void exportReport('pdf')} disabled={Boolean(exporting)}>
              {exporting === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Export PDF
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void exportReport('excel')} disabled={Boolean(exporting)}>
              {exporting === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Export Excel
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setRestocking(true)}><PackageCheck className="h-4 w-4" /> Restock</Button>
          </div>
        </div>
      </header>

      <PeriodFilter value={period} onChange={setPeriod} />
      {loadError ? <p className="text-sm text-destructive" role="alert">{loadError}</p> : null}

      <div className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-4', loading && 'opacity-60')}>
        <KpiCard icon={ShoppingBag} label="Units sold" value={summary.units} detail={`${summary.inPersonUnits} in person · ${summary.onlineUnits} online`} />
        <KpiCard icon={Wallet} label="Sales value" value={money(summary.revenue)} detail={`${money(summary.paid)} paid · ${money(summary.owed)} owed`} />
        <KpiCard icon={Users} label="Buyers" value={summary.buyers} detail={`${summary.sales} ${summary.sales === 1 ? 'sale' : 'sales'}${summary.sales ? `, about ${(summary.units / summary.sales).toFixed(1)} units each` : ''}`} />
        <KpiCard icon={Gauge} label="Stock will last" value={runway.value} detail={runway.detail} />
      </div>

      {sales.length ? (
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <ChartCard
            title="Units sold per month"
            action={bestMonth ? <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarClock className="h-3 w-3" /> Best: {FULL_MONTH(bestMonth.month)} ({bestMonth.units})</span> : null}
          >
            <TrendChart height={340} data={months} xKey="month" formatX={shortMonth} series={[{ key: 'units', label: 'Units sold', color: CHART_COLORS.primary }]} />
          </ChartCard>
          <div className="space-y-4">
            <ChartCard title="Top buyers" action={<Crown className="h-3.5 w-3.5 text-[#c9a227]" />}>
              {topBuyers.map((row) => <BarRow key={row.label} label={row.label} value={row.units} max={maxBuyer} />)}
            </ChartCard>
            <ChartCard title="How people paid">
              {byMethod.map((row) => <BarRow key={row.label} label={row.label} value={row.value} max={maxMethod} display={money(row.value)} />)}
            </ChartCard>
          </div>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
        <div className="space-y-3 border-b border-border/60 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Sales <span className="font-normal text-muted-foreground">({shown.length.toLocaleString()} shown, in the exports too)</span></h2>
            <label className="relative">
              <span className="sr-only">Search sales</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buyer, contact, method" className="h-8 w-56 rounded-md border border-border bg-background pl-8 pr-2 text-xs" />
            </label>
          </div>
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((entry) => (
              <button
                key={entry.value}
                type="button"
                aria-pressed={filter === entry.value}
                onClick={() => setFilter(entry.value)}
                className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors', filter === entry.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground')}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-muted text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Buyer</th>
                <th className="px-4 py-2 font-medium">Sold</th>
                <th className="px-4 py-2 text-right font-medium">Qty</th>
                <th className="px-4 py-2 text-right font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Payment</th>
                <th className="px-4 py-2 font-medium">Method</th>
                <th className="px-4 py-2 font-medium">Collected</th>
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, visible).map((sale) => (
                <tr key={`${sale.source}-${sale.id}`} className="border-t border-border/60">
                  <td className="whitespace-nowrap px-4 py-2.5">{reportDate(sale.date)}</td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{sale.buyer}</p>
                    {sale.contact ? <p className="text-[11px] text-muted-foreground">{sale.contact}</p> : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">{sale.source === 'online' ? 'Online' : 'In person'}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{sale.quantity}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{money(sale.amount)}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={cn(sale.paymentStatus === 'paid' ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'border-destructive text-destructive')}>
                      {sale.paymentStatus === 'paid' ? 'Paid' : 'Not paid'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    {sale.method || '—'}
                    {sale.reference ? <p className="font-mono text-[11px] text-muted-foreground">{sale.reference}</p> : null}
                  </td>
                  <td className="px-4 py-2.5">{sale.source === 'online' ? '—' : sale.collectionStatus === 'collected' ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!shown.length ? (
            <p className="py-10 text-center text-xs text-muted-foreground">
              {sales.length ? 'No sales match this filter.' : `No sales of ${item.name} in this period.`}
            </p>
          ) : null}
        </div>
        {shown.length > visible ? (
          <div className="border-t border-border/60 p-3 text-center">
            <Button size="sm" variant="outline" onClick={() => setVisible((value) => value + PAGE_SIZE)}>Show more ({(shown.length - visible).toLocaleString()} left)</Button>
          </div>
        ) : null}
      </section>

      {token ? (
        <BrandedStockDialog
          token={token}
          item={restocking ? { id: item.id, name: item.name, stock: item.stock } : null}
          onClose={() => setRestocking(false)}
          onChanged={() => void load()}
        />
      ) : null}
    </div>
  );
}
