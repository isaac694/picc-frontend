'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Baby, CalendarPlus, FileSpreadsheet, RefreshCw, UserCheck, UserPlus, Users, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminErrorToast } from '@/components/admin/admin-toast';
import { BarRow, CHART_COLORS, ChartCard, KpiCard, TrendChart, shortMonth } from '@/components/admin/DashboardBits';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiFetch } from '@/lib/api';
import { withParams } from '@/lib/admin-reports';
import { MEMBER_GROUPS, MEMBER_STATUS_LABELS } from '@/lib/membership';
import { cn } from '@/lib/utils';

type GroupCount = { group: string; total: number; active: number };
type ServiceGroup = { label: string; count: number; groups: Record<string, number> };

type Stats = {
  total: number;
  registerTotal: number;
  byStatus: Record<string, number>;
  newThisWeek: number;
  newThisMonth: number;
  newThisYear: number;
  monthly: Array<{ month: string; joined: number }>;
  breakdowns: Array<{ key: string; label: string; values: Array<{ label: string; count: number }> }>;
  groups: GroupCount[];
  groupRules: { childMaxAge: number; youthMaxAge: number };
  serviceGroupField: { key: string; label: string } | null;
  serviceGroups: ServiceGroup[];
  serviceGroupOptions: string[];
  fieldCount: number;
};

const GROUP_STYLES: Record<string, { tone: string; bar: string; icon: typeof Users }> = {
  Children: { tone: 'from-amber-50 to-amber-100 text-amber-950 dark:from-amber-950/40 dark:to-amber-900/30 dark:text-amber-100', bar: '#d97706', icon: Baby },
  Youth: { tone: 'from-emerald-50 to-emerald-100 text-emerald-950 dark:from-emerald-950/40 dark:to-emerald-900/30 dark:text-emerald-100', bar: '#16a34a', icon: UsersRound },
  Men: { tone: 'from-sky-50 to-sky-100 text-sky-950 dark:from-sky-950/40 dark:to-sky-900/30 dark:text-sky-100', bar: '#1e3a5f', icon: Users },
  Women: { tone: 'from-rose-50 to-rose-100 text-rose-950 dark:from-rose-950/40 dark:to-rose-900/30 dark:text-rose-100', bar: '#be185d', icon: Users },
  'Not grouped': { tone: 'from-muted to-muted text-foreground', bar: '#94a3b8', icon: Users },
};

