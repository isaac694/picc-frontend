'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, FileText, RefreshCw, Search, X } from 'lucide-react';
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
import { StorePaymentsTabs } from '@/components/admin/payments/PaymentsSectionTabs';
import { AdminListPagination } from '@/components/admin/payments/AdminListPagination';
import { downloadRegistrationsExcel, downloadRegistrationsPdf, type ExportColumn } from '@/lib/event-registration-export';
import { buildAdminQuery, formatAdminDate, formatMoney, paymentStatusBadgeClass } from '@/lib/admin-payments';

type PurchaseRow = {
  id: string;
  productId?: string;
  title?: string;
  author?: string;
  format?: string;
  price?: number;
  currency?: string;
  status?: string;
  paymentMethod?: string;
  customerEmail?: string;
  userId?: string;
  cartToken?: string;
  paychanguChargeId?: string;
  chargeId?: string;
  paidAt?: string;
  createdAt?: string;
};

type PurchaseSummary = {
  count: number;
  amount: number;
  paidCount: number;
  paidAmount: number;
  pendingCount: number;
  pendingAmount: number;
  cancelledCount: number;
  cancelledAmount: number;
  hardCount: number;
  hardPaidAmount: number;
  softCount: number;
  softPaidAmount: number;
  currency: string;
};

type BookOption = { productId: string; title: string };

const PAGE_SIZE = 50;

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'available', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
];

const FORMAT_OPTIONS = [
  { value: '', label: 'Hard & soft copy' },
  { value: 'hard', label: 'Hard copy only' },
  { value: 'soft', label: 'Soft copy only' },
];

const formatLabel = (format?: string) => (format === 'hard' ? 'Hard copy' : format === 'soft' ? 'Soft copy' : format || '—');
const statusLabel = (status?: string) => STATUS_OPTIONS.find((option) => option.value === status)?.label || status || '—';
const isPaid = (status?: string) => ['available', 'complete', 'completed', 'paid'].includes(String(status || '').toLowerCase());

