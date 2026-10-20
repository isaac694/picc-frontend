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
import { GivingPaymentsTabs } from '@/components/admin/payments/PaymentsSectionTabs';
import { AdminListPagination } from '@/components/admin/payments/AdminListPagination';
import { buildAdminQuery, formatAdminDate, formatMoney, paymentStatusBadgeClass } from '@/lib/admin-payments';

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
