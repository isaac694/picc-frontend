'use client';

import type { ComponentType, ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { BookOpen, RefreshCw, ShoppingBag, TrendingUp } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminErrorToast } from '@/components/admin/admin-toast';
import { StorePaymentsTabs } from '@/components/admin/payments/PaymentsSectionTabs';
import { StoreBookPerformance, type BookPerformance } from '@/components/admin/payments/StoreBookPerformance';
import { formatAdminDate, formatMoney, paymentStatusBadgeClass } from '@/lib/admin-payments';

type StoreKpis = {
  total: number;
  paid: number;
  pending: number;
  cancelled: number;
  newInPeriod: number;
  paidInPeriod: number;
  completionRate: number;
  byStatus: Record<string, number>;
  byFormat: Record<string, number>;
  byPaymentMethod: Array<{ paymentMethod: string; count: number }>;
  amountByCurrency: Array<{ currency: string; paid: number; pending: number; cancelled: number; other: number }>;
  paidInPeriodByCurrency: Array<{ currency: string; paid: number }>;
};

type RecentPurchase = {
  id: string;
  title?: string;
  format?: string;
  price?: number;
  currency?: string;
  status?: string;
  customerEmail?: string;
  paychanguChargeId?: string;
  paidAt?: string;
};

const num = (v: unknown) => Number(v || 0);

export default function StoreDashboardPage() {
  const { token } = useAdminAuth();
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState<StoreKpis | null>(null);
  const [recent, setRecent] = useState<RecentPurchase[]>([]);
  const [bookStats, setBookStats] = useState<BookPerformance | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [response, booksResponse] = await Promise.all([
        apiFetch(`/api/admin/store/dashboard/kpis?days=${days}`, { headers }),
        apiFetch(`/api/admin/store/dashboard/books?days=${days}`, { headers }),
      ]);
      const booksData = await booksResponse.json().catch(() => ({}));
      if (booksResponse.ok && Array.isArray(booksData.books)) {
        setBookStats(booksData as BookPerformance);
      } else {
        adminErrorToast(booksData.error || 'Unable to load book performance.');
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        adminErrorToast(data.error || data.message || 'Unable to load store dashboard.');
        return;
      }
      const p = (data.kpis?.purchases || data.purchases || {}) as Record<string, unknown>;
      setKpis({
        total: num(p.total),
        paid: num(p.paid),
        pending: num(p.pending),
        cancelled: num(p.cancelled),
        newInPeriod: num(p.newInPeriod),
        paidInPeriod: num(p.paidInPeriod),
        completionRate: num(p.completionRate),
        byStatus: (p.byStatus as Record<string, number>) || {},
        byFormat: (p.byFormat as Record<string, number>) || {},
        byPaymentMethod: Array.isArray(p.byPaymentMethod) ? (p.byPaymentMethod as StoreKpis['byPaymentMethod']) : [],
        amountByCurrency: Array.isArray(p.amountByCurrency) ? (p.amountByCurrency as StoreKpis['amountByCurrency']) : [],
        paidInPeriodByCurrency: Array.isArray(p.paidInPeriodByCurrency)
          ? (p.paidInPeriodByCurrency as StoreKpis['paidInPeriodByCurrency'])
          : [],
      });
      setRecent(Array.isArray(data.recentPurchases) ? data.recentPurchases : []);
    } catch {
      adminErrorToast('Unable to load store dashboard.');
    } finally {
      setLoading(false);
    }
  }, [days, token]);

  useEffect(() => {
    const id = setTimeout(() => void fetchDashboard(), 0);
    return () => clearTimeout(id);
  }, [fetchDashboard]);

  const statusRows = Object.entries(kpis?.byStatus || {}).map(([label, value]) => ({ label, value: num(value) }));
  const formatRows = Object.entries(kpis?.byFormat || {}).map(([label, value]) => ({ label, value: num(value) }));
  const maxStatus = Math.max(...statusRows.map((r) => r.value), 1);
  const maxFormat = Math.max(...formatRows.map((r) => r.value), 1);

  return (
    <div className="space-y-4">
      <StorePaymentsTabs activePath="/admin/store/dashboard" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-base font-semibold">Store dashboard</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Bookshop sales KPIs and recent PayChangu checkouts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Period (days)
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
            >
              {[7, 30, 90, 365].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <Button variant="outline" size="sm" onClick={() => void fetchDashboard()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ShoppingBag} label="Total line items" value={kpis?.total ?? '—'} detail={`${kpis?.paid ?? 0} paid (available)`} />
        <KpiCard icon={TrendingUp} label="Completion rate" value={`${kpis?.completionRate ?? 0}%`} detail={`${kpis?.pending ?? 0} pending`} />
        <KpiCard icon={BookOpen} label="New in period" value={kpis?.newInPeriod ?? '—'} detail={`${kpis?.paidInPeriod ?? 0} paid in period`} />
        <KpiCard
          icon={ShoppingBag}
          label="Paid (period)"
          value={kpis?.paidInPeriodByCurrency?.[0] ? formatMoney(kpis.paidInPeriodByCurrency[0].paid, kpis.paidInPeriodByCurrency[0].currency) : '—'}
          detail={`${kpis?.cancelled ?? 0} cancelled overall`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="By status">
          {statusRows.map((row) => (
            <BarRow key={row.label} label={row.label} value={row.value} max={maxStatus} />
          ))}
          {statusRows.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">No data yet.</p> : null}
        </ChartCard>
        <ChartCard title="Soft vs hard copy">
          {formatRows.map((row) => (
            <BarRow key={row.label} label={row.label} value={row.value} max={maxFormat} />
          ))}
          {formatRows.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">No data yet.</p> : null}
        </ChartCard>
      </div>

      <StoreBookPerformance data={bookStats} loading={loading} />

      <div className="rounded-lg border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/60 px-4 py-3">
          <h2 className="text-sm font-semibold">Recent purchases</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-semibold">Title</th>
                <th className="px-4 py-2 font-semibold">Format</th>
                <th className="px-4 py-2 font-semibold">Amount</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-2.5 font-medium">{row.title || '—'}</td>
                  <td className="px-4 py-2.5 capitalize">{row.format || '—'}</td>
                  <td className="px-4 py-2.5">{formatMoney(row.price, row.currency)}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={paymentStatusBadgeClass(row.status)}>{row.status || '—'}</Badge>
                  </td>
                  <td className="px-4 py-2.5">{formatAdminDate(row.paidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">No recent purchases.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3 shadow-sm">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-3 space-y-2.5">{children}</div>
    </div>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="truncate capitalize text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}
