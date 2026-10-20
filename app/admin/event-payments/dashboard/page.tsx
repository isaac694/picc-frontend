'use client';

import type { ComponentType, ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Coins, RefreshCw, Ticket, TrendingUp, Wallet } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminErrorToast } from '@/components/admin/admin-toast';
import { EventPaymentsTabs } from '@/components/admin/payments/PaymentsSectionTabs';
import { formatAdminDate, formatMoney, paymentStatusBadgeClass } from '@/lib/admin-payments';

type EventPaymentKpis = {
  total: number;
  completed: number;
  pending: number;
  checkedIn: number;
  newInPeriod: number;
  completedInPeriod: number;
  completionRate: number;
  byStatus: Record<string, number>;
  byPaymentMethod: Array<{ paymentMethod: string; count: number }>;
  byTicketName: Array<{ ticketName: string; count: number }>;
  amountByCurrency: Array<{ currency: string; completed: number; pending: number; other: number }>;
  completedInPeriodByCurrency: Array<{ currency: string; completed: number }>;
};

type RecentPayment = {
  id: string;
  name?: string;
  amount?: number;
  currency?: string;
  status?: string;
  ticketName?: string | null;
  eventTitle?: string | null;
  createdAt?: string;
};

const num = (value: unknown) => Number(value || 0);

export default function EventPaymentsDashboardPage() {
  const { token } = useAdminAuth();
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState<EventPaymentKpis | null>(null);
  const [recent, setRecent] = useState<RecentPayment[]>([]);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiFetch(`/api/admin/event-payments/dashboard/kpis?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        adminErrorToast(data.error || data.message || 'Unable to load event payment dashboard.');
        return;
      }
      const payments = (data.kpis?.payments || {}) as Record<string, unknown>;
      setKpis({
        total: num(payments.total),
        completed: num(payments.completed),
        pending: num(payments.pending),
        checkedIn: num(payments.checkedIn),
        newInPeriod: num(payments.newInPeriod),
        completedInPeriod: num(payments.completedInPeriod),
        completionRate: num(payments.completionRate),
        byStatus: (payments.byStatus as Record<string, number>) || {},
        byPaymentMethod: Array.isArray(payments.byPaymentMethod) ? payments.byPaymentMethod as EventPaymentKpis['byPaymentMethod'] : [],
        byTicketName: Array.isArray(payments.byTicketName) ? payments.byTicketName as EventPaymentKpis['byTicketName'] : [],
        amountByCurrency: Array.isArray(payments.amountByCurrency) ? payments.amountByCurrency as EventPaymentKpis['amountByCurrency'] : [],
        completedInPeriodByCurrency: Array.isArray(payments.completedInPeriodByCurrency)
          ? payments.completedInPeriodByCurrency as EventPaymentKpis['completedInPeriodByCurrency']
          : [],
      });
      setRecent(Array.isArray(data.recentPayments) ? data.recentPayments : []);
    } catch {
      adminErrorToast('Unable to load event payment dashboard.');
    } finally {
      setLoading(false);
    }
  }, [days, token]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const statusRows = Object.entries(kpis?.byStatus || {}).map(([label, value]) => ({ label, value: num(value) }));
  const maxStatus = Math.max(...statusRows.map((row) => row.value), 1);
  const ticketRows = (kpis?.byTicketName || []).map((row) => ({ label: row.ticketName || 'Single price', value: num(row.count) }));
  const maxTicket = Math.max(...ticketRows.map((row) => row.value), 1);

  return (
    <div className="space-y-4">
      <EventPaymentsTabs activePath="/admin/event-payments/dashboard" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-base font-semibold">Events payment dashboard</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Ticket sales, completion, and recent event payments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Period (days)
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
            >
              {[7, 30, 90, 365].map((day) => (
                <option key={day} value={day}>{day}</option>
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
        <KpiCard icon={Wallet} label="Total payments" value={kpis?.total ?? '—'} detail={`${kpis?.completed ?? 0} completed`} />
        <KpiCard icon={TrendingUp} label="Completion rate" value={`${kpis?.completionRate ?? 0}%`} detail={`${kpis?.pending ?? 0} pending`} />
        <KpiCard icon={Coins} label="New in period" value={kpis?.newInPeriod ?? '—'} detail={`${kpis?.completedInPeriod ?? 0} completed in period`} />
        <KpiCard icon={Ticket} label="Checked in" value={kpis?.checkedIn ?? '—'} detail="Tickets scanned at the door" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="By status">
          {statusRows.map((row) => <BarRow key={row.label} label={row.label} value={row.value} max={maxStatus} />)}
          {statusRows.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">No data yet.</p> : null}
        </ChartCard>
        <ChartCard title="By ticket type">
          {ticketRows.map((row) => <BarRow key={row.label} label={row.label} value={row.value} max={maxTicket} />)}
          {ticketRows.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">No data yet.</p> : null}
        </ChartCard>
      </div>

      {(kpis?.amountByCurrency?.length ?? 0) > 0 ? (
        <div className="rounded-lg border border-border/60 bg-card p-3 shadow-sm">
          <h2 className="text-sm font-semibold">Amounts by currency</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-4 font-semibold">Currency</th>
                  <th className="pb-2 pr-4 font-semibold">Completed</th>
                  <th className="pb-2 font-semibold">Pending</th>
                </tr>
              </thead>
              <tbody>
                {kpis!.amountByCurrency.map((row) => (
                  <tr key={row.currency}>
                    <td className="py-1.5 pr-4 font-medium">{row.currency}</td>
                    <td className="py-1.5 pr-4">{formatMoney(row.completed, row.currency)}</td>
                    <td className="py-1.5">{formatMoney(row.pending, row.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/60 px-4 py-3">
          <h2 className="text-sm font-semibold">Recent payments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-semibold">Buyer</th>
                <th className="px-4 py-2 font-semibold">Event</th>
                <th className="px-4 py-2 font-semibold">Amount</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-2.5 font-medium">{row.name || '—'}</td>
                  <td className="px-4 py-2.5">{row.eventTitle || '—'}</td>
                  <td className="px-4 py-2.5">{formatMoney(row.amount, row.currency)}</td>
                  <td className="px-4 py-2.5"><Badge variant="outline" className={paymentStatusBadgeClass(row.status)}>{row.status || '—'}</Badge></td>
                  <td className="px-4 py-2.5">{formatAdminDate(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recent.length === 0 ? <p className="py-8 text-center text-xs text-muted-foreground">No recent payments.</p> : null}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, detail }: { icon: ComponentType<{ className?: string }>; label: string; value: number | string; detail: string }) {
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
