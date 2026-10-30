'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  FileText,
  Globe,
  HandCoins,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Store,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiFetch } from '@/lib/api';
import { downloadRegistrationsExcel, downloadRegistrationsPdf, type ExportColumn } from '@/lib/event-registration-export';

type SaleSource = 'in-person' | 'online';

type BrandedSale = {
  id: string;
  source: SaleSource;
  itemId?: string | null;
  itemName: string;
  unitPrice: number;
  quantity: number;
  amount: number;
  buyerName: string;
  contact?: string | null;
  email?: string | null;
  paymentStatus: string;
  collectionStatus?: string | null;
  medium?: string | null;
  note?: string | null;
  soldAt: string;
};

type BrandedItem = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  isActive: boolean;
};

type Draft = {
  itemId: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  buyerName: string;
  contact: string;
  paymentStatus: string;
  collectionStatus: string;
  medium: string;
  soldAt: string;
  note: string;
};

type View = 'sales' | 'buyers';

const LOW_STOCK = 5;
const inputClass = 'rounded-xl border border-border bg-background px-3 py-2';

const money = (value: number) => `MWK ${Math.round(Number(value || 0)).toLocaleString()}`;

function today() {
  const now = new Date();
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function emptyDraft(): Draft {
  return {
    itemId: '',
    quantity: '1',
    unitPrice: '',
    amount: '',
    buyerName: '',
    contact: '',
    paymentStatus: 'paid',
    collectionStatus: 'collected',
    medium: 'Cash',
    soldAt: today(),
    note: '',
  };
}

function formatDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function dayKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
}

const isPaid = (sale: BrandedSale) => sale.paymentStatus === 'paid';
// Cancelled website checkouts never became sales, so they stay out of every total.
const counts = (sale: BrandedSale) => sale.paymentStatus !== 'cancelled';

function PaymentChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    'not paid': 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    cancelled: 'bg-muted text-foreground/60',
  };
  const Icon = status === 'paid' ? CheckCircle2 : status === 'cancelled' ? AlertTriangle : Clock3;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[status] || 'bg-muted text-foreground/70'}`}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

function summarize(sales: BrandedSale[]) {
  const counted = sales.filter(counts);
  const total = counted.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  const paid = counted.filter(isPaid).reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  const quantity = counted.reduce((sum, sale) => sum + Number(sale.quantity || 0), 0);
  const buyers = new Set(counted.map((sale) => (sale.email || sale.contact || sale.buyerName).trim().toLowerCase()));
  const notCollected = counted.filter((sale) => sale.source === 'in-person' && sale.collectionStatus === 'not collected').length;
  return {
    sales: counted.length,
    total,
    paid,
    outstanding: total - paid,
    quantity,
    buyers: buyers.size,
    average: counted.length ? total / counted.length : 0,
    online: counted.filter((sale) => sale.source === 'online').reduce((sum, sale) => sum + Number(sale.amount || 0), 0),
    inPerson: counted.filter((sale) => sale.source === 'in-person').reduce((sum, sale) => sum + Number(sale.amount || 0), 0),
    notCollected,
  };
}

function buyerBoard(sales: BrandedSale[]) {
  const board = new Map<string, { name: string; contact: string; orders: number; items: number; total: number; paid: number; last: string; bought: Set<string> }>();
  for (const sale of sales.filter(counts)) {
    const key = (sale.email || sale.contact || sale.buyerName).trim().toLowerCase();
    const entry = board.get(key) || { name: sale.buyerName, contact: sale.contact || sale.email || '', orders: 0, items: 0, total: 0, paid: 0, last: sale.soldAt, bought: new Set<string>() };
    entry.orders += 1;
    entry.items += Number(sale.quantity || 0);
    entry.total += Number(sale.amount || 0);
    if (isPaid(sale)) entry.paid += Number(sale.amount || 0);
    if (new Date(sale.soldAt) > new Date(entry.last)) entry.last = sale.soldAt;
    entry.bought.add(sale.itemName);
    board.set(key, entry);
  }
  return [...board.values()].sort((a, b) => b.total - a.total);
}

function itemBoard(sales: BrandedSale[]) {
  const board = new Map<string, { name: string; quantity: number; total: number }>();
  for (const sale of sales.filter(counts)) {
    const entry = board.get(sale.itemName) || { name: sale.itemName, quantity: 0, total: 0 };
    entry.quantity += Number(sale.quantity || 0);
    entry.total += Number(sale.amount || 0);
    board.set(sale.itemName, entry);
  }
  return [...board.values()].sort((a, b) => b.total - a.total);
}

export default function BrandedSalesPage() {
  const { token, email, password, loginError, setEmail, setPassword, handleLogin } = useAdminAuth();
  const [sales, setSales] = useState<BrandedSale[]>([]);
  const [items, setItems] = useState<BrandedItem[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState(['paid', 'not paid']);
  const [collectionStatuses, setCollectionStatuses] = useState(['collected', 'not collected']);
  const [media, setMedia] = useState(['Bank', 'Cash', 'Airtel money']);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [view, setView] = useState<View>('sales');
  const [query, setQuery] = useState('');
  const [itemFilter, setItemFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'' | SaleSource>('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchSales = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiFetch('/api/admin/store/branded-sales', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus(data?.error || 'Unable to load branded item sales.');
        return;
      }
      setSales(Array.isArray(data?.sales) ? data.sales : []);
      setItems(Array.isArray(data?.items) ? data.items : []);
      if (Array.isArray(data?.paymentStatuses)) setPaymentStatuses(data.paymentStatuses);
      if (Array.isArray(data?.collectionStatuses)) setCollectionStatuses(data.collectionStatuses);
      if (Array.isArray(data?.media)) setMedia(data.media);
    } catch {
      setStatus('Unable to load branded item sales.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const id = setTimeout(() => void fetchSales(), 0);
    return () => clearTimeout(id);
  }, [fetchSales]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sales.filter((sale) => {
      if (itemFilter && sale.itemName !== itemFilter) return false;
      if (sourceFilter && sale.source !== sourceFilter) return false;
      if (paymentFilter && sale.paymentStatus !== paymentFilter) return false;
      const day = dayKey(sale.soldAt);
      if (fromDate && day < fromDate) return false;
      if (toDate && day > toDate) return false;
      if (!needle) return true;
      return [sale.buyerName, sale.contact, sale.email, sale.itemName, sale.note]
        .some((value) => String(value || '').toLowerCase().includes(needle));
    });
  }, [fromDate, itemFilter, paymentFilter, query, sales, sourceFilter, toDate]);

  const summary = useMemo(() => summarize(visible), [visible]);
  const buyers = useMemo(() => buyerBoard(visible), [visible]);
  const bestSellers = useMemo(() => itemBoard(visible).slice(0, 6), [visible]);
  const itemNames = useMemo(() => [...new Set([...items.map((item) => item.name), ...sales.map((sale) => sale.itemName)])], [items, sales]);
  const lowStock = items.filter((item) => item.isActive && item.stock <= LOW_STOCK).sort((a, b) => a.stock - b.stock);
  const filtersOn = Boolean(query || itemFilter || sourceFilter || paymentFilter || fromDate || toDate);
  const topSellerTotal = bestSellers[0]?.total || 0;
  const selectedItem = items.find((item) => item.id === draft.itemId);

  const resetFilters = () => {
    setQuery('');
    setItemFilter('');
    setSourceFilter('');
    setPaymentFilter('');
    setFromDate('');
    setToDate('');
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setDraft(emptyDraft());
    setFormError('');
  };

  const openAddDialog = () => {
    setEditingId(null);
    const first = items.find((item) => item.isActive && item.stock > 0) || items[0];
    setDraft({ ...emptyDraft(), itemId: first?.id || '', unitPrice: first ? String(first.price) : '' });
    setFormError('');
    setDialogOpen(true);
  };

  const editSale = (sale: BrandedSale) => {
    setEditingId(sale.id);
    setDraft({
      itemId: sale.itemId || '',
      quantity: String(sale.quantity || 1),
      unitPrice: String(sale.unitPrice ?? ''),
      amount: String(sale.amount ?? ''),
      buyerName: sale.buyerName,
      contact: sale.contact || '',
      paymentStatus: sale.paymentStatus || 'not paid',
      collectionStatus: sale.collectionStatus || 'not collected',
      medium: sale.medium || '',
      soldAt: dayKey(sale.soldAt) || today(),
      note: sale.note || '',
    });
    setFormError('');
    setDialogOpen(true);
  };

  const salePayload = (source: Draft) => ({
    itemId: source.itemId,
    quantity: Number(source.quantity),
    unitPrice: source.unitPrice.trim() === '' ? '' : Number(source.unitPrice),
    amount: source.amount.trim() === '' ? '' : Number(source.amount),
    buyerName: source.buyerName.trim(),
    contact: source.contact.trim(),
    paymentStatus: source.paymentStatus,
    collectionStatus: source.collectionStatus,
    medium: source.medium,
    soldAt: source.soldAt ? new Date(`${source.soldAt}T12:00:00`).toISOString() : undefined,
    note: source.note.trim(),
  });

  const saveSale = async () => {
    if (!token) return;
    if (!draft.itemId) {
      setFormError('Choose the item sold.');
      return;
    }
    if (!draft.buyerName.trim()) {
      setFormError("Enter the buyer's name.");
      return;
    }
    if (!Number.isInteger(Number(draft.quantity)) || Number(draft.quantity) < 1) {
      setFormError('Quantity must be a whole number of at least 1.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const response = await apiFetch(editingId ? `/api/admin/store/branded-sales/${editingId}` : '/api/admin/store/branded-sales', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(salePayload(draft)),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setFormError(data?.error || 'Unable to save this sale.');
        return;
      }
      setStatus(editingId ? 'Sale updated.' : `Sale recorded for ${draft.buyerName.trim()}. Stock was updated.`);
      closeDialog();
      await fetchSales();
    } catch {
      setFormError('Unable to save this sale.');
    } finally {
      setSaving(false);
    }
  };

  // One-click "Mark paid" / "Mark collected" for in-person sales.
  const quickUpdate = async (sale: BrandedSale, changes: Partial<Draft>) => {
    if (!token) return;
    setBusyId(sale.id);
    try {
      const current: Draft = {
        itemId: sale.itemId || '',
        quantity: String(sale.quantity),
        unitPrice: String(sale.unitPrice),
        amount: String(sale.amount),
        buyerName: sale.buyerName,
        contact: sale.contact || '',
        paymentStatus: sale.paymentStatus,
        collectionStatus: sale.collectionStatus || 'not collected',
        medium: sale.medium || '',
        soldAt: dayKey(sale.soldAt),
        note: sale.note || '',
      };
      const response = await apiFetch(`/api/admin/store/branded-sales/${sale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...salePayload({ ...current, ...changes }), itemName: sale.itemName }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus(data?.error || 'Unable to update this sale.');
        return;
      }
      await fetchSales();
    } finally {
      setBusyId(null);
    }
  };

  const removeSale = (sale: BrandedSale) => {
    if (!token) return;
    confirmDeleteToast({
      title: `Delete the sale to ${sale.buyerName}?`,
      description: `${sale.quantity} × ${sale.itemName} will be returned to stock.`,
      onConfirm: async () => {
        const response = await apiFetch(`/api/admin/store/branded-sales/${sale.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          setStatus('Unable to delete this sale.');
          return;
        }
        setStatus('Sale deleted and stock returned.');
        await fetchSales();
      },
    });
  };

  const exportScope = () => {
    const parts = [
      itemFilter,
      sourceFilter === 'online' ? 'Website orders' : sourceFilter === 'in-person' ? 'In-person sales' : '',
      paymentFilter,
      fromDate || toDate ? `${fromDate ? formatDay(fromDate) : 'start'} to ${toDate ? formatDay(toDate) : 'today'}` : '',
    ].filter(Boolean);
    return parts.length ? ` (${parts.join(', ')})` : '';
  };

  const exportSales = async (format: 'excel' | 'pdf') => {
    if (visible.length === 0) {
      setStatus('There are no sales to export.');
      return;
    }
    const columns: ExportColumn[] = [
      { key: 'date', label: 'Date' },
      { key: 'buyer', label: 'Buyer' },
      { key: 'contact', label: 'Contact' },
      { key: 'item', label: 'Item' },
      { key: 'quantity', label: 'Qty' },
      { key: 'amount', label: 'Amount' },
      { key: 'payment', label: 'Payment' },
      { key: 'collection', label: 'Collection' },
      { key: 'channel', label: 'Sold via' },
    ];
    const blank = Object.fromEntries(columns.map((column) => [column.key, ''])) as Record<string, string>;
    const rows: Array<Record<string, string>> = visible.map((sale) => ({
      date: formatDay(sale.soldAt),
      buyer: sale.buyerName,
      contact: sale.contact || sale.email || '',
      item: sale.itemName,
      quantity: String(sale.quantity),
      amount: money(sale.amount),
      payment: sale.paymentStatus,
      collection: sale.source === 'online' ? 'Website order' : sale.collectionStatus || '',
      channel: sale.source === 'online' ? `Website${sale.medium ? ` · ${sale.medium}` : ''}` : `In person${sale.medium ? ` · ${sale.medium}` : ''}`,
    }));
    rows.push(blank);
    for (const item of itemBoard(visible)) {
      rows.push({ ...blank, buyer: `SOLD — ${item.name}`, item: item.name, quantity: String(item.quantity), amount: money(item.total) });
    }
    rows.push(blank);
    rows.push({ ...blank, buyer: 'TOTAL SALES', quantity: String(summary.quantity), amount: money(summary.total) });
    rows.push({ ...blank, buyer: 'PAID', amount: money(summary.paid) });
    rows.push({ ...blank, buyer: 'OUTSTANDING', amount: money(summary.outstanding) });
    rows.push({ ...blank, buyer: 'NUMBER OF BUYERS', quantity: String(summary.buyers) });

    const day = today();
    const title = `Branded item sales${exportScope()}`;
    if (format === 'excel') {
      downloadRegistrationsExcel({ fileName: `branded-item-sales-${day}.xls`, sheetName: 'Branded item sales', columns, rows });
    } else {
      await downloadRegistrationsPdf({ title, fileName: `branded-item-sales-${day}.pdf`, columns, rows });
    }
  };

  const exportBuyers = async (format: 'excel' | 'pdf') => {
    if (buyers.length === 0) {
      setStatus('There are no buyers to export.');
      return;
    }
    const columns: ExportColumn[] = [
      { key: 'rank', label: '#' },
      { key: 'name', label: 'Buyer' },
      { key: 'contact', label: 'Contact' },
      { key: 'bought', label: 'Items bought' },
      { key: 'items', label: 'Qty' },
      { key: 'total', label: 'Total spent' },
      { key: 'outstanding', label: 'Still owes' },
      { key: 'last', label: 'Last purchase' },
    ];
    const blank = Object.fromEntries(columns.map((column) => [column.key, ''])) as Record<string, string>;
    const rows: Array<Record<string, string>> = buyers.map((buyer, index) => ({
      rank: String(index + 1),
      name: buyer.name,
      contact: buyer.contact,
      bought: [...buyer.bought].join(', '),
      items: String(buyer.items),
      total: money(buyer.total),
      outstanding: buyer.total - buyer.paid > 0 ? money(buyer.total - buyer.paid) : '',
      last: formatDay(buyer.last),
    }));
    rows.push(blank);
    rows.push({ ...blank, name: `TOTAL — ${buyers.length} buyers`, items: String(summary.quantity), total: money(summary.total), outstanding: money(summary.outstanding) });

    const day = today();
    if (format === 'excel') {
      downloadRegistrationsExcel({ fileName: `branded-item-buyers-${day}.xls`, sheetName: 'Buyers', columns, rows });
    } else {
      await downloadRegistrationsPdf({ title: `Branded item buyers${exportScope()}`, fileName: `branded-item-buyers-${day}.pdf`, columns, rows });
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

  const kpis = [
    { key: 'total', label: 'Total sales', value: money(summary.total), hint: `${summary.sales.toLocaleString()} sales · avg ${money(summary.average)}`, icon: Banknote },
    { key: 'paid', label: 'Money received', value: money(summary.paid), hint: summary.total ? `${Math.round((summary.paid / summary.total) * 100)}% of sales paid` : 'Paid sales', icon: HandCoins },
    { key: 'outstanding', label: 'Still owed', value: money(summary.outstanding), hint: summary.notCollected ? `${summary.notCollected} not collected yet` : 'Unpaid in-person sales', icon: Clock3 },
    { key: 'items', label: 'Items sold', value: summary.quantity.toLocaleString(), hint: `${summary.buyers.toLocaleString()} buyers`, icon: Package },
  ];

  const draftQuantity = Number(draft.quantity) || 0;
  const draftUnit = draft.unitPrice.trim() === '' ? Number(selectedItem?.price || 0) : Number(draft.unitPrice);
  const draftTotal = draft.amount.trim() === '' ? draftUnit * draftQuantity : Number(draft.amount);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-foreground/60">
          Record shirts, caps, and other branded items sold in person. Website orders for branded items show up here on their own.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void fetchSales()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button type="button" onClick={openAddDialog} disabled={items.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Record sale
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.key} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-foreground/50">{kpi.label}</p>
              <p className="mt-1 text-2xl font-semibold leading-none text-foreground tabular-nums">{loading ? '—' : kpi.value}</p>
              <p className="mt-2 text-xs text-foreground/60">{kpi.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Best sellers</h2>
            <span className="text-xs text-foreground/50">by money taken</span>
          </div>
          {bestSellers.length === 0 ? (
            <p className="mt-4 text-sm text-foreground/60">No sales yet{filtersOn ? ' for these filters' : ''}.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {bestSellers.map((item) => (
                <li key={item.name} title={`${item.name}: ${item.quantity} sold, ${money(item.total)}`}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-foreground">{item.name}</span>
                    <span className="shrink-0 tabular-nums text-foreground/70">
                      {money(item.total)} <span className="text-foreground/50">· {item.quantity} sold</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${topSellerTotal ? Math.max(3, (item.total / topSellerTotal) * 100) : 0}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid gap-3">
          <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">Where sales came from</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-2 text-foreground/70"><Store className="h-4 w-4" /> In person</dt>
                <dd className="font-semibold tabular-nums">{money(summary.inPerson)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-2 text-foreground/70"><Globe className="h-4 w-4" /> Website orders</dt>
                <dd className="font-semibold tabular-nums">{money(summary.online)}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-foreground">Running low</h2>
            </div>
            {lowStock.length === 0 ? (
              <p className="mt-3 text-sm text-foreground/60">Every item has more than {LOW_STOCK} in stock.</p>
            ) : (
              <ul className="mt-3 space-y-1.5 text-sm">
                {lowStock.slice(0, 5).map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3">
                    <span className="truncate text-foreground/80">{item.name}</span>
                    <span className={`shrink-0 font-semibold tabular-nums ${item.stock === 0 ? 'text-destructive' : 'text-amber-700 dark:text-amber-300'}`}>
                      {item.stock === 0 ? 'Sold out' : `${item.stock} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {status ? <p className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground/70">{status}</p> : null}

      <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-2">
          <label className="relative grow basis-56 text-sm">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search buyer, contact, or item" className={`${inputClass} w-full pl-9 text-sm`} />
          </label>
          <select aria-label="Item" value={itemFilter} onChange={(event) => setItemFilter(event.target.value)} className={`${inputClass} text-sm`}>
            <option value="">All items</option>
            {itemNames.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select aria-label="Sold via" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as '' | SaleSource)} className={`${inputClass} text-sm`}>
            <option value="">In person & website</option>
            <option value="in-person">In person</option>
            <option value="online">Website orders</option>
          </select>
          <select aria-label="Payment" value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className={`${inputClass} text-sm capitalize`}>
            <option value="">Any payment</option>
            <option value="paid">Paid</option>
            <option value="not paid">Not paid</option>
            <option value="pending">Pending (website)</option>
            <option value="cancelled">Cancelled (website)</option>
          </select>
          <label className="text-xs text-foreground/60">
            From
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className={`${inputClass} mt-1 block text-sm`} />
          </label>
          <label className="text-xs text-foreground/60">
            To
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className={`${inputClass} mt-1 block text-sm`} />
          </label>
          {filtersOn ? (
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>Clear filters</Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
          <div className="flex gap-1 rounded-full bg-muted p-1" role="tablist" aria-label="View">
            {([
              { key: 'sales', label: `Sales (${visible.length})`, icon: Package },
              { key: 'buyers', label: `Buyers (${buyers.length})`, icon: Users },
            ] as const).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={view === tab.key}
                  onClick={() => setView(tab.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${view === tab.key ? 'bg-background text-foreground shadow-sm' : 'text-foreground/60 hover:text-foreground'}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void (view === 'sales' ? exportSales('excel') : exportBuyers('excel'))}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void (view === 'sales' ? exportSales('pdf') : exportBuyers('pdf'))}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        {view === 'sales' ? (
          <div className="overflow-auto rounded-xl border border-border/60">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-foreground/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Collection</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {loading && sales.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-foreground/60">Loading sales...</td></tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-foreground/60">
                      {sales.length === 0
                        ? items.length === 0
                          ? 'Add your branded items first, then record sales here.'
                          : 'No branded item sales yet. Use Record sale to add the first one.'
                        : 'No sales match these filters.'}
                    </td>
                  </tr>
                ) : visible.map((sale) => (
                  <tr key={sale.id} className={`border-t border-border/60 align-top ${sale.paymentStatus === 'cancelled' ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(sale.buyerName)}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{sale.buyerName}</p>
                          <p className="text-xs text-foreground/60">{sale.contact || sale.email || 'No contact'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{sale.itemName}</p>
                      <p className="inline-flex items-center gap-1 text-xs text-foreground/50">
                        {sale.source === 'online' ? <Globe className="h-3 w-3" /> : <Store className="h-3 w-3" />}
                        {sale.source === 'online' ? 'Website' : 'In person'}{sale.medium ? ` · ${sale.medium}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{sale.quantity}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums">{money(sale.amount)}</td>
                    <td className="px-4 py-3">
                      <PaymentChip status={sale.paymentStatus} />
                      {sale.source === 'in-person' && sale.paymentStatus !== 'paid' ? (
                        <button type="button" disabled={busyId === sale.id} onClick={() => void quickUpdate(sale, { paymentStatus: 'paid' })} className="mt-1 block text-xs font-medium text-primary hover:underline disabled:opacity-50">
                          Mark paid
                        </button>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {sale.source === 'online' ? (
                        <span className="text-foreground/50">Website order</span>
                      ) : (
                        <>
                          <span className={`capitalize ${sale.collectionStatus === 'collected' ? 'text-foreground/70' : 'font-medium text-amber-700 dark:text-amber-300'}`}>{sale.collectionStatus}</span>
                          {sale.collectionStatus !== 'collected' ? (
                            <button type="button" disabled={busyId === sale.id} onClick={() => void quickUpdate(sale, { collectionStatus: 'collected' })} className="mt-1 block font-medium text-primary hover:underline disabled:opacity-50">
                              Mark collected
                            </button>
                          ) : null}
                        </>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-foreground/70">{formatDay(sale.soldAt)}</td>
                    <td className="px-4 py-3">
                      {sale.source === 'in-person' ? (
                        <div className="flex justify-end gap-1">
                          <Button type="button" size="icon" variant="ghost" onClick={() => editSale(sale)} aria-label={`Edit sale to ${sale.buyerName}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button type="button" size="icon" variant="ghost" onClick={() => removeSale(sale)} aria-label={`Delete sale to ${sale.buyerName}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
              {visible.length > 0 ? (
                <tfoot className="border-t-2 border-border bg-muted/30 text-sm font-semibold">
                  <tr>
                    <td className="px-4 py-3" colSpan={2}>Total · {summary.buyers} buyers</td>
                    <td className="px-4 py-3 tabular-nums">{summary.quantity}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">{money(summary.total)}</td>
                    <td className="px-4 py-3 text-xs font-normal text-foreground/60" colSpan={4}>
                      {money(summary.paid)} received · {money(summary.outstanding)} still owed
                    </td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        ) : (
          <div className="overflow-auto rounded-xl border border-border/60">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-foreground/60">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Items bought</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Total spent</th>
                  <th className="px-4 py-3 font-medium">Still owes</th>
                  <th className="px-4 py-3 font-medium">Last purchase</th>
                </tr>
              </thead>
              <tbody>
                {buyers.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-foreground/60">No buyers{filtersOn ? ' match these filters' : ' yet'}.</td></tr>
                ) : buyers.map((buyer, index) => (
                  <tr key={`${buyer.name}-${buyer.contact}`} className="border-t border-border/60 align-top">
                    <td className="px-4 py-3 tabular-nums text-foreground/50">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(buyer.name)}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{buyer.name}</p>
                          <p className="text-xs text-foreground/60">{buyer.contact || 'No contact'} · {buyer.orders} {buyer.orders === 1 ? 'purchase' : 'purchases'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-foreground/70">{[...buyer.bought].join(', ')}</td>
                    <td className="px-4 py-3 tabular-nums">{buyer.items}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums">{money(buyer.total)}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                      {buyer.total - buyer.paid > 0 ? <span className="text-amber-700 dark:text-amber-300">{money(buyer.total - buyer.paid)}</span> : <span className="text-foreground/50">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-foreground/70">{formatDay(buyer.last)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={(open) => {
          if (open) setDialogOpen(true);
          else closeDialog();
        }}
        title={editingId ? 'Edit branded item sale' : 'Record a branded item sale'}
        description="Choosing the item fills in its price. The quantity comes out of stock when you save."
        saving={saving}
        saveLabel={saving ? 'Saving...' : editingId ? 'Update sale' : 'Record sale'}
        onSave={() => void saveSale()}
        onCancel={closeDialog}
        maxWidthClass="sm:max-w-xl"
      >
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span>Item</span>
            <select
              className={inputClass}
              value={draft.itemId}
              onChange={(event) => {
                const item = items.find((entry) => entry.id === event.target.value);
                setDraft((prev) => ({ ...prev, itemId: event.target.value, unitPrice: item ? String(item.price) : prev.unitPrice, amount: '' }));
              }}
            >
              <option value="">Choose an item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {money(item.price)} · {item.stock} in stock
                </option>
              ))}
            </select>
            {selectedItem && selectedItem.stock <= LOW_STOCK ? (
              <span className="text-xs text-amber-700 dark:text-amber-300">
                {selectedItem.stock === 0 ? 'This item is sold out.' : `Only ${selectedItem.stock} left in stock.`}
              </span>
            ) : null}
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm">
              <span>Qty</span>
              <input className={inputClass} type="number" min="1" step="1" value={draft.quantity} onChange={(event) => setDraft((prev) => ({ ...prev, quantity: event.target.value, amount: '' }))} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Unit price (MWK)</span>
              <input className={inputClass} type="number" min="0" step="any" value={draft.unitPrice} onChange={(event) => setDraft((prev) => ({ ...prev, unitPrice: event.target.value, amount: '' }))} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Total (MWK)</span>
              <input className={inputClass} type="number" min="0" step="any" value={draft.amount} placeholder={String(draftUnit * draftQuantity || '')} onChange={(event) => setDraft((prev) => ({ ...prev, amount: event.target.value }))} />
            </label>
          </div>
          <p className="-mt-1 text-xs text-foreground/60">
            Total {money(draftTotal)}. Leave Total empty to use quantity × unit price, or type a discounted total.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>Buyer name</span>
              <input className={inputClass} value={draft.buyerName} onChange={(event) => setDraft((prev) => ({ ...prev, buyerName: event.target.value }))} placeholder="Full name" />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Contact</span>
              <input className={inputClass} value={draft.contact} onChange={(event) => setDraft((prev) => ({ ...prev, contact: event.target.value }))} placeholder="Phone number" />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm">
              <span>Payment</span>
              <select className={`${inputClass} capitalize`} value={draft.paymentStatus} onChange={(event) => setDraft((prev) => ({ ...prev, paymentStatus: event.target.value }))}>
                {paymentStatuses.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span>Collection</span>
              <select className={`${inputClass} capitalize`} value={draft.collectionStatus} onChange={(event) => setDraft((prev) => ({ ...prev, collectionStatus: event.target.value }))}>
                {collectionStatuses.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span>Paid with</span>
              <select className={inputClass} value={draft.medium} onChange={(event) => setDraft((prev) => ({ ...prev, medium: event.target.value }))}>
                <option value="">Not set</option>
                {media.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <label className="grid gap-1 text-sm">
              <span>Date sold</span>
              <input className={inputClass} type="date" value={draft.soldAt} onChange={(event) => setDraft((prev) => ({ ...prev, soldAt: event.target.value }))} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Note</span>
              <input className={inputClass} value={draft.note} onChange={(event) => setDraft((prev) => ({ ...prev, note: event.target.value }))} placeholder="Size, colour, or event (optional)" />
            </label>
          </div>
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        </div>
      </SchoolAdminDialogShell>
    </div>
  );
}
