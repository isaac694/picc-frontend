'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, Headphones, Mic2, RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminErrorToast } from '@/components/admin/admin-toast';
import { BarRow, CHART_COLORS, ChartCard, KpiCard, TrendChart, shortDay } from '@/components/admin/DashboardBits';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiFetch } from '@/lib/api';
import { formatSermonDate } from '@/lib/sermons';

// Everything on this page counts people who watched or listened on the PICC website only.
// YouTube's own view counts are deliberately left out.

type SermonStatRow = {
  id: string;
  title: string;
  date: string;
  speaker: string;
  isActive: boolean;
  siteViews: number;
  siteListens: number;
};

type Stats = {
  totals: {
    sermons: number;
    active: number;
    withVideo: number;
    withAudio: number;
    siteViews: number;
    siteListens: number;
    periodWatch: number;
    periodListen: number;
  };
  days: number;
  daily: Array<{ date: string; watch: number; listen: number }>;
  sermons: SermonStatRow[];
};

export default function SermonAnalyticsPage() {
  const { token } = useAdminAuth();
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiFetch(`/api/admin/sermons/stats?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        adminErrorToast(data?.error || 'Unable to load sermon analytics.');
        return;
      }
      setStats(data);
    } finally {
      setLoading(false);
    }
  }, [token, days]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = stats?.totals;
  const rows = useMemo(
    () =>
      (stats?.sermons || [])
        .map((row) => ({ ...row, websiteTotal: row.siteViews + row.siteListens }))
        .sort((a, b) => b.websiteTotal - a.websiteTotal),
    [stats],
  );
  const topWatched = useMemo(() => [...rows].sort((a, b) => b.siteViews - a.siteViews).filter((row) => row.siteViews > 0).slice(0, 10), [rows]);
  const topListened = useMemo(() => [...rows].sort((a, b) => b.siteListens - a.siteListens).filter((row) => row.siteListens > 0).slice(0, 10), [rows]);
  const maxWatched = Math.max(1, ...topWatched.map((row) => row.siteViews));
  const maxListened = Math.max(1, ...topListened.map((row) => row.siteListens));
  const websiteTotal = (totals?.siteViews ?? 0) + (totals?.siteListens ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/sermons" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Sermons
          </Link>
          <h1 className="text-base font-semibold">Sermon analytics</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            People who watched or listened to sermons on the PICC website. YouTube views are not included.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Period (days)
            <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground">
              {[7, 30, 90, 365].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Eye} label="Watched on the website" value={totals?.siteViews ?? '—'} detail={`${totals?.periodWatch ?? 0} in the last ${days} days`} />
        <KpiCard icon={Headphones} label="Listened on the website" value={totals?.siteListens ?? '—'} detail={`${totals?.periodListen ?? 0} in the last ${days} days`} />
        <KpiCard icon={Users} label="Total on the website" value={totals ? websiteTotal : '—'} detail="Watches plus listens" />
        <KpiCard icon={Mic2} label="Sermons" value={totals?.sermons ?? '—'} detail={`${totals?.active ?? 0} live · ${totals?.withAudio ?? 0} with audio`} />
      </div>

      <ChartCard title={`Watching and listening on the website, last ${days} days`}>
        <TrendChart
          data={stats?.daily || []}
          xKey="date"
          formatX={shortDay}
          series={[
            { key: 'watch', label: 'Watches', color: CHART_COLORS.primary },
            { key: 'listen', label: 'Listens', color: CHART_COLORS.gold },
          ]}
        />
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Most watched on the website">
          {topWatched.map((row) => <BarRow key={row.id} label={row.title} value={row.siteViews} max={maxWatched} />)}
          {stats && !topWatched.length ? <p className="text-xs text-muted-foreground">No website watches recorded yet.</p> : null}
        </ChartCard>
        <ChartCard title="Most listened on the website">
          {topListened.map((row) => <BarRow key={row.id} label={row.title} value={row.siteListens} max={maxListened} />)}
          {stats && !topListened.length ? <p className="text-xs text-muted-foreground">No website listens recorded yet.</p> : null}
        </ChartCard>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/60 px-4 py-3">
          <h2 className="text-sm font-semibold">Every sermon</h2>
        </div>
        <div className="max-h-[520px] overflow-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="sticky top-0 bg-muted text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Sermon</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 text-right font-medium">Website watches</th>
                <th className="px-4 py-2 text-right font-medium">Website listens</th>
                <th className="px-4 py-2 text-right font-medium">Website total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={`border-t border-border/60 ${row.isActive ? '' : 'text-muted-foreground'}`}>
                  <td className="px-4 py-2.5 font-medium">{row.title}{row.isActive ? '' : ' (deactivated)'}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">{formatSermonDate(row.date, 'short')}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{row.siteViews.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{row.siteListens.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{row.websiteTotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
