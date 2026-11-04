'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  MapPin,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiFetch } from '@/lib/api';
import { downloadRegistrationsExcel, downloadRegistrationsPdf, type ExportColumn } from '@/lib/event-registration-export';
import { cn } from '@/lib/utils';

type BookLaunchSale = {
  id: string;
  name: string;
  quantity: number;
  amount: number;
  contact?: string | null;
  paymentStatus: string;
  collectionStatus: string;
  medium?: string | null;
  launchId?: string | null;
  source?: string;
  createdAt?: string;
};

type Summary = { count: number; quantity: number; total: number; paid: number; outstanding: number; fromForm?: number; collected?: number };

type Launch = {
  id: string;
  name: string;
  bookTitle: string | null;
  launchDate: string | null;
  venue: string | null;
  unitPrice: number;
  description: string | null;
  formSlug: string;
  formEnabled: boolean;
  isActive: boolean;
  summary: Summary;
};

type SaleDraft = { name: string; quantity: string; amount: string; contact: string; paymentStatus: string; collectionStatus: string; medium: string };
type LaunchDraft = { name: string; bookTitle: string; launchDate: string; venue: string; unitPrice: string; description: string; formEnabled: boolean };

const EMPTY_SALE: SaleDraft = { name: '', quantity: '1', amount: '', contact: '', paymentStatus: 'not paid', collectionStatus: 'not collected', medium: '' };
const EMPTY_LAUNCH: LaunchDraft = { name: '', bookTitle: '', launchDate: '', venue: '', unitPrice: '', description: '', formEnabled: true };
const FALLBACK_SUMMARY: Summary = { count: 0, quantity: 0, total: 0, paid: 0, outstanding: 0 };
// Sales recorded before folders existed.
const UNFILED = 'none';

const money = (value: number) => `MWK ${Number(value || 0).toLocaleString()}`;
const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const inputClass = 'rounded-xl border border-border bg-background px-3 py-2';

