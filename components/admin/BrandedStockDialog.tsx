'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Minus, Plus } from 'lucide-react';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import { adminSuccessToast, readApiMessage } from '@/components/admin/admin-toast';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

type Movement = {
  id: string;
  change: number;
  stockAfter: number;
  reason: string;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
};

const REASONS = ['restock', 'adjustment', 'damaged', 'returned', 'opening stock'];

/** Restock or correct a branded item's stock, with the history of earlier changes. */
export default function BrandedStockDialog({
  token,
  item,
  onClose,
  onChanged,
}: {
  token: string;
  item: { id: string; name: string; stock: number } | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [direction, setDirection] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('restock');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!item) return;
    setLoading(true);
    try {
      const response = await apiFetch(`/api/admin/store/merchandise/${item.id}/stock`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => null);
      setMovements(Array.isArray(data?.movements) ? data.movements : []);
    } finally {
      setLoading(false);
    }
  }, [item, token]);

  useEffect(() => {
    if (!item) return;
    setDirection('add');
    setQuantity('');
    setReason('restock');
    setNote('');
    setError('');
    void loadHistory();
  }, [item, loadHistory]);

  const save = async () => {
    if (!item) return;
    const amount = Number(quantity);
    if (!Number.isInteger(amount) || amount <= 0) {
      setError('Enter how many items, as a whole number.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await apiFetch(`/api/admin/store/merchandise/${item.id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ change: direction === 'add' ? amount : -amount, reason, note }),
      });
      if (!response.ok) {
        setError(await readApiMessage(response, { fallback: 'Unable to change the stock.' }));
        return;
      }
      const data = await response.json();
      adminSuccessToast(`${item.name}: ${data.stock} now in stock.`);
      onChanged();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const preview = item ? item.stock + (direction === 'add' ? 1 : -1) * (Number(quantity) || 0) : 0;

  return (
    <SchoolAdminDialogShell
      open={Boolean(item)}
      onOpenChange={(open) => !open && onClose()}
      title={item ? `Stock: ${item.name}` : 'Stock'}
      description={item ? `${item.stock} in stock now. Sales reduce stock on their own; use this for deliveries and corrections.` : ''}
      saving={saving}
      saveLabel="Save stock change"
      onSave={() => void save()}
      onCancel={onClose}
      maxWidthClass="sm:max-w-xl"
    >
      <div className="space-y-4">
        {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
        <div className="grid grid-cols-2 gap-2">
          {(['add', 'remove'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setDirection(value);
                setReason(value === 'add' ? 'restock' : 'adjustment');
              }}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold',
                direction === value ? (value === 'add' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-destructive bg-destructive/10 text-destructive') : 'border-border text-foreground/60',
              )}
            >
              {value === 'add' ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              {value === 'add' ? 'Add stock' : 'Remove stock'}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span>How many</span>
            <input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Reason</span>
            <select value={reason} onChange={(event) => setReason(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 capitalize">
              {REASONS.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
            </select>
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          <span>Note (optional)</span>
          <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Delivery from printer, invoice 0142" className="rounded-xl border border-border bg-background px-3 py-2" />
        </label>
        {quantity ? (
          <p className={cn('text-sm font-medium', preview < 0 ? 'text-destructive' : 'text-foreground/70')}>
            Stock after this change: {preview}
          </p>
        ) : null}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">Stock history</p>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : movements.length === 0 ? (
            <p className="text-sm text-foreground/55">No restocks or corrections recorded yet.</p>
          ) : (
            <ul className="max-h-56 divide-y divide-border/60 overflow-auto rounded-xl border border-border/60 text-sm">
              {movements.map((movement) => (
                <li key={movement.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <p className="capitalize">{movement.reason}{movement.note ? <span className="normal-case text-foreground/55"> · {movement.note}</span> : null}</p>
                    <p className="text-xs text-foreground/50">
                      {new Date(movement.createdAt).toLocaleString()}{movement.createdBy ? ` · ${movement.createdBy}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn('font-semibold tabular-nums', movement.change > 0 ? 'text-emerald-600' : 'text-destructive')}>
                      {movement.change > 0 ? '+' : ''}{movement.change}
                    </p>
                    <p className="text-xs text-foreground/50">left {movement.stockAfter}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SchoolAdminDialogShell>
  );
}
