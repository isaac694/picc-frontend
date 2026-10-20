'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
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
import { buildAdminQuery, formatAdminDate, formatMoney, paymentStatusBadgeClass } from '@/lib/admin-payments';

type PurchaseRow = {
  id: string;
  title?: string;
  format?: string;
  price?: number;
  currency?: string;
  status?: string;
  customerEmail?: string;
  userId?: string;
  cartToken?: string;
  paychanguChargeId?: string;
  chargeId?: string;
  paidAt?: string;
  createdAt?: string;
};

const PAGE_SIZE = 50;

export default function StorePaymentsPage() {
  const { token } = useAdminAuth();
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [format, setFormat] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PurchaseRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const qs = buildAdminQuery({
        skip,
        take: PAGE_SIZE,
        status: status || undefined,
        format: format || undefined,
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
    } catch {
      adminErrorToast('Unable to load store payments.');
    } finally {
      setLoading(false);
    }
  }, [format, search, skip, status, token]);

  useEffect(() => {
    void fetchList();
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

  return (
    <div className="space-y-4">
      <StorePaymentsTabs activePath="/admin/store/payments" />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-semibold">Book store payments</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">All Hope Stores PayChangu checkout line items.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetchList()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-2 rounded-lg border border-border/60 bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect
          label="Status"
          value={status}
          onChange={(v) => { setSkip(0); setStatus(v); }}
          options={['', 'pending', 'available', 'cancelled']}
        />
        <FilterSelect
          label="Format"
          value={format}
          onChange={(v) => { setSkip(0); setFormat(v); }}
          options={['', 'soft', 'hard']}
        />
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Search</label>
          <div className="flex gap-2">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Title, email, charge id…"
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
                  <td className="px-4 py-2.5 capitalize">{row.format || '—'}</td>
                  <td className="px-4 py-2.5">{formatMoney(row.price, row.currency)}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={paymentStatusBadgeClass(row.status)}>{row.status || '—'}</Badge>
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
              <Detail label="Format" value={selected.format} />
              <Detail label="Amount" value={formatMoney(selected.price, selected.currency)} />
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="mt-1">
                  <Badge variant="outline" className={paymentStatusBadgeClass(selected.status)}>{selected.status || '—'}</Badge>
                </dd>
              </div>
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
      <dd className="break-all font-medium text-foreground">{value || '—'}</dd>
    </div>
  );
}
