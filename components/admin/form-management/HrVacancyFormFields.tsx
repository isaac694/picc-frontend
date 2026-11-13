'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { adminErrorToast, adminSuccessToast, readApiMessage } from '@/components/admin/admin-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiFetch } from '@/lib/api';
import {
  columnFor,
  HR_FIELD_TYPE_LABELS,
  HR_VACANCY_FIELDS_ENDPOINT,
  parseHrFormFields,
  type HrFieldType,
  type HrFieldWidth,
  type HrFormField,
} from '@/lib/hr-form';
import { VACANCY_STATUSES } from '@/lib/hr-vacancy';
import { cn } from '@/lib/utils';

type Draft = {
  label: string;
  type: HrFieldType;
  placeholder: string;
  helpText: string;
  options: string;
  width: HrFieldWidth;
  isRequired: boolean;
  isActive: boolean;
};

const EMPTY: Draft = { label: '', type: 'text', placeholder: '', helpText: '', options: '', width: 'full', isRequired: false, isActive: true };
const inputClass = 'mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60';
const PLACEHOLDER_TYPES: HrFieldType[] = ['text', 'textarea', 'richtext', 'number', 'email', 'url', 'list'];

/** Settings > Form management > HR form: the fields HR fill in when creating a vacancy. */
export default function HrVacancyFormFields() {
  const { token } = useAdminAuth();
  const [fields, setFields] = useState<HrFormField[]>([]);
  // Only the first load shows "Loading…"; reloads keep the current list on screen.
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HrFormField | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const headers = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }), [token]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const response = await apiFetch(HR_VACANCY_FIELDS_ENDPOINT, { headers, cache: 'no-store' });
      if (!response.ok) {
        adminErrorToast(await readApiMessage(response, { fallback: 'Unable to load the HR form fields.' }));
        return;
      }
      setFields(parseHrFormFields(await response.json()));
    } finally {
      setLoading(false);
    }
  }, [headers, token]);

  useEffect(() => {
    void load();
  }, [load]);

  // The careers pages and publishing rely on these two; say what happens when they are missing.
  const shownColumns = new Set(fields.filter((field) => field.isActive).map(columnFor));
  const warnings = [
    !shownColumns.has('title') && 'There is no Job title field, so new vacancies are named after the first short text answer, or "Untitled vacancy". Add a short text field named "Job title" (or use Reset) to bring it back.',
    !shownColumns.has('status') && 'There is no Status field, so new vacancies are saved as Draft and HR cannot open them for applications. Add a dropdown named "Status" with the choices DRAFT, OPEN, CLOSED, ARCHIVED (or use Reset).',
  ].filter((warning): warning is string => Boolean(warning));

  const openNew = () => {
    setEditing(null);
    setDraft(EMPTY);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (field: HrFormField) => {
    setEditing(field);
    setDraft({
      label: field.label,
      type: field.type,
      placeholder: field.placeholder,
      helpText: field.helpText,
      options: field.options.join('\n'),
      width: field.width,
      isRequired: field.isRequired,
      isActive: field.isActive,
    });
    setFormError('');
    setDialogOpen(true);
  };

  const save = async () => {
    if (!draft.label.trim()) return setFormError('Give the field a name.');
    if (draft.type === 'select' && !draft.options.trim()) return setFormError('Add the choices for this dropdown, one per line.');
    setSaving(true);
    try {
      const response = await apiFetch(editing ? `${HR_VACANCY_FIELDS_ENDPOINT}/${editing.id}` : HR_VACANCY_FIELDS_ENDPOINT, {
        method: editing ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify({ ...draft, options: draft.options.split('\n') }),
      });
      if (!response.ok) {
        setFormError(await readApiMessage(response, { fallback: 'Unable to save this field.' }));
        return;
      }
      adminSuccessToast(editing ? 'Field updated.' : 'Field added. It now appears on the Create vacancy form.');
      setDialogOpen(false);
      void load();
    } finally {
      setSaving(false);
    }
  };

  const patch = async (field: HrFormField, body: Partial<HrFormField>, message: string) => {
    const response = await apiFetch(`${HR_VACANCY_FIELDS_ENDPOINT}/${field.id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
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
    const response = await apiFetch(`${HR_VACANCY_FIELDS_ENDPOINT}-order`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ ids: next.map((field) => field.id) }),
    });
    if (!response.ok) {
      adminErrorToast('Unable to save the new order.');
      void load();
    }
  };

  const remove = (field: HrFormField) => {
    confirmDeleteToast({
      title: `Delete the "${field.label}" field?`,
      description: 'Vacancies keep what was already filled in, but the field disappears from the Create vacancy form and the careers pages. Hide it instead if you may need it again.',
      onConfirm: async () => {
        const response = await apiFetch(`${HR_VACANCY_FIELDS_ENDPOINT}/${field.id}`, { method: 'DELETE', headers });
        if (!response.ok) {
          adminErrorToast(await readApiMessage(response, { fallback: 'Unable to delete this field.' }));
          return;
        }
        adminSuccessToast('Field deleted.');
        void load();
      },
    });
  };

  const reset = () => {
    confirmDeleteToast({
      title: 'Reset the HR form to its default fields?',
      description: 'Every field here is replaced by the original ten: Job title, Department, Location, Employment type, Status, Closing date, Short summary, Full description, Responsibilities and Requirements. Fields you added are removed from the form; answers already saved on vacancies are kept.',
      onConfirm: async () => {
        const response = await apiFetch(`${HR_VACANCY_FIELDS_ENDPOINT}/reset`, { method: 'POST', headers });
        if (!response.ok) {
          adminErrorToast(await readApiMessage(response, { fallback: 'Unable to reset the form.' }));
          return;
        }
        setFields(parseHrFormFields(await response.json()));
        adminSuccessToast('The HR form is back to its default fields.');
      },
    });
  };

  const draftColumn = columnFor({ key: editing?.key ?? '', type: draft.type });
  const editingColumn = editing ? columnFor(editing) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Create vacancy form</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            The fields HR fill in when they create or edit a vacancy, in this order. Every field can be renamed, retyped, reordered, hidden or deleted; Reset brings back the default fields.
            Required documents are set on each vacancy and are not part of this form.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={reset} className="gap-2"><RotateCcw className="h-4 w-4" /> Reset to default fields</Button>
          <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add field</Button>
        </div>
      </div>

      {!loading && warnings.length ? (
        <div className="space-y-1 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {warnings.map((warning) => (
            <p key={warning} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {warning}</p>
          ))}
        </div>
      ) : null}

      <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        {fields.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-muted-foreground">{loading ? 'Loading…' : 'No fields yet.'}</li>
        ) : fields.map((field, index) => (
          <li key={field.id} className={cn('flex flex-wrap items-center gap-3 px-4 py-3', !field.isActive && 'bg-muted/40 text-foreground/50')}>
            <div className="flex">
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label={`Move ${field.label} up`} disabled={index === 0} onClick={() => void move(index, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label={`Move ${field.label} down`} disabled={index === fields.length - 1} onClick={() => void move(index, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {field.label}
                {field.isRequired ? <span className="text-destructive"> *</span> : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {HR_FIELD_TYPE_LABELS[field.type] || field.type}
                {field.width === 'half' ? ' · half width' : ''}
                {field.type === 'select' && field.options.length ? ` · ${field.options.join(', ')}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {!field.isActive ? <Badge variant="outline">Hidden</Badge> : null}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                title={field.isActive ? 'Hide from the form' : 'Show on the form'}
                aria-label={field.isActive ? `Hide ${field.label}` : `Show ${field.label}`}
                onClick={() => void patch(field, { isActive: !field.isActive }, field.isActive ? 'Field hidden from the form.' : 'Field shown on the form.')}
              >
                {field.isActive ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${field.label}`} onClick={() => openEdit(field)}><Pencil className="h-4 w-4" /></Button>
              <Button type="button" size="icon" variant="ghost" className="text-destructive hover:text-destructive" aria-label={`Delete ${field.label}`} onClick={() => remove(field)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </li>
        ))}
      </ul>

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? `Edit ${editing.label}` : 'Add field'}
        description="The field appears on the Create vacancy form for HR, and its answer on the careers pages."
        saving={saving}
        saveLabel={editing ? 'Save field' : 'Add field'}
        onSave={() => void save()}
        onCancel={() => setDialogOpen(false)}
      >
        <div className="space-y-4">
          {formError ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p> : null}
          <label className="block">
            <span className="text-sm font-medium">Field name</span>
            <input value={draft.label} onChange={(event) => setDraft((prev) => ({ ...prev, label: event.target.value }))} className={inputClass} placeholder="e.g. Salary range" maxLength={191} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Type of answer</span>
            <select value={draft.type} onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value as HrFieldType }))} className={inputClass}>
              {Object.entries(HR_FIELD_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            {editingColumn && !draftColumn ? (
              <span className="mt-1 block text-xs text-amber-700 dark:text-amber-300">
                With this type, answers are shown as an extra detail on the careers pages instead of in the vacancy&apos;s usual {editing?.label} spot.
              </span>
            ) : null}
          </label>
          {draft.type === 'select' ? (
            <label className="block">
              <span className="text-sm font-medium">Choices (one per line)</span>
              <textarea value={draft.options} onChange={(event) => setDraft((prev) => ({ ...prev, options: event.target.value }))} rows={5} className={inputClass} />
              {draftColumn === 'status' ? (
                <span className="mt-1 block text-xs text-muted-foreground">
                  Only {VACANCY_STATUSES.join(', ')} change whether a vacancy is published; OPEN shows it on the careers page. Other choices save it as Draft.
                </span>
              ) : null}
            </label>
          ) : null}
          {PLACEHOLDER_TYPES.includes(draft.type) ? (
            <label className="block">
              <span className="text-sm font-medium">Placeholder</span>
              <input value={draft.placeholder} onChange={(event) => setDraft((prev) => ({ ...prev, placeholder: event.target.value }))} className={inputClass} placeholder="Example text shown in the empty box" maxLength={255} />
            </label>
          ) : null}
          <label className="block">
            <span className="text-sm font-medium">Help text</span>
            <input value={draft.helpText} onChange={(event) => setDraft((prev) => ({ ...prev, helpText: event.target.value }))} className={inputClass} placeholder="Optional hint shown under the field" maxLength={500} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Width</span>
            <select value={draft.width} onChange={(event) => setDraft((prev) => ({ ...prev, width: event.target.value as HrFieldWidth }))} className={inputClass}>
              <option value="full">Full width</option>
              <option value="half">Half width (two side by side)</option>
            </select>
          </label>
          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={draft.isRequired} onChange={(event) => setDraft((prev) => ({ ...prev, isRequired: event.target.checked }))} /> Required
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((prev) => ({ ...prev, isActive: event.target.checked }))} /> Show on the form
            </label>
          </div>
        </div>
      </SchoolAdminDialogShell>
    </div>
  );
}