export default function StorePaymentsPage() {
  const { token } = useAdminAuth();
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<PurchaseSummary | null>(null);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState('');
  const [format, setFormat] = useState('');
  const [productId, setProductId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [books, setBooks] = useState<BookOption[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PurchaseRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // The dashboard links here with ?productId=… to open one book's payments.
  useEffect(() => {
    const id = setTimeout(() => {
      const fromUrl = new URLSearchParams(window.location.search).get('productId');
      if (fromUrl) setProductId(fromUrl);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await apiFetch('/api/admin/store/dashboard/books', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (!cancelled && response.ok && Array.isArray(data.books)) {
          setBooks(
            (data.books as BookOption[])
              .map((book) => ({ productId: book.productId, title: book.title }))
              .sort((a, b) => a.title.localeCompare(b.title)),
          );
        }
      } catch {
        // The book filter just stays empty; the list itself still works.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const filters = {
    status: status || undefined,
    format: format || undefined,
    productId: productId || undefined,
    from: from || undefined,
    to: to || undefined,
    search: search || undefined,
  };

  const fetchList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const qs = buildAdminQuery({
        skip,
        take: PAGE_SIZE,
        status: status || undefined,
        format: format || undefined,
        productId: productId || undefined,
        from: from || undefined,
        to: to || undefined,
        search: search || undefined,
      });
      const response = await apiFetch(`/api/admin/store/purchases${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        adminErrorToast(data.error || data.message || 'Unable to load store payments.');
        return;
      }
      setRows(Array.isArray(data.purchases) ? data.purchases : []);
      setTotal(Number(data.total || 0));
      setSummary(data.summary || null);
    } catch {
      adminErrorToast('Unable to load store payments.');
    } finally {
      setLoading(false);
    }
  }, [format, from, productId, search, skip, status, to, token]);

  useEffect(() => {
    const id = setTimeout(() => void fetchList(), 0);
    return () => clearTimeout(id);
  }, [fetchList]);

  const openDetail = async (id: string) => {
    if (!token) return;
    setSelected(null);
    setDetailLoading(true);
    try {
      const response = await apiFetch(`/api/admin/store/purchases/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        adminErrorToast(data.error || 'Unable to load purchase details.');
        return;
      }
      const purchase = (data.purchase || data) as PurchaseRow;
      setSelected(purchase?.id ? purchase : null);
    } catch {
      adminErrorToast('Unable to load purchase details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const currency = summary?.currency || 'MWK';
  const money = (value: number) => formatMoney(value, currency);
  const selectedBook = books.find((book) => book.productId === productId);
  const hasFilters = Boolean(status || format || productId || from || to || search);

  const resetFilters = () => {
    setSkip(0);
    setStatus('');
    setFormat('');
    setProductId('');
    setFrom('');
    setTo('');
    setSearch('');
    setSearchInput('');
  };

  const exportScope = () => {
    const parts = [
      selectedBook ? selectedBook.title : 'All books',
      FORMAT_OPTIONS.find((option) => option.value === format)?.label,
      status ? statusLabel(status) : '',
      from || to ? `${from || 'start'} to ${to || 'today'}` : '',
      search ? `“${search}”` : '',
    ];
    return parts.filter(Boolean).join(' · ');
  };

  const exportPayments = async (target: 'excel' | 'pdf') => {
    if (!token) return;
    setExporting(true);
    try {
      const response = await apiFetch(`/api/admin/store/purchases-export${buildAdminQuery(filters)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        adminErrorToast(data.error || 'Unable to export store payments.');
        return;
      }
      const purchases: PurchaseRow[] = Array.isArray(data.purchases) ? data.purchases : [];
      const totals: PurchaseSummary | null = data.summary || null;
      if (purchases.length === 0) {
        adminErrorToast('There are no payments to export for these filters.');
        return;
      }
      const cash = (value: number) => formatMoney(value, totals?.currency || currency);

      const columns: ExportColumn[] = [
        { key: 'date', label: 'Date' },
        { key: 'book', label: 'Book' },
        { key: 'format', label: 'Format' },
        { key: 'customer', label: 'Customer' },
        { key: 'method', label: 'Payment method' },
        { key: 'status', label: 'Status' },
        { key: 'reference', label: 'PayChangu ref' },
        { key: 'amount', label: 'Amount' },
      ];
      const blank = Object.fromEntries(columns.map((column) => [column.key, ''])) as Record<string, string>;
      const lines: Array<Record<string, string>> = purchases.map((row) => ({
        date: formatAdminDate(row.paidAt || row.createdAt),
        book: row.title || '',
        format: formatLabel(row.format),
        customer: row.customerEmail || '',
        method: row.paymentMethod || '',
        status: statusLabel(row.status),
        reference: row.paychanguChargeId || '',
        amount: cash(Number(row.price || 0)),
      }));

      // Paid copies and money per book and format, so a whole-store export still reads book by book.
      const perBook = new Map<string, { title: string; hard: number; soft: number; hardAmount: number; softAmount: number }>();
      for (const row of purchases) {
        if (!isPaid(row.status)) continue;
        const key = row.productId || row.title || '';
        const entry = perBook.get(key) || { title: row.title || 'Untitled', hard: 0, soft: 0, hardAmount: 0, softAmount: 0 };
        if (row.format === 'hard') {
          entry.hard += 1;
          entry.hardAmount += Number(row.price || 0);
        } else {
          entry.soft += 1;
          entry.softAmount += Number(row.price || 0);
        }
        perBook.set(key, entry);
      }

      lines.push(blank);
      lines.push({ ...blank, book: 'PAID SALES PER BOOK' });
      for (const entry of [...perBook.values()].sort((a, b) => b.hardAmount + b.softAmount - (a.hardAmount + a.softAmount))) {
        if (format !== 'soft' && entry.hard > 0) {
          lines.push({ ...blank, book: entry.title, format: `Hard copy × ${entry.hard}`, amount: cash(entry.hardAmount) });
        }
        if (format !== 'hard' && entry.soft > 0) {
          lines.push({ ...blank, book: entry.title, format: `Soft copy × ${entry.soft}`, amount: cash(entry.softAmount) });
        }
        if (entry.hard > 0 && entry.soft > 0) {
          lines.push({ ...blank, book: `${entry.title} — total`, format: `${entry.hard + entry.soft} copies`, amount: cash(entry.hardAmount + entry.softAmount) });
        }
      }
      if (totals) {
        lines.push(blank);
        if (format !== 'soft') lines.push({ ...blank, book: 'HARD COPY SALES (PAID)', amount: cash(totals.hardPaidAmount) });
        if (format !== 'hard') lines.push({ ...blank, book: 'SOFT COPY SALES (PAID)', amount: cash(totals.softPaidAmount) });
        lines.push({ ...blank, book: 'TOTAL PAID', format: `${totals.paidCount} copies`, amount: cash(totals.paidAmount) });
        lines.push({ ...blank, book: 'PENDING (NOT YET PAID)', format: `${totals.pendingCount} items`, amount: cash(totals.pendingAmount) });
        if (totals.cancelledCount > 0) {
          lines.push({ ...blank, book: 'CANCELLED', format: `${totals.cancelledCount} items`, amount: cash(totals.cancelledAmount) });
        }
        lines.push({ ...blank, book: 'TOTAL OF ALL LINES', format: `${totals.count} items`, amount: cash(totals.amount) });
      }

      const day = new Date().toISOString().slice(0, 10);
      const slug = selectedBook ? selectedBook.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'all-books';
      const fileBase = `book-payments-${slug}${format ? `-${format}-copy` : ''}-${day}`;
      if (target === 'excel') {
        downloadRegistrationsExcel({ fileName: `${fileBase}.xls`, sheetName: 'Book payments', columns, rows: lines });
      } else {
        await downloadRegistrationsPdf({ title: `Book store payments — ${exportScope()}`, fileName: `${fileBase}.pdf`, columns, rows: lines });
      }
    } catch {
      adminErrorToast('Unable to export store payments.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <StorePaymentsTabs activePath="/admin/store/payments" />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-semibold">Book store payments</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">All Hope Stores PayChangu checkout line items.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void exportPayments('excel')} disabled={exporting || total === 0}>
            <Download className="h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => void exportPayments('pdf')} disabled={exporting || total === 0}>
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => void fetchList()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-2 rounded-lg border border-border/60 bg-card p-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2">
          <FilterSelect
            label="Book"
            value={productId}
            onChange={(v) => { setSkip(0); setProductId(v); }}
            options={[
              { value: '', label: 'All books' },
              ...books.map((book) => ({ value: book.productId, label: book.title })),
              // Keep a book picked from a link selectable even before the list loads.
              ...(productId && !selectedBook ? [{ value: productId, label: 'Selected book' }] : []),
            ]}
          />
        </div>
        <FilterSelect
          label="Copy"
          value={format}
          onChange={(v) => { setSkip(0); setFormat(v); }}
          options={FORMAT_OPTIONS}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(v) => { setSkip(0); setStatus(v); }}
          options={STATUS_OPTIONS}
        />
        <DateFilter label="From" value={from} onChange={(v) => { setSkip(0); setFrom(v); }} />
        <DateFilter label="To" value={to} onChange={(v) => { setSkip(0); setTo(v); }} />
        <div className="sm:col-span-2 lg:col-span-6">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Search</label>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setSkip(0);
              setSearch(searchInput.trim());
            }}
          >
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Title, email, charge id…"
              className="h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-xs"
            />
            <Button type="submit" size="sm" variant="secondary" aria-label="Search">
              <Search className="h-3.5 w-3.5" />
            </Button>
            {hasFilters ? (
              <Button type="button" size="sm" variant="ghost" onClick={resetFilters}>
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            ) : null}
          </form>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryTile
          label="Total paid"
          value={summary ? money(summary.paidAmount) : '—'}
          detail={summary ? `${summary.paidCount} ${summary.paidCount === 1 ? 'copy' : 'copies'} paid` : ''}
          strong
        />
        <SummaryTile
          label="Hard copy (paid)"
          value={summary ? money(summary.hardPaidAmount) : '—'}
          detail={summary ? `${summary.hardCount} hard copy lines` : ''}
        />
        <SummaryTile
          label="Soft copy (paid)"
          value={summary ? money(summary.softPaidAmount) : '—'}
          detail={summary ? `${summary.softCount} soft copy lines` : ''}
        />
        <SummaryTile
          label="Pending"
          value={summary ? money(summary.pendingAmount) : '—'}
          detail={summary ? `${summary.pendingCount} not yet paid` : ''}
        />
        <SummaryTile
          label="All lines"
          value={summary ? money(summary.amount) : '—'}
          detail={summary ? `${summary.count} items · ${summary.cancelledCount} cancelled` : ''}
        />
      </div>
      {hasFilters ? <p className="-mt-1 text-[11px] text-muted-foreground">Totals for: {exportScope()}</p> : null}

      <div className="rounded-lg border border-border/60 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-semibold">Book</th>
                <th className="px-4 py-2 font-semibold">Format</th>
                <th className="px-4 py-2 font-semibold">Amount</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold">Customer</th>
                <th className="px-4 py-2 font-semibold">Paid</th>
                <th className="px-4 py-2 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-2.5 font-medium">{row.title || '—'}</td>
                  <td className="px-4 py-2.5">{formatLabel(row.format)}</td>
                  <td className="px-4 py-2.5">{formatMoney(row.price, row.currency)}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={paymentStatusBadgeClass(row.status)}>{statusLabel(row.status)}</Badge>
                  </td>
                  <td className="px-4 py-2.5">{row.customerEmail || '—'}</td>
                  <td className="px-4 py-2.5">{formatAdminDate(row.paidAt || row.createdAt)}</td>
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
            <p className="py-8 text-center text-xs text-muted-foreground">No purchases found.</p>
          ) : null}
        </div>
        <div className="border-t border-border/60 px-4 py-3">
          <AdminListPagination skip={skip} take={PAGE_SIZE} total={total} onPageChange={setSkip} disabled={loading} />
        </div>
      </div>

      <Dialog open={detailLoading || Boolean(selected)} onOpenChange={(open) => !open && (setSelected(null), setDetailLoading(false))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Purchase details</DialogTitle>
            <DialogDescription>Hope Stores payment line item and PayChangu reference.</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : selected ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Detail label="ID" value={selected.id} />
              <Detail label="Title" value={selected.title} />
              <Detail label="Format" value={formatLabel(selected.format)} />
              <Detail label="Amount" value={formatMoney(selected.price, selected.currency)} />
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="mt-1">
                  <Badge variant="outline" className={paymentStatusBadgeClass(selected.status)}>{statusLabel(selected.status)}</Badge>
                </dd>
              </div>
              <Detail label="Payment method" value={selected.paymentMethod} />
              <Detail label="Customer email" value={selected.customerEmail} />
              <Detail label="User ID" value={selected.userId} />
              <Detail label="Cart token" value={selected.cartToken} />
              <Detail label="PayChangu charge" value={selected.paychanguChargeId || selected.chargeId} />
              <Detail label="Paid at" value={formatAdminDate(selected.paidAt)} />
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
  options: Array<{ value: string; label: string }>;
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
          <option key={opt.value || 'all'} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function DateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
      />
    </div>
  );
}

function SummaryTile({ label, value, detail, strong }: { label: string; value: string; detail: string; strong?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 shadow-sm ${strong ? 'border-primary/30 bg-primary/5' : 'border-border/60 bg-card'}`}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1.5 truncate text-lg font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-all font-medium text-foreground">{value || '—'}</dd>
    </div>
  );
}
