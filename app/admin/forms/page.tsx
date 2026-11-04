'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, FileSpreadsheet, FileText, HandHeart, Images, LayoutDashboard, ListChecks, RefreshCw, Search, Sparkles, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import MediaUploadProgress from '@/components/admin/MediaUploadProgress';
import PeriodFilter from '@/components/admin/PeriodFilter';
import { BreakdownCard, PeriodTiles, TrendCard, type Breakdown, type PeriodCounts, type Trend } from '@/components/admin/SubmissionStats';
import { ChartCard, BarRow, CHART_COLORS } from '@/components/admin/DashboardBits';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { AdminListPagination } from '@/components/admin/payments/AdminListPagination';
import { apiFetch, apiUrl } from '@/lib/api';
import { downloadReport, formatReportDateTime, periodLabel, periodParams, periodSlug, withParams, type Period } from '@/lib/admin-reports';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useMediaUpload } from '@/hooks/use-media-upload';
import { cn } from '@/lib/utils';

type Kind = '' | 'membership' | 'testimony' | 'prayer';
type Tab = 'dashboard' | 'submissions' | 'images';

type Submission = {
  id: string;
  kind: Exclude<Kind, ''>;
  kindLabel: string;
  source: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  city: string | null;
  country: string | null;
  category: string | null;
  message: string | null;
  data: Record<string, string>;
  status: string;
  createdAt: string;
};

type Stats = {
  counts: PeriodCounts;
  inRange: number;
  byKind: Array<{ kind: string; label: string; count: number }>;
  byStatus: Array<{ label: string; count: number }>;
  trend: Trend;
  breakdowns: Breakdown[];
};

const KINDS: Array<{ value: Kind; label: string; icon: typeof UserPlus }> = [
  { value: '', label: 'All forms', icon: ListChecks },
  { value: 'membership', label: 'Membership', icon: UserPlus },
  { value: 'testimony', label: 'Testimonies', icon: Sparkles },
  { value: 'prayer', label: 'Prayer requests', icon: HandHeart },
];

const KIND_COLORS: Record<string, string> = { membership: CHART_COLORS.primary, testimony: CHART_COLORS.green, prayer: CHART_COLORS.gold };
const STATUS_STYLES: Record<string, string> = {
  new: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  contacted: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  closed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
};
const SOURCE_LABELS: Record<string, string> = { forms: 'Forms page', livestream: 'Livestream', earlier: 'Earlier record' };

const FORM_IMAGE_ITEMS = [
  { key: 'membership-form-image', label: 'Membership Form Image', description: 'Shown beside the membership form.', fallback: '/images/our-church.JPG' },
  { key: 'testimony-form-image', label: 'Testimony Form Image', description: 'Shown beside the testimony form.', fallback: '/images/send-message-2.JPG' },
  { key: 'prayer-form-image', label: 'Prayer Request Image', description: 'Shown beside the prayer request form.', fallback: '/images/our-church.JPG' },
];

function submissionDetails(row: Submission) {
  const area = row.kind === 'membership' ? [row.city, row.country].filter(Boolean).join(', ') : row.category || '';
  return { area, contact: [row.phone, row.email].filter(Boolean).join(' · ') };
}

