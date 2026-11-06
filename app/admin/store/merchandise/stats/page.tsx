'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Boxes, Coins, Crown, PackageCheck, RefreshCw, Search, ShoppingBag, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminErrorToast } from '@/components/admin/admin-toast';
import BrandedStockDialog from '@/components/admin/BrandedStockDialog';
import { BarRow, CHART_COLORS, ChartCard, KpiCard, TrendChart, shortMonth } from '@/components/admin/DashboardBits';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiFetch, resolveMediaImageUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

type ItemStat = {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
  price: number;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  isFeatured: boolean;
  unitsSold: number;
  inPersonUnits: number;
  onlineUnits: number;
  revenue: number;
  paidRevenue: number;
  outstanding: number;
  restocked: number;
  stockValue: number;
  lastSoldAt: string | null;
  status: 'ok' | 'low' | 'out';
};

type Stats = {
  items: ItemStat[];
  totals: {
    items: number;
    activeItems: number;
    unitsInStock: number;
    stockValue: number;
    unitsSold: number;
    revenue: number;
    paidRevenue: number;
    outstanding: number;
    lowStock: number;
    outOfStock: number;
  };
  monthly: Array<{ month: string; units: number; revenue: number }>;
};

const money = (value: number) => `MWK ${Math.round(value).toLocaleString()}`;

// Dark enough for white text. Each type of item keeps its colour, so folders can be told apart at a glance.
const FOLDER_COLORS: Record<string, string> = {
  Shirt: '#1e3a5f',
  Sticker: '#0f766e',
  Notebook: '#7c3f73',
  Calendar: '#b45309',
  'Bible divider': '#15803d',
  'PICC branded items': '#b91c1c',
};
const folderColor = (category: string) => FOLDER_COLORS[category] || '#475569';

