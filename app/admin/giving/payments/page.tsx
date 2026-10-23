'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileText, Printer, RefreshCw, Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { adminErrorToast } from '@/components/admin/admin-toast';
import { GivingPaymentsTabs } from '@/components/admin/payments/PaymentsSectionTabs';
import { AdminListPagination } from '@/components/admin/payments/AdminListPagination';
import { buildAdminQuery, formatAdminDate, formatMoney, paymentStatusBadgeClass } from '@/lib/admin-payments';
import { downloadGivingReportPdf, printGivingReport, type GivingReport } from '@/lib/giving-report';

type GivingRow = {
  id: string;
  amount?: number;
  currency?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  status?: string;
  paymentMethod?: string;
  paychanguAccount?: string;
  givingType?: string;
  createdAt?: string;
};

const PAGE_SIZE = 50;

function inputDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function monthRange() {
  const now = new Date();
  return {
    start: inputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: inputDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

function weekRange() {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: inputDate(start), end: inputDate(end) };
}

export default function GivingPaymentsPage() {
  const { token } = useAdminAuth();
  const [rows, setRows] = useState<GivingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<GivingRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const initialRange = monthRange();
  const [reportStart, setReportStart] = useState(initialRange.start);
  const [reportEnd, setReportEnd] = useState(initialRange.end);
  const [reportStatus, setReportStatus] = useState('completed');
  const [reportBusy, setReportBusy] = useState<'print' | 'pdf' | ''>('');

  const fetchList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const qs = buildAdminQuery({
        skip,
        take: PAGE_SIZE,
        status: status || undefined,
        paymentMethod: paymentMethod || undefined,
        search: search || undefined,
      });
      const response = await apiFetch(`/api/admin/giving${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        adminErrorToast(data.error || data.message || 'Unable to load giving payments.');
        return;
      }
      setRows(Array.isArray(data.givings) ? data.givings : []);
      setTotal(Number(data.total || 0));
    } catch {
      adminErrorToast('Unable to load giving payments.');
    } finally {
      setLoading(false);
    }
  }, [paymentMethod, search, skip, status, token]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const loadReport = async () => {
    if (!token) return null;
    if (!reportStart || !reportEnd) {
      adminErrorToast('Enter a start date and an end date.');
      return null;
    }
    if (reportStart > reportEnd) {
      adminErrorToast('The start date must be on or before the end date.');
      return null;
    }
    const response = await apiFetch(`/api/admin/giving/report?startDate=${reportStart}&endDate=${reportEnd}&status=${reportStatus}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      adminErrorToast(data.error || 'Unable to build the giving report.');
      return null;
    }
    return data as GivingReport;
  };

  const runReport = async (format: 'print' | 'pdf') => {
    setReportBusy(format);
    try {
      const report = await loadReport();
      if (!report) return;
      if (format === 'print') printGivingReport(report);
      else await downloadGivingReportPdf(report);
    } catch {
      adminErrorToast('Unable to build the giving report.');
    } finally {
      setReportBusy('');
    }
  };

  const openDetail = async (id: string) => {
    if (!token) return;
    setSelected(null);
    setDetailLoading(true);
    try {
      const response = await apiFetch(`/api/admin/giving/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        adminErrorToast(data.error || 'Unable to load donation details.');
        return;
      }
      setSelected((data.giving as GivingRow) || null);
    } catch {
      adminErrorToast('Unable to load donation details.');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <GivingPaymentsTabs activePath="/admin/giving/payments" />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-semibold">Giving payments</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">All donation records from PayChangu and other methods.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetchList()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <section className="rounded-lg border border-border/60 bg-card p-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Giving report</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Totals by offering type for a week, a month, or dates you choose.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => { const range = weekRange(); setReportStart(range.start); setReportEnd(range.end); }}>
              This week
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { const range = monthRange(); setReportStart(range.start); setReportEnd(range.end); }}>
              This month
            </Button>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_160px_auto]">
          <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Start date
            <input type="date" value={reportStart} onChange={(event) => setReportStart(event.target.value)} className="h-8 rounded-md border border-border bg-background px-2 text-xs normal-case tracking-normal text-foreground" />
          </label>
          <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            End date
            <input type="date" value={reportEnd} onChange={(event) => setReportEnd(event.target.value)} className="h-8 rounded-md border border-border bg-background px-2 text-xs normal-case tracking-normal text-foreground" />
          </label>
          <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Status
            <select value={reportStatus} onChange={(event) => setReportStatus(event.target.value)} className="h-8 rounded-md border border-border bg-background px-2 text-xs normal-case tracking-normal text-foreground">
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="all">All</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button type="button" variant="outline" size="sm" disabled={Boolean(reportBusy)} onClick={() => void runReport('print')}>
              <Printer className="h-4 w-4" />
              {reportBusy === 'print' ? 'Preparing...' : 'Print'}
            </Button>
            <Button type="button" size="sm" disabled={Boolean(reportBusy)} onClick={() => void runReport('pdf')}>
              <FileText className="h-4 w-4" />
              {reportBusy === 'pdf' ? 'Preparing...' : 'PDF'}
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-2 rounded-lg border border-border/60 bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect label="Status" value={status} onChange={(v) => { setSkip(0); setStatus(v); }} options={['', 'pending', 'completed']} />
        <FilterSelect
          label="Payment method"
          value={paymentMethod}
          onChange={(v) => { setSkip(0); setPaymentMethod(v); }}
          options={['', 'paychangu', 'airtel', 'mpamba']}
        />
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Search</label>
          <div className="flex gap-2">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name, email, phone, type…"
              className="h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-xs"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setSkip(0);
                setSearch(searchInput.trim());
              }}
            >
              <Search className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-semibold">Donor</th>
                <th className="px-4 py-2 font-semibold">Amount</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold">Method</th>
                <th className="px-4 py-2 font-semibold">Account</th>
                <th className="px-4 py-2 font-semibold">Date</th>
                <th className="px-4 py-2 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{row.fullName || '—'}</p>
                    <p className="text-[10px] text-muted-foreground">{row.email || row.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-2.5">{formatMoney(row.amount, row.currency)}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={paymentStatusBadgeClass(row.status)}>{row.status || '—'}</Badge>
                  </td>
                  <td className="px-4 py-2.5">{row.paymentMethod || '—'}</td>
                  <td className="px-4 py-2.5">{row.paychanguAccount || '—'}</td>
                  <td className="px-4 py-2.5">{formatAdminDate(row.createdAt)}</td>
                  <td className="px-4 py-2.5">
                    <Button type="button" size="sm" variant="outline" onClick={() => void openDetail(row.id)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && !loading ? (
            <p className="py-8 text-center text-xs text-muted-foreground">No donations found.</p>
          ) : null}
        </div>
        <div className="border-t border-border/60 px-4 py-3">
          <AdminListPagination skip={skip} take={PAGE_SIZE} total={total} onPageChange={setSkip} disabled={loading} />
        </div>
      </div>

      <Dialog open={detailLoading || Boolean(selected)} onOpenChange={(open) => !open && (setSelected(null), setDetailLoading(false))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Donation details</DialogTitle>
            <DialogDescription>Full giving record from PayChangu and the church backend.</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : selected ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Detail label="ID" value={selected.id} />
              <Detail label="Amount" value={formatMoney(selected.amount, selected.currency)} />
              <Detail label="Donor" value={selected.fullName} />
              <Detail label="Email" value={selected.email} />
              <Detail label="Phone" value={selected.phone} />
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="mt-1">
                  <Badge variant="outline" className={paymentStatusBadgeClass(selected.status)}>{selected.status || '—'}</Badge>
                </dd>
              </div>
              <Detail label="Payment method" value={selected.paymentMethod} />
              <Detail label="PayChangu account" value={selected.paychanguAccount} />
              <Detail label="Giving type" value={selected.givingType} />
              <Detail label="Created" value={formatAdminDate(selected.createdAt)} />
            </dl>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
      >
        {options.map((opt) => (
          <option key={opt || 'all'} value={opt}>
            {opt ? opt : 'All'}
          </option>
        ))}
      </select>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value || '—'}</dd>
    </div>
  );
}