export default function MembershipDashboardPage() {
  const { token } = useAdminAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState('');
  const [serviceGroup, setServiceGroup] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiFetch(withParams('/api/admin/membership/stats', { group, serviceGroup }), { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        adminErrorToast(data?.error || 'Unable to load membership statistics.');
        return;
      }
      setStats(data);
    } finally {
      setLoading(false);
    }
  }, [token, group, serviceGroup]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportFiltered = async () => {
    if (!token) return;
    const response = await apiFetch(withParams('/api/admin/membership/export', { group, serviceGroup }), { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      adminErrorToast('Unable to export members.');
      return;
    }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = `picc-members${group ? `-${group.toLowerCase()}` : ''}${serviceGroup ? `-${serviceGroup.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : ''}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const statusRows = Object.entries(stats?.byStatus || {}).map(([status, count]) => ({ label: MEMBER_STATUS_LABELS[status] || status, value: count }));
  const maxStatus = Math.max(1, ...statusRows.map((row) => row.value));
  const active = stats?.byStatus?.active ?? 0;
  const maxService = Math.max(1, ...(stats?.serviceGroups || []).map((entry) => entry.count));
  const filterLabel = [group, serviceGroup].filter(Boolean).join(' · ');

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/membership" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Membership register
          </Link>
          <h1 className="text-base font-semibold">Membership dashboard</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {filterLabel ? `Showing ${filterLabel}: ${stats?.total ?? 0} of ${stats?.registerTotal ?? 0} members.` : 'Statistics from the membership register.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void exportFiltered()}>
            <FileSpreadsheet className="h-4 w-4" /> Export these members
          </Button>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Group">
          {['', ...MEMBER_GROUPS].map((entry) => (
            <button
              key={entry || 'all'}
              type="button"
              role="tab"
              aria-selected={group === entry}
              onClick={() => setGroup(entry)}
              className={cn('rounded-full border px-3 py-1 text-xs font-medium', group === entry ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground/70 hover:bg-muted')}
            >
              {entry || 'Everyone'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          {stats?.serviceGroupField?.label || 'Service group'}
          <select value={serviceGroup} onChange={(event) => setServiceGroup(event.target.value)} className="h-8 min-w-44 rounded-md border border-border bg-background px-2 text-xs text-foreground">
            <option value="">All service groups</option>
            {(stats?.serviceGroupOptions || []).map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(stats?.groups || []).filter((entry) => entry.group !== 'Not grouped').map((entry) => {
          const style = GROUP_STYLES[entry.group] || GROUP_STYLES['Not grouped'];
          return (
            <button
              key={entry.group}
              type="button"
              onClick={() => setGroup(group === entry.group ? '' : entry.group)}
              className={cn('rounded-xl bg-gradient-to-br p-4 text-left shadow-sm ring-primary transition', style.tone, group === entry.group && 'ring-2')}
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide opacity-80">
                {entry.group}
                <style.icon className="h-4 w-4" />
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums">{entry.total.toLocaleString()}</p>
              <p className="text-xs opacity-75">{entry.active.toLocaleString()} active</p>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Groups use the member&apos;s &ldquo;member_group&rdquo; answer when one is recorded; otherwise children are {stats?.groupRules.childMaxAge ?? 12} and under,
        youth up to {stats?.groupRules.youthMaxAge ?? 35}, and older members are counted as men or women by gender.
        {(stats?.groups || []).find((entry) => entry.group === 'Not grouped')?.total
          ? ` ${(stats?.groups || []).find((entry) => entry.group === 'Not grouped')!.total} members have no date of birth or gender, so they are not grouped.`
          : ''}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Users} label="Members shown" value={stats?.total ?? '—'} detail={`${stats?.registerTotal ?? 0} on the register`} />
        <KpiCard icon={UserCheck} label="Active members" value={active} detail={stats?.total ? `${Math.round((active / stats.total) * 100)}% of those shown` : undefined} />
        <KpiCard icon={UserPlus} label="Added this week / month" value={`${stats?.newThisWeek ?? '—'} / ${stats?.newThisMonth ?? '—'}`} />
        <KpiCard icon={CalendarPlus} label="Added this year" value={stats?.newThisYear ?? '—'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="New members per month (last 12 months)">
            <TrendChart data={stats?.monthly || []} xKey="month" formatX={shortMonth} series={[{ key: 'joined', label: 'Joined', color: CHART_COLORS.primary }]} />
          </ChartCard>
        </div>
        <ChartCard title="By status">
          {statusRows.map((row) => <BarRow key={row.label} label={row.label} value={row.value} max={maxStatus} />)}
        </ChartCard>
      </div>

      <ChartCard title={`Members by ${(stats?.serviceGroupField?.label || 'service group').toLowerCase()}`}>
        {!stats?.serviceGroupField ? (
          <p className="text-xs text-muted-foreground">Add a field named &ldquo;Department / ministry&rdquo; or &ldquo;Service group&rdquo; in Membership fields to see where members serve.</p>
        ) : stats.serviceGroups.length === 0 ? (
          <p className="text-xs text-muted-foreground">No members have a service group recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {stats.serviceGroups.map((entry) => (
              <button key={entry.label} type="button" onClick={() => setServiceGroup(serviceGroup === entry.label ? '' : entry.label)} className="block w-full text-left">
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className={cn('truncate', serviceGroup === entry.label ? 'font-semibold text-primary' : 'text-muted-foreground')}>{entry.label}</span>
                  <span className="font-semibold">{entry.count.toLocaleString()}</span>
                </div>
                {/* One segment per group, so each service group shows its children, youth, men and women. */}
                <div className="flex h-2.5 overflow-hidden rounded-full bg-muted" style={{ width: `${(entry.count / maxService) * 100}%` }}>
                  {Object.entries(entry.groups).map(([name, count]) => (
                    <div key={name} title={`${name}: ${count}`} style={{ width: `${(count / entry.count) * 100}%`, background: (GROUP_STYLES[name] || GROUP_STYLES['Not grouped']).bar }} />
                  ))}
                </div>
              </button>
            ))}
            <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-muted-foreground">
              {Object.entries(GROUP_STYLES).map(([name, style]) => (
                <span key={name} className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: style.bar }} />{name}</span>
              ))}
            </div>
          </div>
        )}
      </ChartCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
