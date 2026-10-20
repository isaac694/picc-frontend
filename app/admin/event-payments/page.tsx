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
import { EventPaymentsTabs } from '@/components/admin/payments/PaymentsSectionTabs';
import { AdminListPagination } from '@/components/admin/payments/AdminListPagination';
import { buildAdminQuery, formatAdminDate, formatMoney, paymentStatusBadgeClass } from '@/lib/admin-payments';

type EventPaymentRow = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  amount?: number;
  currency?: string;
  status?: string;
  paymentMethod?: string;
  paychanguAccount?: string;
  ticketName?: string | null;
  quantity?: number;
  ticketCode?: string | null;
  ticketCodes?: string[];
  checkedInAt?: string | null;
  eventTitle?: string | null;
  ministryKey?: string | null;
  chargeId?: string | null;
  paidAt?: string | null;
  createdAt?: string;
};

const PAGE_SIZE = 50;

export default function EventPaymentsPage() {
  const { token } = useAdminAuth();
  const [rows, setRows] = useState<EventPaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<EventPaymentRow | null>(null);
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
      const response = await apiFetch(`/api/admin/event-payments${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        adminErrorToast(data.error || data.message || 'Unable to load event payments.');
        return;
      }
      setRows(Array.isArray(data.payments) ? data.payments : []);
      setTotal(Number(data.total || 0));
    } catch {
      adminErrorToast('Unable to load event payments.');
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
      const response = await apiFetch(`/api/admin/event-payments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        adminErrorToast(data.error || 'Unable to load payment details.');
        return;
      }
      setSelected((data.payment as EventPaymentRow) || null);
    } catch {
      adminErrorToast('Unable to load payment details.');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <EventPaymentsTabs activePath="/admin/event-payments" />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-semibold">Events payment</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">All ticket payments saved from event checkout.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetchList()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-2 rounded-lg border border-border/60 bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect label="Status" value={status} onChange={(value) => { setSkip(0); setStatus(value); }} options={['', 'pending', 'completed', 'failed']} />
        <FilterSelect label="Payment method" value={paymentMethod} onChange={(value) => { setSkip(0); setPaymentMethod(value); }} options={['', 'paychangu', 'airtel', 'mpamba']} />
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Search</label>
          <div className="flex gap-2">
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Name, email, event, ticket code…"
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
                <th className="px-4 py-2 font-semibold">Buyer</th>
                <th className="px-4 py-2 font-semibold">Event</th>
                <th className="px-4 py-2 font-semibold">Ticket</th>
                <th className="px-4 py-2 font-semibold">Amount</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold">Date</th>
                <th className="px-4 py-2 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{row.name || '—'}</p>
                    <p className="text-[10px] text-muted-foreground">{row.email || row.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-2.5">{row.eventTitle || '—'}</td>
                  <td className="px-4 py-2.5">
                    <p>{row.ticketName || 'Event ticket'}{(row.quantity || 1) > 1 ? ` × ${row.quantity}` : ''}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{(row.ticketCodes && row.ticketCodes.length ? row.ticketCodes : [row.ticketCode].filter(Boolean)).join(', ')}</p>
                  </td>
                  <td className="px-4 py-2.5">{formatMoney(row.amount, row.currency)}</td>
                  <td className="px-4 py-2.5"><Badge variant="outline" className={paymentStatusBadgeClass(row.status)}>{row.status || '—'}</Badge></td>
                  <td className="px-4 py-2.5">{formatAdminDate(row.createdAt)}</td>
                  <td className="px-4 py-2.5">
                    <Button type="button" size="sm" variant="outline" onClick={() => void openDetail(row.id)}>View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && !loading ? <p className="py-8 text-center text-xs text-muted-foreground">No event payments found.</p> : null}
        </div>
        <div className="border-t border-border/60 px-4 py-3">
          <AdminListPagination skip={skip} take={PAGE_SIZE} total={total} onPageChange={setSkip} disabled={loading} />
        </div>
      </div>

      <Dialog open={detailLoading || Boolean(selected)} onOpenChange={(open) => { if (!open) { setSelected(null); setDetailLoading(false); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Event payment</DialogTitle>
            <DialogDescription>Buyer, ticket, and PayChangu details saved for this payment.</DialogDescription>
          </DialogHeader>
          {detailLoading ? <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p> : null}
          {selected ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Detail label="Buyer" value={selected.name} />
              <Detail label="Email" value={selected.email} />
              <Detail label="Phone" value={selected.phone} />
              <Detail label="Event" value={selected.eventTitle} />
              <Detail label="Ticket" value={`${selected.ticketName || 'Event ticket'}${(selected.quantity || 1) > 1 ? ` × ${selected.quantity}` : ''}`} />
              <Detail label="Ticket codes" value={(selected.ticketCodes && selected.ticketCodes.length ? selected.ticketCodes : [selected.ticketCode].filter(Boolean)).join(', ')} />
              <Detail label="Amount" value={formatMoney(selected.amount, selected.currency)} />
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="mt-1">
                  <Badge variant="outline" className={paymentStatusBadgeClass(selected.status)}>{selected.status || '—'}</Badge>
                </dd>
              </div>
              <Detail label="Payment method" value={selected.paymentMethod} />
              <Detail label="PayChangu account" value={selected.paychanguAccount} />
              <Detail label="Charge" value={selected.chargeId} />
              <Detail label="Paid" value={formatAdminDate(selected.paidAt)} />
              <Detail label="Checked in" value={formatAdminDate(selected.checkedInAt)} />
              <Detail label="Created" value={formatAdminDate(selected.createdAt)} />
            </dl>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs">
        {options.map((option) => (
          <option key={option || 'all'} value={option}>{option || 'All'}</option>
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