export default function BrandedItemStatsPage() {
  const { token } = useAdminAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<'unitsSold' | 'revenue' | 'stock'>('unitsSold');
  const [stockItem, setStockItem] = useState<ItemStat | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiFetch('/api/admin/store/merchandise-stats', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        adminErrorToast(data?.error || 'Unable to load branded item statistics.');
        return;
      }
      setStats(data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (stats?.items || [])
      .filter((item) => !query || item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query))
      .sort((a, b) => (sort === 'stock' ? a.stock - b.stock : b[sort] - a[sort]));
  }, [stats, sort, search]);
  const topSellerId = useMemo(() => {
    const top = (stats?.items || []).reduce<ItemStat | null>((best, item) => (item.unitsSold > (best?.unitsSold ?? 0) ? item : best), null);
    return top?.id ?? null;
  }, [stats]);
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of stats?.items || []) map.set(item.category, (map.get(item.category) || 0) + item.unitsSold);
    return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [stats]);
  const maxCategory = Math.max(1, ...byCategory.map((row) => row.value));
  const totals = stats?.totals;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/store/merchandise" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Branded items
          </Link>
          <h1 className="text-base font-semibold">Branded item statistics</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Every branded item tracked like a stock item: units sold in person and online, money in, and what is left.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link href="/admin/store/branded-sales">Record a sale</Link></Button>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ShoppingBag} label="Units sold" value={totals?.unitsSold ?? '—'} detail={`${totals?.activeItems ?? 0} of ${totals?.items ?? 0} items on sale`} />
        <KpiCard icon={Wallet} label="Sales value" value={totals ? money(totals.revenue) : '—'} detail={totals ? `${money(totals.paidRevenue)} paid · ${money(totals.outstanding)} owed` : undefined} />
        <KpiCard icon={Boxes} label="Units in stock" value={totals?.unitsInStock ?? '—'} detail={totals ? `${money(totals.stockValue)} at selling price` : undefined} />
        <KpiCard icon={AlertTriangle} label="Need restocking" value={totals ? totals.lowStock + totals.outOfStock : '—'} detail={totals ? `${totals.outOfStock} out of stock · ${totals.lowStock} running low` : undefined} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <ChartCard title="Units sold per month">
          <TrendChart
            data={stats?.monthly || []}
            xKey="month"
            formatX={shortMonth}
            series={[{ key: 'units', label: 'Units sold', color: CHART_COLORS.primary }]}
          />
        </ChartCard>
        <ChartCard title="Units sold by type">
          {byCategory.map((row) => <BarRow key={row.label} label={row.label} value={row.value} max={maxCategory} />)}
          {stats && !byCategory.length ? <p className="text-xs text-muted-foreground">No sales yet.</p> : null}
        </ChartCard>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Item folders</h2>
            <p className="text-xs text-muted-foreground">Open a folder to see every sale of that item and export it as PDF or Excel.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <span className="sr-only">Find an item</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find an item" className="h-8 w-44 rounded-md border border-border bg-background pl-8 pr-2 text-xs" />
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Sort by
              <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground">
                <option value="unitsSold">Units sold</option>
                <option value="revenue">Sales value</option>
                <option value="stock">Lowest stock</option>
              </select>
            </label>
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const color = folderColor(item.category);
            return (
              <li key={item.id} className={cn('group relative', !item.isActive && 'opacity-70')}>
                <Link href={`/admin/store/merchandise/stats/${encodeURIComponent(item.id)}`} aria-label={`Open the sales folder for ${item.name}`} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <div className="relative pt-16">
                    <span className="absolute left-0 top-9 flex h-7 max-w-[55%] items-center rounded-t-lg px-3 text-[11px] font-semibold text-white" style={{ backgroundColor: color }}>
                      <span className="truncate">{item.category}</span>
                    </span>
                    <img
                      src={resolveMediaImageUrl(item.imageUrl) || '/store/items/placeholder.png'}
                      alt=""
                      className="absolute right-5 top-0 h-24 w-24 rotate-3 rounded-md bg-white object-cover shadow-lg ring-2 ring-white transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:rotate-0 motion-reduce:transition-none"
                    />
                    <div className="relative rounded-xl rounded-tl-none p-4 text-white shadow-md" style={{ backgroundColor: color }}>
                      <div className="flex items-center gap-2">
                        {item.id === topSellerId ? <Crown className="h-4 w-4 shrink-0 text-amber-300" aria-label="Top seller" /> : null}
                        <h3 className="min-w-0 truncate text-sm font-bold">{item.name}</h3>
                      </div>
                      <p className="mt-0.5 text-[11px] text-white/80">
                        {money(item.price)} each{item.isActive ? '' : ' · Not on sale'}
                      </p>
                      <dl className="mt-3 grid grid-cols-3 gap-2">
                        <div><dt className="text-[10px] uppercase tracking-wide text-white/80">Sold</dt><dd className="text-base font-bold tabular-nums">{item.unitsSold.toLocaleString()}</dd></div>
                        <div className="col-span-2"><dt className="text-[10px] uppercase tracking-wide text-white/80">Sales value</dt><dd className="truncate text-base font-bold tabular-nums">{money(item.revenue)}</dd></div>
                      </dl>
                      <div className="mt-2 h-1 rounded-full bg-white/25" title="Share of all branded units sold">
                        <div className="h-1 rounded-full bg-white" style={{ width: `${totals?.unitsSold ? (item.unitsSold / totals.unitsSold) * 100 : 0}%` }} />
                      </div>
                      <p className="mt-2 text-[11px] text-white/85">
                        {item.inPersonUnits} in person · {item.onlineUnits} online{item.outstanding ? ` · ${money(item.outstanding)} owed` : ''}
                      </p>
                      <div className="mt-3 flex h-7 items-center border-t border-white/20 pt-2 pr-24 text-[11px] font-semibold">
                        <span className={cn('mr-1.5 h-2 w-2 shrink-0 rounded-full', item.status === 'out' ? 'bg-red-300' : item.status === 'low' ? 'bg-amber-300' : 'bg-emerald-300')} aria-hidden="true" />
                        {item.status === 'out' ? 'Out of stock' : `${item.stock} in stock${item.status === 'low' ? ' · low' : ''}`}
                      </div>
                    </div>
                  </div>
                </Link>
                <Button size="sm" variant="secondary" className="absolute bottom-3 right-3 h-7 gap-1 text-xs" onClick={() => setStockItem(item)} aria-label={`Restock ${item.name}`}>
                  <PackageCheck className="h-3.5 w-3.5" /> Restock
                </Button>
              </li>
            );
          })}
        </ul>
        {stats && !items.length ? <p className="rounded-lg border border-border/60 bg-card py-8 text-center text-xs text-muted-foreground">{search.trim() ? 'No item matches that search.' : 'No branded items yet.'}</p> : null}
      </section>

      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Coins className="h-3 w-3" /> Online sales count when the payment is confirmed. In-person sales come from Branded item sales.
      </p>

      {token ? <BrandedStockDialog token={token} item={stockItem} onClose={() => setStockItem(null)} onChanged={() => void load()} /> : null}
    </div>
  );
}
