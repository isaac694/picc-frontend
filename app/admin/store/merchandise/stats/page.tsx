'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Boxes, Coins, PackageCheck, RefreshCw, ShoppingBag, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export default function BrandedItemStatsPage() {
  const { token } = useAdminAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<'unitsSold' | 'revenue' | 'stock'>('unitsSold');
  const [stockItem, setStockItem] = useState<ItemStat | null>(null);

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

  const items = useMemo(() => [...(stats?.items || [])].sort((a, b) => (sort === 'stock' ? a.stock - b.stock : b[sort] - a[sort])), [stats, sort]);
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

      <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <h2 className="text-sm font-semibold">Item by item</h2>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Sort by
            <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground">
              <option value="unitsSold">Units sold</option>
              <option value="revenue">Sales value</option>
              <option value="stock">Lowest stock</option>
            </select>
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-muted text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Item</th>
                <th className="px-4 py-2 text-right font-medium">Sold</th>
                <th className="px-4 py-2 text-right font-medium">In person / online</th>
                <th className="px-4 py-2 text-right font-medium">Sales value</th>
                <th className="px-4 py-2 text-right font-medium">Owed</th>
                <th className="px-4 py-2 text-right font-medium">Restocked</th>
                <th className="px-4 py-2 text-right font-medium">In stock</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={cn('border-t border-border/60', !item.isActive && 'text-muted-foreground')}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <img src={resolveMediaImageUrl(item.imageUrl) || '/store/items/placeholder.jpg'} alt="" className="h-10 w-10 rounded-md object-cover" />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.category} · {money(item.price)}{item.lastSoldAt ? ` · last sold ${new Date(item.lastSoldAt).toLocaleDateString('en-GB')}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{item.unitsSold.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{item.inPersonUnits} / {item.onlineUnits}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{money(item.revenue)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{item.outstanding ? money(item.outstanding) : '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{item.restocked || '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        'tabular-nums',
                        item.status === 'out' && 'border-destructive text-destructive',
                        item.status === 'low' && 'border-amber-500 text-amber-600',
                      )}
                    >
                      {item.stock}{item.status === 'out' ? ' · out' : item.status === 'low' ? ' · low' : ''}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setStockItem(item)}>
                      <PackageCheck className="h-3.5 w-3.5" /> Restock
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats && !items.length ? <p className="py-8 text-center text-xs text-muted-foreground">No branded items yet.</p> : null}
        </div>
      </div>

      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Coins className="h-3 w-3" /> Online sales count when the payment is confirmed. In-person sales come from Branded item sales.
      </p>

      {token ? <BrandedStockDialog token={token} item={stockItem} onClose={() => setStockItem(null)} onChanged={() => void load()} /> : null}
    </div>
  );
}
