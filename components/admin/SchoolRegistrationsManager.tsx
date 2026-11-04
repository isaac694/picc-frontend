'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, FileSpreadsheet, FileText, GraduationCap, RefreshCw, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PeriodFilter from '@/components/admin/PeriodFilter';
import { BreakdownCard, PeriodTiles, TrendCard, type Breakdown, type PeriodCounts, type Trend } from '@/components/admin/SubmissionStats';
import { CHART_COLORS } from '@/components/admin/DashboardBits';
import { AdminListPagination } from '@/components/admin/payments/AdminListPagination';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { apiFetch } from '@/lib/api';
import { downloadReport, formatReportDateTime, periodLabel, periodParams, periodSlug, withParams, type Period } from '@/lib/admin-reports';
import { cn } from '@/lib/utils';

type Registration = {
  id: string;
  intakeId: string | null;
  intakeLabel: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  program: string | null;
  status: string;
  data: Record<string, string>;
  createdAt: string;
};

type IntakeCount = { intakeId: string; label: string; opensOn: string | null; closesOn: string | null; isOpen: boolean; count: number };

type Stats = {
  counts: PeriodCounts;
  inRange: number;
  byIntake: IntakeCount[];
  byStatus: Array<{ label: string; count: number }>;
  trend: Trend;
  breakdowns: Breakdown[];
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  reviewed: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  accepted: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
};
const STATUSES = ['pending', 'reviewed', 'accepted', 'rejected'];
// Fields already shown in their own columns.
const SHOWN_KEYS = new Set(['firstName', 'lastName', 'email', 'phone', 'gender', 'intakeId', 'intakeLabel']);
const PAGE_SIZE = 25;

