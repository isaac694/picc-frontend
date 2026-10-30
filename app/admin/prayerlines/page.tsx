'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, MessageCircle, Pencil, Phone, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiFetch } from '@/lib/api';

type Prayerline = {
  id: string;
  phoneNumber: string;
  label?: string | null;
  whatsapp: boolean;
  isActive: boolean;
  sortOrder: number;
  whatsappHref?: string | null;
  telHref?: string | null;
};

type Draft = {
  phoneNumber: string;
  label: string;
  whatsapp: boolean;
  isActive: boolean;
};

const EMPTY_DRAFT: Draft = { phoneNumber: '+265 ', label: '', whatsapp: true, isActive: true };
const inputClass = 'rounded-xl border border-border bg-background px-3 py-2';

export default function PrayerlinesAdminPage() {
  const { token, email, password, loginError, setEmail, setPassword, handleLogin } = useAdminAuth();
  const [lines, setLines] = useState<Prayerline[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editing, setEditing] = useState<Prayerline | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const authHeaders = useCallback(
    (json = false): Record<string, string> => ({
      Authorization: `Bearer ${token}`,
      ...(json ? { 'Content-Type': 'application/json' } : {}),
    }),
    [token],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiFetch('/api/admin/prayerlines', { headers: authHeaders() });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus(data?.error || 'Unable to load prayerline numbers.');
        return;
      }
      setLines(Array.isArray(data?.prayerlines) ? data.prayerlines : []);
    } catch {
      setStatus('Unable to load prayerline numbers.');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, token]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setFormError('');
  };

  const openAdd = () => {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (line: Prayerline) => {
    setEditing(line);
    setDraft({ phoneNumber: line.phoneNumber, label: line.label || '', whatsapp: line.whatsapp, isActive: line.isActive });
    setFormError('');
    setDialogOpen(true);
  };

  const save = async () => {
    if (!token) return;
    const digits = draft.phoneNumber.replace(/[^0-9]/g, '');
    if (digits.length < 7) {
      setFormError('Enter the full phone number, for example +265 996 80 08 00.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const response = await apiFetch(editing ? `/api/admin/prayerlines/${editing.id}` : '/api/admin/prayerlines', {
        method: editing ? 'PUT' : 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          phoneNumber: draft.phoneNumber.trim(),
          label: draft.label.trim(),
          whatsapp: draft.whatsapp,
          isActive: draft.isActive,
          ...(editing ? { sortOrder: editing.sortOrder } : {}),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setFormError(data?.error || 'Unable to save this number.');
        return;
      }
      setStatus(editing ? 'Prayerline number updated.' : 'Prayerline number added to the footer.');
      closeDialog();
      await load();
    } catch {
      setFormError('Unable to save this number.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (line: Prayerline) => {
    if (!token) return;
    setBusyId(line.id);
    try {
      const response = await apiFetch(`/api/admin/prayerlines/${line.id}/status`, {
        method: 'PATCH',
        headers: authHeaders(true),
        body: JSON.stringify({ isActive: !line.isActive }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus(data?.error || 'Unable to change this number.');
        return;
      }
      setStatus(line.isActive ? `${line.phoneNumber} is now hidden from the footer.` : `${line.phoneNumber} is now showing in the footer.`);
      setLines((current) => current.map((item) => (item.id === line.id ? { ...item, isActive: !line.isActive } : item)));
    } finally {
      setBusyId(null);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    if (!token) return;
    const target = index + direction;
    if (target < 0 || target >= lines.length) return;
    const next = [...lines];
    [next[index], next[target]] = [next[target], next[index]];
    setLines(next);
    const response = await apiFetch('/api/admin/prayerlines-order', {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify({ ids: next.map((line) => line.id) }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setStatus(data?.error || 'Unable to save the new order.');
      await load();
      return;
    }
    if (Array.isArray(data?.prayerlines)) setLines(data.prayerlines);
  };

  const remove = (line: Prayerline) => {
    if (!token) return;
    confirmDeleteToast({
      title: `Delete ${line.phoneNumber}?`,
      description: 'It will be removed from the website footer. Hide it instead if you may need it again.',
      onConfirm: async () => {
        const response = await apiFetch(`/api/admin/prayerlines/${line.id}`, { method: 'DELETE', headers: authHeaders() });
        if (!response.ok) {
          setStatus('Unable to delete this number.');
          return;
        }
        setStatus('Prayerline number deleted.');
        await load();
      },
    });
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

  const shown = lines.filter((line) => line.isActive);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-foreground/60">
          Active numbers appear under <strong>Prayerline</strong> in the website footer, in the order below.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button type="button" onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add number
          </Button>
        </div>
      </div>

      {status ? <p className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground/70">{status}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          {loading && lines.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-foreground/60">Loading prayerline numbers...</p>
          ) : lines.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Phone className="mx-auto h-8 w-8 text-foreground/30" />
              <p className="mt-3 text-sm text-foreground/60">No prayerline numbers yet. Use Add number to put one in the footer.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {lines.map((line, index) => (
                <li key={line.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${line.isActive ? '' : 'bg-muted/30'}`}>
                  <div className="flex flex-col">
                    <button type="button" onClick={() => void move(index, -1)} disabled={index === 0} className="rounded p-0.5 text-foreground/50 hover:bg-muted hover:text-foreground disabled:opacity-25" aria-label={`Move ${line.phoneNumber} up`}>
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => void move(index, 1)} disabled={index === lines.length - 1} className="rounded p-0.5 text-foreground/50 hover:bg-muted hover:text-foreground disabled:opacity-25" aria-label={`Move ${line.phoneNumber} down`}>
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold tabular-nums ${line.isActive ? 'text-foreground' : 'text-foreground/50 line-through'}`}>{line.phoneNumber}</p>
                    <p className="flex flex-wrap items-center gap-2 text-xs text-foreground/60">
                      {line.label ? <span>{line.label}</span> : null}
                      {line.whatsapp ? (
                        <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Opens WhatsApp</span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> Opens the phone dialler</span>
                      )}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${line.isActive ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-foreground/60'}`}>
                    {line.isActive ? 'Showing' : 'Hidden'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button type="button" size="sm" variant="outline" disabled={busyId === line.id} onClick={() => void toggleActive(line)}>
                      {line.isActive ? <EyeOff className="mr-1.5 h-4 w-4" /> : <Eye className="mr-1.5 h-4 w-4" />}
                      {line.isActive ? 'Hide' : 'Show'}
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => openEdit(line)} aria-label={`Edit ${line.phoneNumber}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => remove(line)} aria-label={`Delete ${line.phoneNumber}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="h-fit rounded-2xl bg-slate-950 p-5 text-white shadow-sm" aria-label="Footer preview">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Footer preview</p>
          <div className="mt-4 flex flex-col gap-1 text-sm text-white/80">
            <span className="font-semibold text-white">Prayerline:</span>
            {shown.length === 0 ? (
              <span className="text-white/50">No numbers showing. The footer hides the Prayerline line.</span>
            ) : (
              shown.map((line) => (
                <span key={line.id} className="underline underline-offset-4">
                  {line.phoneNumber}
                  {line.label ? <span className="ml-1 text-white/50 no-underline">({line.label})</span> : null}
                </span>
              ))
            )}
          </div>
        </aside>
      </div>

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={(open) => {
          if (open) setDialogOpen(true);
          else closeDialog();
        }}
        title={editing ? 'Edit prayerline number' : 'Add prayerline number'}
        description="Use the full number with the country code so it works from outside Malawi."
        saving={saving}
        saveLabel={saving ? 'Saving...' : editing ? 'Update number' : 'Add number'}
        onSave={() => void save()}
        onCancel={closeDialog}
        maxWidthClass="sm:max-w-md"
      >
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span>Phone number</span>
            <input className={`${inputClass} tabular-nums`} type="tel" value={draft.phoneNumber} onChange={(event) => setDraft((prev) => ({ ...prev, phoneNumber: event.target.value }))} placeholder="+265 996 80 08 00" />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Label (optional)</span>
            <input className={inputClass} value={draft.label} onChange={(event) => setDraft((prev) => ({ ...prev, label: event.target.value }))} placeholder="Airtel, TNM, or International" />
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-4 w-4" checked={draft.whatsapp} onChange={(event) => setDraft((prev) => ({ ...prev, whatsapp: event.target.checked }))} />
            <span>
              Open WhatsApp when tapped
              <span className="block text-xs text-foreground/60">Turn off to open the phone dialler instead.</span>
            </span>
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" className="h-4 w-4" checked={draft.isActive} onChange={(event) => setDraft((prev) => ({ ...prev, isActive: event.target.checked }))} />
            Show in the website footer
          </label>
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        </div>
      </SchoolAdminDialogShell>
    </div>
  );
}
