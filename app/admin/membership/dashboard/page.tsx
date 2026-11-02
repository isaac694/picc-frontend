'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CalendarPlus, RefreshCw, UserCheck, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminErrorToast } from '@/components/admin/admin-toast';
import { BarRow, CHART_COLORS, ChartCard, KpiCard, TrendChart, shortMonth } from '@/components/admin/DashboardBits';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiFetch } from '@/lib/api';
import { MEMBER_STATUS_LABELS } from '@/lib/membership';

type Stats = {
  total: number;
  byStatus: Record<string, number>;
  newThisMonth: number;
  newThisYear: number;
  monthly: Array<{ month: string; joined: number }>;
  breakdowns: Array<{ key: string; label: string; values: Array<{ label: string; count: number }> }>;
  fieldCount: number;
};

export default function MembershipDashboardPage() {
  const { token } = useAdminAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiFetch('/api/admin/membership/stats', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        adminErrorToast(data?.error || 'Unable to load membership statistics.');
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

  const statusRows = Object.entries(stats?.byStatus || {}).map(([status, count]) => ({ label: MEMBER_STATUS_LABELS[status] || status, value: count }));
  const maxStatus = Math.max(1, ...statusRows.map((row) => row.value));
  const active = stats?.byStatus?.active ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/membership" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Membership register
          </Link>
          <h1 className="text-base font-semibold">Membership dashboard</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Statistics from the membership register. Dropdown and yes/no fields are charted below.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Users} label="Members on record" value={stats?.total ?? '—'} detail={`${stats?.fieldCount ?? 0} fields recorded`} />
        <KpiCard icon={UserCheck} label="Active members" value={active} detail={stats?.total ? `${Math.round((active / stats.total) * 100)}% of the register` : undefined} />
        <KpiCard icon={UserPlus} label="Added this month" value={stats?.newThisMonth ?? '—'} />
        <KpiCard icon={CalendarPlus} label="Added this year" value={stats?.newThisYear ?? '—'} />
      </div>

      <ChartCard title="New members per month (last 12 months)">
        <TrendChart data={stats?.monthly || []} xKey="month" formatX={shortMonth} series={[{ key: 'joined', label: 'Joined', color: CHART_COLORS.primary }]} />
      </ChartCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ChartCard title="By status">
          {statusRows.map((row) => <BarRow key={row.label} label={row.label} value={row.value} max={maxStatus} />)}
        </ChartCard>
        {(stats?.breakdowns || []).map((breakdown) => {
          const max = Math.max(1, ...breakdown.values.map((entry) => entry.count));
          const sum = breakdown.values.reduce((total, entry) => total + entry.count, 0);
          return (
            <ChartCard key={breakdown.key} title={breakdown.label}>
              {breakdown.values.map((entry) => (
                <BarRow
                  key={entry.label}
                  label={entry.label}
                  value={entry.count}
                  max={max}
                  display={`${entry.count.toLocaleString()}${sum ? ` (${Math.round((entry.count / sum) * 100)}%)` : ''}`}
                />
              ))}
            </ChartCard>
          );
        })}
      </div>
    </div>
  );
}