const labelFor = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
const shortDate = (value: string | null) => (value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/** Applications for one school, filed under the intake (cohort) the applicant chose. */
export default function SchoolRegistrationsManager({ token, schoolKey, schoolName }: { token: string; schoolKey: string; schoolName: string }) {
  const [intakeId, setIntakeId] = useState('');
  const [period, setPeriod] = useState<Period>({ preset: 'all' });
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const base = `/api/admin/schools/${schoolKey}/registrations`;
  const headers = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const listParams = useCallback(
    (extra: Record<string, string> = {}) => ({ ...periodParams(period), intakeId, status, q: query, ...extra }),
    [period, intakeId, status, query],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsResponse, listResponse] = await Promise.all([
        apiFetch(withParams(`${base}/stats`, { ...periodParams(period), intakeId }), { headers: headers() }),
        apiFetch(withParams(base, listParams({ page: String(page), limit: String(PAGE_SIZE) })), { headers: headers() }),
      ]);
      const statsData = await statsResponse.json().catch(() => null);
      const listData = await listResponse.json().catch(() => null);
      if (!statsResponse.ok || !listResponse.ok) {
        adminErrorToast(statsData?.error || listData?.error || 'Unable to load registrations.');
        return;
      }
      setStats(statsData);
      setRows(Array.isArray(listData?.registrations) ? listData.registrations : []);
      setTotal(listData?.total || 0);
    } finally {
      setLoading(false);
    }
  }, [base, period, intakeId, listParams, page, headers]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [intakeId, period, status, query]);

  const update = async (row: Registration, body: Record<string, string | null>) => {
    const response = await apiFetch(`${base}/${row.id}`, {
      method: 'PATCH',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      adminErrorToast(data?.error || 'Unable to update this registration.');
      return;
    }
    setRows((prev) => prev.map((item) => (item.id === row.id ? data.registration : item)));
    void load();
  };

  const remove = (row: Registration) => {
    confirmDeleteToast({
      title: `Delete ${row.name}'s application?`,
      description: 'This removes the application from the register.',
      onConfirm: async () => {
        const response = await apiFetch(`${base}/${row.id}`, { method: 'DELETE', headers: headers() });
        if (!response.ok) {
          adminErrorToast('Unable to delete this application.');
          return;
        }
        adminSuccessToast('Application deleted.');
        await load();
      },
    });
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    setExporting(true);
    try {
      const response = await apiFetch(withParams(base, listParams({ all: '1' })), { headers: headers() });
      const data = await response.json().catch(() => null);
      const list: Registration[] = Array.isArray(data?.registrations) ? data.registrations : [];
      if (!response.ok || list.length === 0) {
        adminErrorToast(response.ok ? 'There are no registrations to export.' : data?.error || 'Unable to build the report.');
        return;
      }
      const cohort = stats?.byIntake.find((entry) => entry.intakeId === intakeId)?.label || 'All intakes';
      const extraKeys = [...new Set(list.flatMap((row) => Object.keys(row.data || {})))].filter((key) => !SHOWN_KEYS.has(key));
      // Excel gets every answer; the PDF keeps to the columns that fit on a page.
      const columns = [
        { key: 'date', label: 'Date' },
        { key: 'name', label: 'Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'gender', label: 'Gender' },
        { key: 'intake', label: 'Intake' },
        { key: 'program', label: 'Programme' },
        { key: 'status', label: 'Status' },
        ...(format === 'excel' ? extraKeys.map((key) => ({ key: `data.${key}`, label: labelFor(key) })) : []),
      ];
      const counts = new Map<string, number>();
      list.forEach((row) => counts.set(row.intakeLabel || 'No intake', (counts.get(row.intakeLabel || 'No intake') || 0) + 1));
      await downloadReport({
        format,
        title: `${schoolName} registrations: ${cohort}, ${periodLabel(period)}`,
        fileName: `${schoolKey}-registrations-${periodSlug(period)}`,
        columns,
        rows: list.map((row) => ({
          date: formatReportDateTime(row.createdAt),
          name: row.name,
          phone: row.phone || '',
          email: row.email || '',
          gender: row.gender || '',
          intake: row.intakeLabel || '',
          program: row.program || '',
          status: row.status,
          ...Object.fromEntries(extraKeys.map((key) => [`data.${key}`, row.data?.[key] || ''])),
        })),
        summary: [['TOTAL', list.length], ...[...counts.entries()].map(([label, count]) => [label, count] as [string, number])],
      });
    } finally {
      setExporting(false);
    }
  };

  const intakes = stats?.byIntake || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Registrations by intake</h2>
          <p className="text-sm text-muted-foreground">Every application from the {schoolName} form, filed under the intake the applicant chose.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void exportReport('pdf')} disabled={exporting}><FileText className="h-4 w-4" /> PDF</Button>
          <Button size="sm" variant="outline" onClick={() => void exportReport('excel')} disabled={exporting}><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh</Button>
        </div>
      </div>

      {/* Cohort folders */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => setIntakeId('')}
          className={cn('rounded-xl border p-3 text-left transition-colors', intakeId === '' ? 'border-primary bg-primary text-primary-foreground' : 'border-border/60 bg-card hover:bg-muted/50')}
        >
          <p className="text-xs font-medium opacity-80">All intakes</p>
          <p className="mt-1 text-xl font-bold">{intakes.reduce((sum, entry) => sum + entry.count, 0)}</p>
        </button>
        {intakes.map((intake) => (
          <button
            key={intake.intakeId}
            type="button"
            onClick={() => setIntakeId(intake.intakeId)}
            className={cn('rounded-xl border p-3 text-left transition-colors', intakeId === intake.intakeId ? 'border-primary bg-primary text-primary-foreground' : 'border-border/60 bg-card hover:bg-muted/50')}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="flex min-w-0 items-center gap-1.5 truncate text-xs font-medium opacity-90"><GraduationCap className="h-3.5 w-3.5 shrink-0" />{intake.label}</p>
              {intake.isOpen ? <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Open</span> : null}
            </div>
            <p className="mt-1 text-xl font-bold">{intake.count}</p>
            {intake.opensOn || intake.closesOn ? (
              <p className="text-[11px] opacity-70">{shortDate(intake.opensOn)}{intake.closesOn ? ` – ${shortDate(intake.closesOn)}` : ''}</p>
            ) : null}
          </button>
        ))}
      </div>

      <PeriodFilter value={period} onChange={setPeriod} className="rounded-xl border border-border/60 bg-card p-3" />
      <PeriodTiles counts={stats?.counts} inRange={stats?.inRange} rangeLabel={periodLabel(period)} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendCard title="Applications over time" trend={stats?.trend} series={[{ key: 'total', label: 'Applications', color: CHART_COLORS.primary }]} />
        </div>
        <BreakdownCard breakdown={{ key: 'status', label: 'By status', values: (stats?.byStatus || []).map((entry) => ({ label: labelFor(entry.label), count: entry.count })) }} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(stats?.breakdowns || []).map((breakdown) => <BreakdownCard key={breakdown.key} breakdown={breakdown} />)}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <form className="relative flex-1" onSubmit={(event) => { event.preventDefault(); setQuery(search.trim()); }}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone or email, then press Enter" className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm" />
        </form>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
          <option value="">Any status</option>
          {STATUSES.map((entry) => <option key={entry} value={entry}>{labelFor(entry)}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        {rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">No applications match these filters.</p>
        ) : rows.map((row) => {
          const open = openId === row.id;
          return (
            <div key={row.id} className="border-b border-border/60 last:border-b-0">
              <button type="button" onClick={() => setOpenId(open ? null : row.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{row.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{[row.intakeLabel || 'No intake', row.program, row.phone].filter(Boolean).join(' · ')}</p>
                </div>
                <span className={cn('hidden rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize sm:inline', STATUS_STYLES[row.status])}>{row.status}</span>
                <span className="hidden w-36 text-right text-xs text-muted-foreground md:inline">{formatReportDateTime(row.createdAt)}</span>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
              </button>
              {open ? (
                <div className="grid gap-4 bg-muted/20 px-4 py-4 text-sm md:grid-cols-[1fr_240px]">
                  <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                    {[['Phone', row.phone], ['Email', row.email], ['Gender', row.gender], ...Object.entries(row.data || {}).filter(([key]) => !SHOWN_KEYS.has(key)).map(([key, value]) => [labelFor(key), value])]
                      .filter(([, value]) => value)
                      .map(([label, value]) => (
                        <div key={label}>
                          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
                          <dd className="break-words">{value}</dd>
                        </div>
                      ))}
                  </dl>
                  <div className="space-y-2">
                    <label className="grid gap-1 text-xs">
                      <span className="text-muted-foreground">Status</span>
                      <select value={row.status} onChange={(event) => void update(row, { status: event.target.value })} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
                        {STATUSES.map((entry) => <option key={entry} value={entry}>{labelFor(entry)}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs">
                      <span className="text-muted-foreground">Intake</span>
                      <select value={row.intakeId || ''} onChange={(event) => void update(row, { intakeId: event.target.value || null })} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
                        <option value="">No intake</option>
                        {intakes.filter((entry) => entry.intakeId !== 'none').map((entry) => <option key={entry.intakeId} value={entry.intakeId}>{entry.label}</option>)}
                      </select>
                    </label>
                    <Button variant="outline" size="sm" className="w-full text-destructive" onClick={() => remove(row)}><Trash2 className="h-4 w-4" /> Delete</Button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {total > PAGE_SIZE ? (
        <AdminListPagination skip={(page - 1) * PAGE_SIZE} take={PAGE_SIZE} total={total} onPageChange={(skip) => setPage(Math.floor(skip / PAGE_SIZE) + 1)} disabled={loading} />
      ) : null}
    </div>
  );
}