export default function BookLaunchSalesPage() {
  const { token, email, password, loginError, setEmail, setPassword, handleLogin } = useAdminAuth();
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [unfiled, setUnfiled] = useState<Summary | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sales, setSales] = useState<BookLaunchSale[]>([]);
  const [summary, setSummary] = useState<Summary>(FALLBACK_SUMMARY);
  const [paymentStatuses, setPaymentStatuses] = useState(['paid', 'not paid']);
  const [collectionStatuses, setCollectionStatuses] = useState(['collected', 'not collected']);
  const [media, setMedia] = useState(['Cash', 'POS', 'Bank', 'Airtel money']);
  const [saleDraft, setSaleDraft] = useState<SaleDraft>(EMPTY_SALE);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [launchDraft, setLaunchDraft] = useState<LaunchDraft>(EMPTY_LAUNCH);
  const [editingLaunchId, setEditingLaunchId] = useState<string | null>(null);
  const [launchDialogOpen, setLaunchDialogOpen] = useState(false);
  const [qr, setQr] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const headers = useCallback(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }), [token]);
  const openLaunch = launches.find((launch) => launch.id === openId) || null;
  const formUrl = (launch: Launch) => (typeof window === 'undefined' ? '' : `${window.location.origin}/book-launch/${launch.formSlug}`);

  const fetchLaunches = useCallback(async () => {
    if (!token) return;
    const response = await apiFetch('/api/admin/store/book-launches', { headers: headers() });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      adminErrorToast(data?.error || 'Unable to load book launches.');
      return;
    }
    setLaunches(Array.isArray(data?.launches) ? data.launches : []);
    setUnfiled(data?.unfiled || null);
  }, [token, headers]);

  const fetchSales = useCallback(async () => {
    if (!token || !openId) return;
    const response = await apiFetch(`/api/admin/store/book-launch?launchId=${encodeURIComponent(openId)}`, { headers: headers() });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      adminErrorToast(data?.error || 'Unable to load book launch sales.');
      return;
    }
    setSales(Array.isArray(data?.sales) ? data.sales : []);
    setSummary(data?.summary || FALLBACK_SUMMARY);
    if (Array.isArray(data?.paymentStatuses)) setPaymentStatuses(data.paymentStatuses);
    if (Array.isArray(data?.collectionStatuses)) setCollectionStatuses(data.collectionStatuses);
    if (Array.isArray(data?.media)) setMedia(data.media);
  }, [token, openId, headers]);

  useEffect(() => {
    void fetchLaunches();
  }, [fetchLaunches]);

  useEffect(() => {
    setSales([]);
    setSummary(FALLBACK_SUMMARY);
    setQr('');
    void fetchSales();
  }, [fetchSales]);

  const refreshAll = async () => {
    await Promise.all([fetchLaunches(), fetchSales()]);
  };

  // --- Folders ---

  const openNewLaunch = () => {
    setEditingLaunchId(null);
    setLaunchDraft(EMPTY_LAUNCH);
    setFormError('');
    setLaunchDialogOpen(true);
  };

  const openEditLaunch = (launch: Launch) => {
    setEditingLaunchId(launch.id);
    setLaunchDraft({
      name: launch.name,
      bookTitle: launch.bookTitle || '',
      launchDate: launch.launchDate ? launch.launchDate.slice(0, 10) : '',
      venue: launch.venue || '',
      unitPrice: launch.unitPrice ? String(launch.unitPrice) : '',
      description: launch.description || '',
      formEnabled: launch.formEnabled,
    });
    setFormError('');
    setLaunchDialogOpen(true);
  };

  const saveLaunch = async () => {
    if (!launchDraft.name.trim()) {
      setFormError('Give the book launch a name.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const response = await apiFetch(editingLaunchId ? `/api/admin/store/book-launches/${editingLaunchId}` : '/api/admin/store/book-launches', {
        method: editingLaunchId ? 'PUT' : 'POST',
        headers: headers(),
        body: JSON.stringify({ ...launchDraft, unitPrice: launchDraft.unitPrice === '' ? 0 : Number(launchDraft.unitPrice), launchDate: launchDraft.launchDate || null }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setFormError(data?.error || 'Unable to save this book launch.');
        return;
      }
      setLaunchDialogOpen(false);
      adminSuccessToast(editingLaunchId ? 'Book launch updated.' : 'Book launch folder created.');
      await fetchLaunches();
      if (!editingLaunchId && data?.launch?.id) setOpenId(data.launch.id);
    } finally {
      setSaving(false);
    }
  };

  const removeLaunch = (launch: Launch) => {
    confirmDeleteToast({
      title: `Delete the ${launch.name} folder?`,
      description: launch.summary.count ? `Its ${launch.summary.count} sales are kept and move to Earlier sales.` : 'The folder has no sales.',
      onConfirm: async () => {
        const response = await apiFetch(`/api/admin/store/book-launches/${launch.id}`, { method: 'DELETE', headers: headers() });
        if (!response.ok) {
          adminErrorToast('Unable to delete this folder.');
          return;
        }
        setOpenId(null);
        await fetchLaunches();
      },
    });
  };

  const showQr = async (launch: Launch) => {
    const QRCode = (await import('qrcode')).default;
    setQr(await QRCode.toDataURL(formUrl(launch), { margin: 1, width: 480 }));
  };

  // --- Sales ---

  const unitPrice = openLaunch?.unitPrice || 0;

  const openAddSale = () => {
    setEditingSaleId(null);
    setSaleDraft({ ...EMPTY_SALE, amount: unitPrice ? String(unitPrice) : '' });
    setFormError('');
    setSaleDialogOpen(true);
  };

  const editSale = (sale: BookLaunchSale) => {
    setEditingSaleId(sale.id);
    setSaleDraft({
      name: sale.name,
      quantity: String(sale.quantity ?? 1),
      amount: String(sale.amount ?? 0),
      contact: sale.contact || '',
      paymentStatus: sale.paymentStatus || 'not paid',
      collectionStatus: sale.collectionStatus || 'not collected',
      medium: sale.medium || '',
    });
    setFormError('');
    setSaleDialogOpen(true);
  };

  const saveSale = async () => {
    if (!saleDraft.name.trim()) return setFormError('Enter the name.');
    if (!Number.isInteger(Number(saleDraft.quantity)) || Number(saleDraft.quantity) < 1) return setFormError('Quantity must be a whole number of at least 1.');
    if (saleDraft.amount.trim() === '' || !Number.isFinite(Number(saleDraft.amount)) || Number(saleDraft.amount) < 0) return setFormError('Enter the amount.');
    setSaving(true);
    setFormError('');
    try {
      const response = await apiFetch(editingSaleId ? `/api/admin/store/book-launch/${editingSaleId}` : '/api/admin/store/book-launch', {
        method: editingSaleId ? 'PUT' : 'POST',
        headers: headers(),
        body: JSON.stringify({
          name: saleDraft.name.trim(),
          quantity: Number(saleDraft.quantity),
          amount: Number(saleDraft.amount),
          contact: saleDraft.contact.trim(),
          paymentStatus: saleDraft.paymentStatus,
          collectionStatus: saleDraft.collectionStatus,
          medium: saleDraft.medium,
          ...(editingSaleId ? {} : { launchId: openId === UNFILED ? null : openId }),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setFormError(data?.error || 'Unable to save this sale.');
        return;
      }
      setSaleDialogOpen(false);
      adminSuccessToast(editingSaleId ? 'Sale updated.' : 'Sale added.');
      await refreshAll();
    } finally {
      setSaving(false);
    }
  };

  const removeSale = (sale: BookLaunchSale) => {
    confirmDeleteToast({
      title: `Delete ${sale.name}?`,
      description: 'This removes the book launch sale.',
      onConfirm: async () => {
        const response = await apiFetch(`/api/admin/store/book-launch/${sale.id}`, { method: 'DELETE', headers: headers() });
        if (!response.ok) {
          adminErrorToast('Unable to delete this sale.');
          return;
        }
        await refreshAll();
      },
    });
  };

  const exportSales = async (format: 'excel' | 'pdf') => {
    if (sales.length === 0) {
      adminErrorToast('There are no sales to export.');
      return;
    }
    const folderName = openLaunch?.name || 'Earlier sales';
    const columns: ExportColumn[] = [
      { key: 'name', label: 'Name' },
      { key: 'quantity', label: 'Qty' },
      { key: 'amount', label: 'Amount' },
      { key: 'contact', label: 'Contact' },
      { key: 'paymentStatus', label: 'Payment status' },
      { key: 'collectionStatus', label: 'Collection status' },
      { key: 'medium', label: 'Medium' },
    ];
    const blank = { name: '', quantity: '', amount: '', contact: '', paymentStatus: '', collectionStatus: '', medium: '' };
    const rows = [
      ...sales.map((sale) => ({
        name: sale.name,
        quantity: String(sale.quantity),
        amount: money(sale.amount),
        contact: sale.contact || '',
        paymentStatus: sale.paymentStatus,
        collectionStatus: sale.collectionStatus,
        medium: sale.medium || '',
      })),
      blank,
      { ...blank, name: 'TOTAL', quantity: String(summary.quantity), amount: money(summary.total) },
      { ...blank, name: 'PAID', amount: money(summary.paid) },
      { ...blank, name: 'OUTSTANDING', amount: money(summary.outstanding) },
    ];
    const slug = folderName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const day = new Date().toISOString().slice(0, 10);
    if (format === 'excel') {
      downloadRegistrationsExcel({ fileName: `${slug}-sales-${day}.xls`, sheetName: folderName.slice(0, 30), columns, rows });
      return;
    }
    await downloadRegistrationsPdf({ title: `${folderName}: book launch sales`, fileName: `${slug}-sales-${day}.pdf`, columns, rows });
  };

  if (!token) {
    return <AdminLoginCard email={email} password={password} loginError={loginError} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={handleLogin} />;
  }

  // --- Folder list ---
  if (!openId) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-foreground/60">One folder per book launch. Open a folder to record its sales or share its order form.</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void fetchLaunches()}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
            <Button type="button" onClick={openNewLaunch}><FolderPlus className="mr-2 h-4 w-4" /> New book launch</Button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {launches.map((launch) => (
            <button
              key={launch.id}
              type="button"
              onClick={() => setOpenId(launch.id)}
              className="group rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Folder className="h-5 w-5 shrink-0 text-[#c9a227] group-hover:hidden" />
                  <FolderOpen className="hidden h-5 w-5 shrink-0 text-[#c9a227] group-hover:block" />
                  <p className="truncate font-semibold">{launch.name}</p>
                </div>
                {launch.formEnabled ? <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">Form open</span> : null}
              </div>
              {launch.bookTitle ? <p className="mt-1 truncate text-sm text-muted-foreground">{launch.bookTitle}</p> : null}
              <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                {launch.launchDate ? <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{formatDate(launch.launchDate)}</span> : null}
                {launch.venue ? <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{launch.venue}</span> : null}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
                <div><p className="text-sm font-bold">{launch.summary.quantity}</p><p className="text-[10px] uppercase text-muted-foreground">Copies</p></div>
                <div><p className="text-sm font-bold">{money(launch.summary.paid)}</p><p className="text-[10px] uppercase text-muted-foreground">Paid</p></div>
                <div><p className={cn('text-sm font-bold', launch.summary.outstanding > 0 && 'text-amber-600')}>{money(launch.summary.outstanding)}</p><p className="text-[10px] uppercase text-muted-foreground">Owing</p></div>
              </div>
            </button>
          ))}
          {unfiled ? (
            <button type="button" onClick={() => setOpenId(UNFILED)} className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-left">
              <div className="flex items-center gap-2"><Folder className="h-5 w-5 text-muted-foreground" /><p className="font-semibold">Earlier sales</p></div>
              <p className="mt-1 text-sm text-muted-foreground">Sales recorded before folders. Edit a sale to keep it, or delete it.</p>
              <p className="mt-4 text-sm"><strong>{unfiled.count}</strong> sales · {money(unfiled.total)}</p>
            </button>
          ) : null}
          {launches.length === 0 && !unfiled ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
              No book launches yet. Create a folder for the first launch.
            </div>
          ) : null}
        </div>
        {renderLaunchDialog()}
      </div>
    );
  }

  // --- Inside a folder ---
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <button type="button" onClick={() => setOpenId(null)} className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> All book launches
          </button>
          <h2 className="flex items-center gap-2 text-xl font-semibold"><FolderOpen className="h-5 w-5 text-[#c9a227]" />{openLaunch?.name || 'Earlier sales'}</h2>
          {openLaunch ? (
            <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              {openLaunch.bookTitle ? <span>{openLaunch.bookTitle}</span> : null}
              {openLaunch.launchDate ? <span>{formatDate(openLaunch.launchDate)}</span> : null}
              {openLaunch.venue ? <span>{openLaunch.venue}</span> : null}
              {openLaunch.unitPrice ? <span>{money(openLaunch.unitPrice)} per copy</span> : null}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void exportSales('excel')}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void exportSales('pdf')}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
          {openLaunch ? (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => openEditLaunch(openLaunch)}><Pencil className="mr-2 h-4 w-4" /> Edit folder</Button>
              <Button type="button" variant="outline" size="sm" className="text-destructive" onClick={() => removeLaunch(openLaunch)}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
            </>
          ) : null}
          <Button type="button" onClick={openAddSale}><Plus className="mr-2 h-4 w-4" /> Add sale</Button>
        </div>
      </div>

      {openLaunch ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Order form</p>
            <p className="text-xs text-muted-foreground">
              {openLaunch.formEnabled ? 'Share this link or QR code. Orders land in this folder as not paid, ready for you to confirm.' : 'The form is closed. Edit the folder to open it.'}
            </p>
            <p className="mt-2 truncate font-mono text-xs">{formUrl(openLaunch)}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" onClick={() => void navigator.clipboard.writeText(formUrl(openLaunch)).then(() => adminSuccessToast('Form link copied.'))}><Copy className="h-4 w-4" /> Copy</Button>
            <Button size="sm" variant="outline" asChild><a href={formUrl(openLaunch)} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Open</a></Button>
            <Button size="sm" variant="outline" onClick={() => void showQr(openLaunch)}><QrCode className="h-4 w-4" /> QR code</Button>
          </div>
          {qr ? (
            <a href={qr} download={`${openLaunch.formSlug}-order-form-qr.png`} className="shrink-0 text-center text-[11px] text-muted-foreground" title="Download QR code">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Order form QR code" className="mx-auto h-28 w-28 rounded border border-border bg-white p-1" />
              Download
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Orders', String(summary.count)],
          ['Copies', String(summary.quantity)],
          ['Total', money(summary.total)],
          ['Paid', money(summary.paid)],
          ['Outstanding', money(summary.outstanding)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border/60 bg-card px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-foreground/50">{label}</p>
            <p className="mt-1 text-lg font-semibold">{value}</p>
          </div>
        ))}
      </div>

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
                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-foreground/60">No sales in this folder yet. Use Add sale, or share the order form.</td></tr>
              ) : sales.map((sale) => (
                <tr key={sale.id} className="border-t border-border/60">
                  <td className="px-4 py-3 font-medium">
                    {sale.name}
                    {sale.source === 'form' ? <span className="ml-2 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800">Form</span> : null}
                  </td>
                  <td className="px-4 py-3">{sale.quantity}</td>
                  <td className="whitespace-nowrap px-4 py-3">{money(sale.amount)}</td>
                  <td className="px-4 py-3">{sale.contact || '—'}</td>
                  <td className={cn('px-4 py-3 capitalize', sale.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700')}>{sale.paymentStatus}</td>
                  <td className="px-4 py-3 capitalize">{sale.collectionStatus}</td>
                  <td className="px-4 py-3">{sale.medium || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button type="button" size="icon" variant="ghost" onClick={() => editSale(sale)} aria-label={`Edit ${sale.name}`}><Pencil className="h-4 w-4" /></Button>
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeSale(sale)} aria-label={`Delete ${sale.name}`}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <SchoolAdminDialogShell
        open={saleDialogOpen}
        onOpenChange={(open) => setSaleDialogOpen(open)}
        title={editingSaleId ? 'Edit sale' : `Add sale to ${openLaunch?.name || 'Earlier sales'}`}
        description="Name, quantity, amount, contact, payment, and collection."
        saving={saving}
        saveLabel={saving ? 'Saving...' : editingSaleId ? 'Update sale' : 'Add sale'}
        onSave={() => void saveSale()}
        onCancel={() => setSaleDialogOpen(false)}
        maxWidthClass="sm:max-w-xl"
      >
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span>Name</span>
            <input className={inputClass} value={saleDraft.name} onChange={(event) => setSaleDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="Buyer name" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>Qty</span>
              <input
                className={inputClass}
                type="number"
                min="1"
                step="1"
                value={saleDraft.quantity}
                onChange={(event) => {
                  const quantity = event.target.value;
                  // Keep the amount in step with the launch price while it has not been typed over.
                  setSaleDraft((prev) => ({
                    ...prev,
                    quantity,
                    amount: unitPrice && (prev.amount === '' || Number(prev.amount) === unitPrice * Number(prev.quantity)) ? String(unitPrice * (Number(quantity) || 0)) : prev.amount,
                  }));
                }}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Amount (MWK)</span>
              <input className={inputClass} type="number" min="0" step="0.01" value={saleDraft.amount} onChange={(event) => setSaleDraft((prev) => ({ ...prev, amount: event.target.value }))} />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span>Contact</span>
            <input className={inputClass} value={saleDraft.contact} onChange={(event) => setSaleDraft((prev) => ({ ...prev, contact: event.target.value }))} placeholder="Phone number" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>Payment status</span>
              <select className={cn(inputClass, 'capitalize')} value={saleDraft.paymentStatus} onChange={(event) => setSaleDraft((prev) => ({ ...prev, paymentStatus: event.target.value }))}>
                {paymentStatuses.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span>Collection status</span>
              <select className={cn(inputClass, 'capitalize')} value={saleDraft.collectionStatus} onChange={(event) => setSaleDraft((prev) => ({ ...prev, collectionStatus: event.target.value }))}>
                {collectionStatuses.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
              </select>
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span>Medium</span>
            <select className={inputClass} value={saleDraft.medium} onChange={(event) => setSaleDraft((prev) => ({ ...prev, medium: event.target.value }))}>
              <option value="">Not set</option>
              {media.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
            </select>
          </label>
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        </div>
      </SchoolAdminDialogShell>
      {renderLaunchDialog()}
    </div>
  );

  function renderLaunchDialog() {
    return (
      <SchoolAdminDialogShell
        open={launchDialogOpen}
        onOpenChange={(open) => setLaunchDialogOpen(open)}
        title={editingLaunchId ? 'Edit book launch' : 'New book launch folder'}
        description="The details appear on the public order form for this launch."
        saving={saving}
        saveLabel={saving ? 'Saving...' : editingLaunchId ? 'Save folder' : 'Create folder'}
        onSave={() => void saveLaunch()}
        onCancel={() => setLaunchDialogOpen(false)}
        maxWidthClass="sm:max-w-xl"
      >
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span>Launch name</span>
            <input className={inputClass} value={launchDraft.name} onChange={(event) => setLaunchDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="e.g. Hope Rising book launch 2026" />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Book title</span>
            <input className={inputClass} value={launchDraft.bookTitle} onChange={(event) => setLaunchDraft((prev) => ({ ...prev, bookTitle: event.target.value }))} />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm">
              <span>Launch date</span>
              <input className={inputClass} type="date" value={launchDraft.launchDate} onChange={(event) => setLaunchDraft((prev) => ({ ...prev, launchDate: event.target.value }))} />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span>Venue</span>
              <input className={inputClass} value={launchDraft.venue} onChange={(event) => setLaunchDraft((prev) => ({ ...prev, venue: event.target.value }))} />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span>Price per copy (MWK)</span>
            <input className={inputClass} type="number" min="0" value={launchDraft.unitPrice} onChange={(event) => setLaunchDraft((prev) => ({ ...prev, unitPrice: event.target.value }))} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Note on the order form</span>
            <textarea className={inputClass} rows={3} value={launchDraft.description} onChange={(event) => setLaunchDraft((prev) => ({ ...prev, description: event.target.value }))} placeholder="Payment details, collection instructions..." />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={launchDraft.formEnabled} onChange={(event) => setLaunchDraft((prev) => ({ ...prev, formEnabled: event.target.checked }))} />
            Order form is open for orders
          </label>
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        </div>
      </SchoolAdminDialogShell>
    );
  }
}
