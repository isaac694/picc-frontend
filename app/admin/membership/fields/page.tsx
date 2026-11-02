'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Eye, EyeOff, Pencil, Plus, Power, PowerOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { adminErrorToast, adminSuccessToast, readApiMessage } from '@/components/admin/admin-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiFetch } from '@/lib/api';
import { FIELD_TYPE_LABELS, type MembershipField, type MembershipFieldType } from '@/lib/membership';
import { cn } from '@/lib/utils';

type Draft = { label: string; type: MembershipFieldType; options: string; isRequired: boolean; showInTable: boolean };
const EMPTY: Draft = { label: '', type: 'text', options: '', isRequired: false, showInTable: true };
const inputClass = 'mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm';

export default function MembershipFieldsPage() {
  const { token } = useAdminAuth();
  const [fields, setFields] = useState<MembershipField[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MembershipField | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const headers = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }), [token]);

  const load = useCallback(async () => {
    if (!token) return;
    const response = await apiFetch('/api/admin/membership/fields', { headers });
    if (!response.ok) {
      adminErrorToast(await readApiMessage(response, { fallback: 'Unable to load fields.' }));
      return;
    }
    const data = await response.json();
    setFields(Array.isArray(data.fields) ? data.fields : []);
  }, [headers, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setDraft(EMPTY);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (field: MembershipField) => {
    setEditing(field);
    setDraft({ label: field.label, type: field.type, options: field.options.join('\n'), isRequired: field.isRequired, showInTable: field.showInTable });
    setFormError('');
    setDialogOpen(true);
  };

  const save = async () => {
    if (!draft.label.trim()) return setFormError('Give the field a name.');
    if (draft.type === 'select' && !draft.options.trim()) return setFormError('Add the choices for this dropdown, one per line.');
    setSaving(true);
    try {
      const response = await apiFetch(editing ? `/api/admin/membership/fields/${editing.id}` : '/api/admin/membership/fields', {
        method: editing ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify({ ...draft, options: draft.options.split('\n') }),
      });
      if (!response.ok) {
        setFormError(await readApiMessage(response, { fallback: 'Unable to save this field.' }));
        return;
      }
      adminSuccessToast(editing ? 'Field updated.' : 'Field added. It now appears on the member form.');
      setDialogOpen(false);
      void load();
    } finally {
      setSaving(false);
    }
  };

  const patch = async (field: MembershipField, body: Partial<MembershipField>, message: string) => {
    const response = await apiFetch(`/api/admin/membership/fields/${field.id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
    if (!response.ok) {
      adminErrorToast(await readApiMessage(response, { fallback: 'Unable to update this field.' }));
      return;
    }
    adminSuccessToast(message);
    void load();
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    setFields(next);
    const response = await apiFetch('/api/admin/membership/fields-order', { method: 'PUT', headers, body: JSON.stringify({ ids: next.map((field) => field.id) }) });
    if (!response.ok) {
      adminErrorToast('Unable to save the new order.');
      void load();
    }
  };

  const remove = (field: MembershipField) => {
    confirmDeleteToast({
      title: `Delete the "${field.label}" field?`,
      description: 'Members keep what was already recorded, but the field disappears from forms, the table and downloads. Deactivate it instead if you may need it again.',
      onConfirm: async () => {
        const response = await apiFetch(`/api/admin/membership/fields/${field.id}`, { method: 'DELETE', headers });
        if (!response.ok) {
          adminErrorToast('Unable to delete this field.');
          return;
        }
        adminSuccessToast('Field deleted.');
        void load();
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/admin/membership" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Membership register
          </Link>
          <h1 className="text-2xl font-semibold md:text-3xl">Membership fields</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            The details recorded for every member. Add any field you need; dropdown and yes/no fields are charted on the statistics page automatically.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add field</Button>
      </div>

      <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        {fields.map((field, index) => (
          <li key={field.id} className={cn('flex flex-wrap items-center gap-3 px-4 py-3', !field.isActive && 'bg-muted/40 text-foreground/50')}>
            <div className="flex">
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Move up" disabled={index === 0} onClick={() => void move(index, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Move down" disabled={index === fields.length - 1} onClick={() => void move(index, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{field.label}{field.isRequired ? <span className="text-destructive"> *</span> : null}</p>
              <p className="text-xs text-muted-foreground">
                {FIELD_TYPE_LABELS[field.type]}
                {field.type === 'select' && field.options.length ? ` · ${field.options.join(', ')}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {!field.isActive ? <Badge variant="outline">Deactivated</Badge> : null}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                title={field.showInTable ? 'Shown as a column in the register' : 'Hidden from the register table'}
                aria-label="Toggle table column"
                onClick={() => void patch(field, { showInTable: !field.showInTable }, field.showInTable ? 'Removed from the table.' : 'Shown in the table.')}
              >
                {field.showInTable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                title={field.isActive ? 'Deactivate' : 'Activate'}
                aria-label={field.isActive ? 'Deactivate field' : 'Activate field'}
                onClick={() => void patch(field, { isActive: !field.isActive }, field.isActive ? 'Field deactivated.' : 'Field activated.')}
              >
                {field.isActive ? <Power className="h-4 w-4 text-emerald-600" /> : <PowerOff className="h-4 w-4" />}
              </Button>
              <Button type="button" size="icon" variant="ghost" aria-label="Edit field" onClick={() => openEdit(field)}><Pencil className="h-4 w-4" /></Button>
              <Button type="button" size="icon" variant="ghost" className="text-destructive hover:text-destructive" aria-label="Delete field" onClick={() => remove(field)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </li>
        ))}
      </ul>

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Edit field' : 'Add field'}
        description="Fields appear on the member form in this order."
        saving={saving}
        saveLabel={editing ? 'Save field' : 'Add field'}
        onSave={() => void save()}
        onCancel={() => setDialogOpen(false)}
      >
        <div className="space-y-4">
          {formError ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p> : null}
          <label className="block">
            <span className="text-sm font-medium">Field name</span>
            <input value={draft.label} onChange={(event) => setDraft((prev) => ({ ...prev, label: event.target.value }))} className={inputClass} placeholder="e.g. Cell group" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Type of answer</span>
            <select value={draft.type} onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value as MembershipFieldType }))} className={inputClass}>
              {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {draft.type === 'select' ? (
            <label className="block">
              <span className="text-sm font-medium">Choices (one per line)</span>
              <textarea value={draft.options} onChange={(event) => setDraft((prev) => ({ ...prev, options: event.target.value }))} rows={5} className={inputClass} />
            </label>
          ) : null}
          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={draft.isRequired} onChange={(event) => setDraft((prev) => ({ ...prev, isRequired: event.target.checked }))} /> Required
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={draft.showInTable} onChange={(event) => setDraft((prev) => ({ ...prev, showInTable: event.target.checked }))} /> Show as a column in the register
            </label>
          </div>
        </div>
      </SchoolAdminDialogShell>
    </div>
  );
}
