'use client';

import type { ComponentType } from 'react';
import { CalendarCheck, CalendarDays, CalendarRange, Inbox, Sun } from 'lucide-react';
import { BarRow, ChartCard, TrendChart, shortDay, shortMonth, type TrendSeries } from '@/components/admin/DashboardBits';
import { cn } from '@/lib/utils';

export type PeriodCounts = { total: number; today: number; thisWeek: number; thisMonth: number; thisYear: number };
export type Breakdown = { key: string; label: string; values: Array<{ label: string; count: number }> };
export type Trend = { granularity: 'day' | 'month'; points: Array<Record<string, string | number>> };

const TILES: Array<{ key: keyof PeriodCounts; label: string; icon: ComponentType<{ className?: string }>; tone: string }> = [
  { key: 'total', label: 'All time', icon: Inbox, tone: 'from-[#1e3a5f] to-[#2d5a8c] text-white' },
  { key: 'today', label: 'Today', icon: Sun, tone: 'from-amber-50 to-amber-100 text-amber-950 dark:from-amber-950/40 dark:to-amber-900/30 dark:text-amber-100' },
  { key: 'thisWeek', label: 'This week', icon: CalendarDays, tone: 'from-emerald-50 to-emerald-100 text-emerald-950 dark:from-emerald-950/40 dark:to-emerald-900/30 dark:text-emerald-100' },
  { key: 'thisMonth', label: 'This month', icon: CalendarRange, tone: 'from-sky-50 to-sky-100 text-sky-950 dark:from-sky-950/40 dark:to-sky-900/30 dark:text-sky-100' },
  { key: 'thisYear', label: 'This year', icon: CalendarCheck, tone: 'from-violet-50 to-violet-100 text-violet-950 dark:from-violet-950/40 dark:to-violet-900/30 dark:text-violet-100' },
];

/** Totals for the fixed periods, followed by the count for the period the admin picked. */
export function PeriodTiles({ counts, inRange, rangeLabel }: { counts?: PeriodCounts | null; inRange?: number; rangeLabel: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {TILES.map((tile) => (
        <div key={tile.key} className={cn('rounded-xl bg-gradient-to-br p-3 shadow-sm', tile.tone)}>
          <div className="flex items-center justify-between text-xs font-medium opacity-80">
            {tile.label}
            <tile.icon className="h-3.5 w-3.5" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">{counts ? counts[tile.key].toLocaleString() : '—'}</p>
        </div>
      ))}
      <div className="rounded-xl border-2 border-dashed border-primary/40 p-3">
        <p className="text-xs font-medium text-muted-foreground">Selected: {rangeLabel}</p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-primary">{inRange?.toLocaleString() ?? '—'}</p>
      </div>
    </div>
  );
}

export function TrendCard({ title, trend, series }: { title: string; trend?: Trend | null; series: TrendSeries[] }) {
  return (
    <ChartCard title={title} action={<span className="text-[11px] text-muted-foreground">{trend?.granularity === 'day' ? 'Per day' : 'Per month'}</span>}>
      <TrendChart
        data={trend?.points || []}
        xKey="period"
        formatX={trend?.granularity === 'day' ? shortDay : shortMonth}
        series={series}
      />
    </ChartCard>
  );
}

export function BreakdownCard({ breakdown }: { breakdown: Breakdown }) {
  const max = Math.max(1, ...breakdown.values.map((entry) => entry.count));
  const sum = breakdown.values.reduce((total, entry) => total + entry.count, 0);
  return (
    <ChartCard title={breakdown.label}>
      {breakdown.values.length === 0 ? <p className="text-xs text-muted-foreground">Nothing recorded yet.</p> : null}
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
}