export default function FormsAdminPage() {
  const { token, email, password, loginError, setEmail, setPassword, handleLogin } = useAdminAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [kind, setKind] = useState<Kind>('');
  const [period, setPeriod] = useState<Period>({ preset: 'month' });
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const filters = useCallback(
    (extra: Record<string, string> = {}) => ({ ...periodParams(period), kind, status, q: query, ...extra }),
    [period, kind, status, query],
  );
  const auth = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadStats = useCallback(async () => {
    if (!token) return;
    const response = await apiFetch(withParams('/api/admin/forms/stats', { ...periodParams(period), kind }), { headers: auth() });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      adminErrorToast(data?.error || 'Unable to load form statistics.');
      return;
    }
    setStats(data);
  }, [token, period, kind, auth]);

  const loadRows = useCallback(async () => {
    if (!token) return;
    const response = await apiFetch(withParams('/api/admin/forms/submissions', filters({ page: String(page), limit: '25' })), { headers: auth() });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      adminErrorToast(data?.error || 'Unable to load submissions.');
      return;
    }
    setRows(Array.isArray(data?.submissions) ? data.submissions : []);
    setTotal(data?.total || 0);
    setPages(data?.pages || 1);
  }, [token, filters, page, auth]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadStats(), loadRows()]);
    } finally {
      setLoading(false);
    }
  }, [loadStats, loadRows]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [kind, period, status, query]);

  const updateStatus = async (row: Submission, next: string) => {
    const response = await apiFetch(`/api/admin/forms/submissions/${row.id}`, {
      method: 'PATCH',
      headers: { ...auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    if (!response.ok) {
      adminErrorToast('Unable to update the status.');
      return;
    }
    setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, status: next } : item)));
    void loadStats();
  };

  const remove = (row: Submission) => {
    confirmDeleteToast({
      title: `Delete ${row.fullName}'s ${row.kindLabel.toLowerCase()}?`,
      description: 'This removes the submission from the register.',
      onConfirm: async () => {
        const response = await apiFetch(`/api/admin/forms/submissions/${row.id}`, { method: 'DELETE', headers: auth() });
        if (!response.ok) {
          adminErrorToast('Unable to delete this submission.');
          return;
        }
        adminSuccessToast('Submission deleted.');
        await refresh();
      },
    });
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    if (!token) return;
    setExporting(true);
    try {
      const response = await apiFetch(withParams('/api/admin/forms/submissions', filters({ all: '1' })), { headers: auth() });
      const data = await response.json().catch(() => null);
      const list: Submission[] = Array.isArray(data?.submissions) ? data.submissions : [];
      if (!response.ok || list.length === 0) {
        adminErrorToast(response.ok ? 'There are no submissions in this period.' : data?.error || 'Unable to build the report.');
        return;
      }
      const kindName = KINDS.find((entry) => entry.value === kind)?.label || 'All forms';
      const counts = new Map<string, number>();
      list.forEach((row) => counts.set(row.kindLabel, (counts.get(row.kindLabel) || 0) + 1));
      await downloadReport({
        format,
        title: `PICC forms report: ${kindName}, ${periodLabel(period)}`,
        fileName: `picc-forms-${kind || 'all'}-${periodSlug(period)}`,
        columns: [
          { key: 'date', label: 'Date' },
          { key: 'kind', label: 'Form' },
          { key: 'name', label: 'Name' },
          { key: 'contact', label: 'Contact' },
          { key: 'area', label: 'Area / location' },
          { key: 'message', label: 'Details' },
          { key: 'status', label: 'Status' },
        ],
        rows: list.map((row) => {
          const details = submissionDetails(row);
          return {
            date: formatReportDateTime(row.createdAt),
            kind: row.kindLabel,
            name: row.fullName,
            contact: details.contact,
            area: details.area,
            message: row.kind === 'membership' ? [row.gender, row.data?.dateOfBirth].filter(Boolean).join(' · ') : (row.message || '').slice(0, format === 'pdf' ? 300 : 5000),
            status: row.status,
          };
        }),
        summary: [['TOTAL', list.length], ...[...counts.entries()].map(([label, count]) => [label, count] as [string, number])],
      });
    } finally {
      setExporting(false);
    }
  };

  if (!token) {
    return (
      <AdminLoginCard
        email={email}
        password={password}
        loginError={loginError}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  const kindMax = Math.max(1, ...(stats?.byKind || []).map((entry) => entry.count));
  const trendSeries = kind
    ? [{ key: kind, label: KINDS.find((entry) => entry.value === kind)?.label || kind, color: KIND_COLORS[kind] }]
    : (['membership', 'testimony', 'prayer'] as const).map((key) => ({ key, label: KINDS.find((entry) => entry.value === key)!.label, color: KIND_COLORS[key] }));

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_top_left,#4B7BA7_0%,#2D5A8C_45%,#1E3A5F_100%)] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60">Admin · Forms</p>
            <h1 className="mt-1 text-2xl font-semibold md:text-3xl">Forms register</h1>
            <p className="mt-1 max-w-xl text-sm text-white/75">
              Every membership form, testimony and prayer request from the forms page and the livestream, saved and counted.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => void exportReport('pdf')} disabled={exporting}>
              <FileText className="h-4 w-4" /> PDF report
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void exportReport('excel')} disabled={exporting}>
              <FileSpreadsheet className="h-4 w-4" /> Excel report
            </Button>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/15 hover:text-white" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh
            </Button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-1 border-t border-white/15 pt-3">
          {([
            ['dashboard', 'Dashboard', LayoutDashboard],
            ['submissions', 'Submissions', ListChecks],
            ['images', 'Form images', Images],
          ] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors', tab === value ? 'bg-white text-[#1E3A5F]' : 'bg-white/10 text-white hover:bg-white/20')}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {tab !== 'images' ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1">
            {KINDS.map((entry) => (
              <button
                key={entry.value || 'all'}
                type="button"
                onClick={() => setKind(entry.value)}
                className={cn('inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium', kind === entry.value ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-muted')}
              >
                <entry.icon className="h-3.5 w-3.5" /> {entry.label}
              </button>
            ))}
          </div>
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>
      ) : null}

      {tab === 'dashboard' ? (
        <div className="space-y-4">
          <PeriodTiles counts={stats?.counts} inRange={stats?.inRange} rangeLabel={periodLabel(period)} />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TrendCard title={`Submissions, ${periodLabel(period)}`} trend={stats?.trend} series={trendSeries} />
            </div>
            <ChartCard title="By form">
              {(stats?.byKind || []).map((entry) => (
                <BarRow key={entry.kind} label={entry.label} value={entry.count} max={kindMax} />
              ))}
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
                {(stats?.byStatus || []).map((entry) => (
                  <div key={entry.label}>
                    <p className="text-lg font-bold">{entry.count}</p>
                    <p className="text-[11px] capitalize text-muted-foreground">{entry.label}</p>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(stats?.breakdowns || []).map((breakdown) => (
              <BreakdownCard
                key={breakdown.key}
                breakdown={breakdown.key === 'source'
                  ? { ...breakdown, values: breakdown.values.map((entry) => ({ ...entry, label: SOURCE_LABELS[entry.label] || entry.label })) }
                  : breakdown}
              />
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'submissions' ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <form
              className="relative flex-1"
              onSubmit={(event) => {
                event.preventDefault();
                setQuery(search.trim());
              }}
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, phone, email or text, then press Enter"
                className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm"
              />
            </form>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
              <option value="">Any status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground">{total.toLocaleString()} submission{total === 1 ? '' : 's'} · {periodLabel(period)}</p>

          <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
            {rows.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">No submissions match these filters.</p>
            ) : rows.map((row) => {
              const details = submissionDetails(row);
              const open = openId === row.id;
              return (
                <div key={row.id} className="border-b border-border/60 last:border-b-0">
                  <button type="button" onClick={() => setOpenId(open ? null : row.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40">
                    <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: KIND_COLORS[row.kind] }} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{row.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.kindLabel} · {details.area || details.contact || SOURCE_LABELS[row.source] || row.source}</p>
                    </div>
                    <span className={cn('hidden rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize sm:inline', STATUS_STYLES[row.status])}>{row.status}</span>
                    <span className="hidden w-36 text-right text-xs text-muted-foreground md:inline">{formatReportDateTime(row.createdAt)}</span>
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
                  </button>
                  {open ? (
                    <div className="grid gap-4 bg-muted/20 px-4 py-4 text-sm md:grid-cols-[1fr_220px]">
                      <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                        {[
                          ['Phone', row.phone],
                          ['Email', row.email],
                          ['Gender', row.gender],
                          ['City', row.city],
                          ['Country', row.country],
                          [row.kind === 'prayer' ? 'Area of need' : 'Area', row.category],
                          ['Born again', row.data?.bornAgain],
                          ['Sent from', SOURCE_LABELS[row.source] || row.source],
                        ].filter(([, value]) => value).map(([label, value]) => (
                          <div key={label}>
                            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                        {row.message ? (
                          <div className="sm:col-span-2">
                            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Details</dt>
                            <dd className="whitespace-pre-wrap">{row.message}</dd>
                          </div>
                        ) : null}
                      </dl>
                      <div className="space-y-2">
                        <label className="grid gap-1 text-xs">
                          <span className="text-muted-foreground">Status</span>
                          <select value={row.status} onChange={(event) => void updateStatus(row, event.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="closed">Closed</option>
                          </select>
                        </label>
                        <Button variant="outline" size="sm" className="w-full text-destructive" onClick={() => remove(row)}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {pages > 1 ? <AdminListPagination skip={(page - 1) * 25} take={25} total={total} onPageChange={(skip) => setPage(Math.floor(skip / 25) + 1)} disabled={loading} /> : null}
        </div>
      ) : null}

      {tab === 'images' ? <FormImagesEditor token={token} /> : null}
    </div>
  );
}

function FormImagesEditor({ token }: { token: string }) {
  const [status, setStatus] = useState('');
  const [formImages, setFormImages] = useState<Record<string, string>>({});
  const [uploadNames, setUploadNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { runUpload, progress, uploading } = useMediaUpload();
  const normalizeImageUrl = (value: string) => (value.startsWith('http') ? value : apiUrl(value));

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      const entries = await Promise.all(
        FORM_IMAGE_ITEMS.map(async (item) => {
          try {
            const response = await apiFetch(`/api/site-content/${item.key}`);
            if (!response.ok) return [item.key, item.fallback] as const;
            const data = await response.json();
            return [item.key, data.imageUrl ? normalizeImageUrl(data.imageUrl) : item.fallback] as const;
          } catch {
            return [item.key, item.fallback] as const;
          }
        }),
      );
      setFormImages(Object.fromEntries(entries));
      setLoading(false);
    };
    void fetchImages();
  }, []);

  const uploadImage = async (file: File) => {
    if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
      setStatus('Your image file size is too big. Please compress it first before re uploading. Only pictures less than 1MB are allowed.');
      return null;
    }
    try {
      return normalizeImageUrl(await runUpload(file, 'page-images'));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Image upload failed.');
      return null;
    }
  };

  const saveImage = async (key: string) => {
    setStatus('');
    try {
      const response = await apiFetch(`/api/site-content/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageUrl: formImages[key] || null }),
      });
      setStatus(response.ok ? 'Form image updated successfully.' : 'Unable to save form image.');
    } catch {
      setStatus('Unable to save form image.');
    }
  };

  return (
    <div className="space-y-4">
      {status && <p className="text-sm text-foreground/70">{status}</p>}
      <MediaUploadProgress uploading={uploading} progress={progress} />
      <div className="grid gap-4 lg:grid-cols-3">
        {FORM_IMAGE_ITEMS.map((item) => (
          <div key={item.key} className="space-y-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <div className="h-44 overflow-hidden rounded-lg border border-border/60 bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={formImages[item.key] || item.fallback} alt={item.label} className="h-full w-full object-cover" />
            </div>
            <input
              type="file"
              accept="image/*,.heic,.heif,.avif"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const url = await uploadImage(file);
                if (!url) return;
                setFormImages((prev) => ({ ...prev, [item.key]: url }));
                setUploadNames((prev) => ({ ...prev, [item.key]: file.name }));
              }}
              className="block w-full text-xs text-foreground/70 file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
            />
            {uploadNames[item.key] && <p className="text-xs text-muted-foreground">Selected: {uploadNames[item.key]}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void saveImage(item.key)} disabled={loading}>Save image</Button>
              <Button size="sm" variant="outline" onClick={() => setFormImages((prev) => ({ ...prev, [item.key]: '' }))}>Use default</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
