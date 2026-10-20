'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileSpreadsheet, FileText, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiFetch } from '@/lib/api';
import { downloadRegistrationsExcel, downloadRegistrationsPdf, type ExportColumn } from '@/lib/event-registration-export';

type BookLaunchSale = {
  id: string;
  name: string;
  quantity: number;
  amount: number;
  contact?: string | null;
  paymentStatus: string;
  collectionStatus: string;
  medium?: string | null;
};

type Summary = {
  count: number;
  quantity: number;
  total: number;
  paid: number;
  outstanding: number;
};

type Draft = {
  name: string;
  quantity: string;
  amount: string;
  contact: string;
  paymentStatus: string;
  collectionStatus: string;
  medium: string;
};

const EMPTY_DRAFT: Draft = {
  name: '',
  quantity: '1',
  amount: '',
  contact: '',
  paymentStatus: 'not paid',
  collectionStatus: 'not collected',
  medium: '',
};

const FALLBACK_SUMMARY: Summary = { count: 0, quantity: 0, total: 0, paid: 0, outstanding: 0 };

const money = (value: number) => `MWK ${Number(value || 0).toLocaleString()}`;

export default function BookLaunchSalesPage() {
  const { token } = useAdminAuth();
  const [sales, setSales] = useState<BookLaunchSale[]>([]);
  const [summary, setSummary] = useState<Summary>(FALLBACK_SUMMARY);
  const [paymentStatuses, setPaymentStatuses] = useState(['paid', 'not paid']);
  const [collectionStatuses, setCollectionStatuses] = useState(['collected', 'not collected']);
  const [media, setMedia] = useState(['Bank', 'Cash', 'Airtel money']);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSales = useCallback(async () => {
    if (!token) return;
    const response = await apiFetch('/api/admin/store/book-launch', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setStatus(data?.error || 'Unable to load book launch sales.');
      return;
    }
    setSales(Array.isArray(data?.sales) ? data.sales : []);
    setSummary(data?.summary || FALLBACK_SUMMARY);
    if (Array.isArray(data?.paymentStatuses)) setPaymentStatuses(data.paymentStatuses);
    if (Array.isArray(data?.collectionStatuses)) setCollectionStatuses(data.collectionStatuses);
    if (Array.isArray(data?.media)) setMedia(data.media);
  }, [token]);

  useEffect(() => {
    void fetchSales();
  }, [fetchSales]);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFormError('');
  };

  const openAddDialog = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFormError('');
    setDialogOpen(true);
  };

  const saveSale = async () => {
    if (!token) return;
    if (!draft.name.trim()) {
      setFormError('Enter the name.');
      return;
    }
    if (!Number.isInteger(Number(draft.quantity)) || Number(draft.quantity) < 1) {
      setFormError('Quantity must be a whole number of at least 1.');
      return;
    }
    if (draft.amount.trim() === '' || !Number.isFinite(Number(draft.amount)) || Number(draft.amount) < 0) {
      setFormError('Enter the amount.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const response = await apiFetch(editingId ? `/api/admin/store/book-launch/${editingId}` : '/api/admin/store/book-launch', {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: draft.name.trim(),
          quantity: Number(draft.quantity),
          amount: Number(draft.amount),
          contact: draft.contact.trim(),
          paymentStatus: draft.paymentStatus,
          collectionStatus: draft.collectionStatus,
          medium: draft.medium,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setFormError(data?.error || 'Unable to save this sale.');
        return;
      }
      setStatus(editingId ? 'Sale updated.' : 'Sale added.');
      closeDialog();
      await fetchSales();
    } catch {
      setFormError('Unable to save this sale.');
    } finally {
      setSaving(false);
    }
  };

  const editSale = (sale: BookLaunchSale) => {
    setEditingId(sale.id);
    setDraft({
      name: sale.name,
      quantity: String(sale.quantity ?? 1),
      amount: String(sale.amount ?? 0),
      contact: sale.contact || '',
      paymentStatus: sale.paymentStatus || 'not paid',
      collectionStatus: sale.collectionStatus || 'not collected',
      medium: sale.medium || '',
    });
    setFormError('');
    setDialogOpen(true);
  };

  const exportSales = async (format: 'excel' | 'pdf') => {
    if (sales.length === 0) {
      setStatus('There are no sales to export.');
      return;
    }
    const columns: ExportColumn[] = [
      { key: 'name', label: 'Name' },
      { key: 'quantity', label: 'Qty' },
      { key: 'amount', label: 'Amount' },
      { key: 'contact', label: 'Contact' },
      { key: 'paymentStatus', label: 'Payment status' },
      { key: 'collectionStatus', label: 'Collection status' },
      { key: 'medium', label: 'Medium' },
    ];
    const rows = sales.map((sale) => ({
      name: sale.name,
      quantity: String(sale.quantity),
      amount: money(sale.amount),
      contact: sale.contact || '',
      paymentStatus: sale.paymentStatus,
      collectionStatus: sale.collectionStatus,
      medium: sale.medium || '',
    }));
    rows.push({ name: '', quantity: '', amount: '', contact: '', paymentStatus: '', collectionStatus: '', medium: '' });
    rows.push({ name: 'TOTAL', quantity: String(summary.quantity), amount: money(summary.total), contact: '', paymentStatus: '', collectionStatus: '', medium: '' });
    rows.push({ name: 'PAID', quantity: '', amount: money(summary.paid), contact: '', paymentStatus: '', collectionStatus: '', medium: '' });
    rows.push({ name: 'OUTSTANDING', quantity: '', amount: money(summary.outstanding), contact: '', paymentStatus: '', collectionStatus: '', medium: '' });

    const day = new Date().toISOString().slice(0, 10);
    if (format === 'excel') {
      downloadRegistrationsExcel({
        fileName: `book-launch-sales-${day}.xls`,
        sheetName: 'Book launch sales',
        columns,
        rows,
      });
      return;
    }
    await downloadRegistrationsPdf({
      title: 'Book launch sales',
      fileName: `book-launch-sales-${day}.pdf`,
      columns,
      rows,
    });
  };

  const removeSale = (sale: BookLaunchSale) => {
    if (!token) return;
    confirmDeleteToast({
      title: `Delete ${sale.name}?`,
      description: 'This removes the book launch sale.',
      onConfirm: async () => {
        const response = await apiFetch(`/api/admin/store/book-launch/${sale.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          setStatus('Unable to delete this sale.');
          return;
        }
        if (editingId === sale.id) closeDialog();
        setStatus('Sale deleted.');
        await fetchSales();
      },
    });
  };

  if (!token) return <AdminLoginCard />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-foreground/60">Purchases recorded the same way as the book launch sales sheet.</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void exportSales('excel')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void exportSales('pdf')}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void fetchSales()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add sale
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-foreground/50">Total</p>
          <p className="mt-1 text-lg font-semibold">{money(summary.total)}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-foreground/50">Paid</p>
          <p className="mt-1 text-lg font-semibold">{money(summary.paid)}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-foreground/50">Outstanding</p>
          <p className="mt-1 text-lg font-semibold">{money(summary.outstanding)}</p>
        </div>
      </div>

      {status ? <p className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground/70">{status}</p> : null}

      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-foreground/60">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Collection</th>
                <th className="px-4 py-3 font-medium">Medium</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-foreground/60">
                    No book launch sales yet. Use Add sale to record one.
                  </td>
                </tr>
              ) : sales.map((sale) => (
                <tr key={sale.id} className="border-t border-border/60">
                  <td className="px-4 py-3 font-medium">{sale.name}</td>
                  <td className="px-4 py-3">{sale.quantity}</td>
                  <td className="whitespace-nowrap px-4 py-3">{money(sale.amount)}</td>
                  <td className="px-4 py-3">{sale.contact || '—'}</td>
                  <td className="px-4 py-3 capitalize">{sale.paymentStatus}</td>
                  <td className="px-4 py-3 capitalize">{sale.collectionStatus}</td>
                  <td className="px-4 py-3">{sale.medium || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button type="button" size="icon" variant="ghost" onClick={() => editSale(sale)} aria-label={`Edit ${sale.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeSale(sale)} aria-label={`Delete ${sale.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={(open) => {
          if (open) setDialogOpen(true);
          else closeDialog();
        }}
        title={editingId ? 'Edit book launch sale' : 'Add book launch sale'}
        description="Name, quantity, amount, contact, payment, and collection."
        saving={saving}
        saveLabel={saving ? 'Saving...' : editingId ? 'Update sale' : 'Add sale'}
        onSave={() => void saveSale()}
        onCancel={closeDialog}
        maxWidthClass="sm:max-w-xl"
      >
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span>Name</span>
            <input className="rounded-xl border border-border bg-background px-3 py-2" value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="Buyer or book title" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>Qty</span>
              <input className="rounded-xl border border-border bg-background px-3 py-2" type="number" min="1" step="1" value={draft.quantity} onChange={(event) => setDraft((prev) => ({ ...prev, quantity: event.target.value }))} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Amount (MWK)</span>
              <input className="rounded-xl border border-border bg-background px-3 py-2" type="number" min="0" step="0.01" value={draft.amount} onChange={(event) => setDraft((prev) => ({ ...prev, amount: event.target.value }))} placeholder="500000" />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span>Contact</span>
            <input className="rounded-xl border border-border bg-background px-3 py-2" value={draft.contact} onChange={(event) => setDraft((prev) => ({ ...prev, contact: event.target.value }))} placeholder="Phone number" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>Payment status</span>
              <select className="rounded-xl border border-border bg-background px-3 py-2 capitalize" value={draft.paymentStatus} onChange={(event) => setDraft((prev) => ({ ...prev, paymentStatus: event.target.value }))}>
                {paymentStatuses.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span>Collection status</span>
              <select className="rounded-xl border border-border bg-background px-3 py-2 capitalize" value={draft.collectionStatus} onChange={(event) => setDraft((prev) => ({ ...prev, collectionStatus: event.target.value }))}>
                {collectionStatuses.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
              </select>
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span>Medium</span>
            <select className="rounded-xl border border-border bg-background px-3 py-2" value={draft.medium} onChange={(event) => setDraft((prev) => ({ ...prev, medium: event.target.value }))}>
              <option value="">Not set</option>
              {media.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
            </select>
          </label>
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        </div>
      </SchoolAdminDialogShell>
    </div>
  );
}
