'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { SchoolAdminDialogShell, SchoolAdminStatusBanner } from '@/components/admin/school-admin-dialog-shell';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

type KeyDateRecord = {
  id: string;
  label: string;
  dateText: string;
  isActive: boolean;
  sortOrder: number;
};

type Draft = Omit<KeyDateRecord, 'id' | 'dateText'> & {
  startDate: string;
  endDate: string;
};

const EMPTY_DRAFT: Draft = {
  label: '',
  startDate: '',
  endDate: '',
  isActive: true,
  sortOrder: 0,
};

const toIsoDate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateText = (startDate: string, endDate: string) => {
  if (!startDate) return '';

  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return '';

  if (!endDate || endDate === startDate) {
    return start.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) {
    return start.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${start.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    })}-${end.toLocaleDateString('en-US', {
      day: 'numeric',
      year: 'numeric',
    })}`;
  }

  if (sameYear) {
    return `${start.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    })} - ${end.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })}`;
  }

  return `${start.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })} - ${end.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}`;
};

const parseDateText = (dateText: string) => {
  const trimmed = dateText.trim();
  if (!trimmed) {
    return { startDate: '', endDate: '' };
  }

  const singleDate = new Date(trimmed);
  if (!Number.isNaN(singleDate.getTime())) {
    return {
      startDate: toIsoDate(singleDate),
      endDate: '',
    };
  }

  const sameMonthRange = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2})-(\d{1,2}),\s*(\d{4})$/);
  if (sameMonthRange) {
    const [, month, startDay, endDay, year] = sameMonthRange;
    const start = new Date(`${month} ${startDay}, ${year}`);
    const end = new Date(`${month} ${endDay}, ${year}`);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      return {
        startDate: toIsoDate(start),
        endDate: toIsoDate(end),
      };
    }
  }

  const longRange = trimmed.split(' - ');
  if (longRange.length === 2) {
    const start = new Date(longRange[0]);
    const end = new Date(longRange[1]);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      return {
        startDate: toIsoDate(start),
        endDate: toIsoDate(end),
      };
    }
  }

  return { startDate: '', endDate: '' };
};

export default function SchoolKeyDatesManager({
  token,
  schoolKey,
}: {
  token: string;
  schoolKey: string;
}) {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [keyDates, setKeyDates] = useState<KeyDateRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<KeyDateRecord | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  const baseUrl = useMemo(() => `/api/admin/schools/${encodeURIComponent(schoolKey)}/key-dates`, [schoolKey]);

  const nextSortOrder = () =>
    keyDates.length > 0 ? Math.max(...keyDates.map((d) => d.sortOrder)) + 1 : 0;

  const refresh = async () => {
    setIsLoading(true);
    setStatus('');
    try {
      const response = await apiFetch(baseUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setKeyDates([]);
        setStatus('Unable to load key dates.');
        return;
      }
      const data = await response.json().catch(() => ({}));
      setKeyDates(Array.isArray(data?.keyDates) ? data.keyDates : []);
    } catch {
      setKeyDates([]);
      setStatus('Unable to load key dates.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial list fetch
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, token]);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setDraft(EMPTY_DRAFT);
  };

  const openAddDialog = () => {
    setEditingItem(null);
    setDraft({ ...EMPTY_DRAFT, sortOrder: nextSortOrder() });
    setDialogOpen(true);
  };

  const openEditDialog = (item: KeyDateRecord) => {
    const parsed = parseDateText(item.dateText);
    setEditingItem(item);
    setDraft({
      label: item.label,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!draft.label.trim() || !draft.startDate) {
      setStatus('Please enter a label and start date.');
      return;
    }

    const dateText = formatDateText(draft.startDate, draft.endDate);
    if (!dateText) {
      setStatus('Please choose a valid start and end date.');
      return;
    }

    setSaving(true);
    setStatus('');

    try {
      const url = editingItem ? `${baseUrl}/${encodeURIComponent(editingItem.id)}` : baseUrl;
      const method = editingItem ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label: draft.label,
          dateText,
          isActive: draft.isActive,
          sortOrder: draft.sortOrder,
        }),
      });

      if (!response.ok) {
        setStatus(`Unable to ${editingItem ? 'update' : 'add'} key date.`);
        return;
      }

      const wasEdit = Boolean(editingItem);
      closeDialog();
      await refresh();
      setStatus(`Key date ${wasEdit ? 'updated' : 'added'}.`);
    } catch {
      setStatus(`Unable to ${editingItem ? 'update' : 'add'} key date.`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setStatus('');
    try {
      const response = await apiFetch(`${baseUrl}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok && response.status !== 204) {
        setStatus('Unable to delete key date.');
        return;
      }

      if (editingItem?.id === id) closeDialog();
      await refresh();
      setStatus('Key date deleted.');
    } catch {
      setStatus('Unable to delete key date.');
    }
  };

  const requestRemove = (item: KeyDateRecord) => {
    confirmDeleteToast({
      title: 'Delete this key date?',
      description: item.label,
      onConfirm: () => void remove(item.id),
    });
  };

  const filteredDates = useMemo(() => {
    if (!searchTerm.trim()) return keyDates;
    const lower = searchTerm.toLowerCase();
    return keyDates.filter(
      (item) => item.label.toLowerCase().includes(lower) || item.dateText.toLowerCase().includes(lower),
    );
  }, [keyDates, searchTerm]);

  const formFields = (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">Label *</label>
        <input
          type="text"
          value={draft.label}
          onChange={(e) => setDraft((prev) => ({ ...prev, label: e.target.value }))}
          placeholder="e.g., Entrance Exams"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">Start date *</label>
          <input
            type="date"
            value={draft.startDate}
            onChange={(e) => setDraft((prev) => ({ ...prev, startDate: e.target.value }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">End date</label>
          <input
            type="date"
            value={draft.endDate}
            min={draft.startDate || undefined}
            onChange={(e) => setDraft((prev) => ({ ...prev, endDate: e.target.value }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
      {draft.startDate ? (
        <p className="text-xs text-foreground/60">Preview: {formatDateText(draft.startDate, draft.endDate)}</p>
      ) : null}
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3">
        <input
          type="checkbox"
          id="keydate-isActive"
          checked={draft.isActive}
          onChange={(e) => setDraft((prev) => ({ ...prev, isActive: e.target.checked }))}
          className="rounded border-border"
        />
        <label htmlFor="keydate-isActive" className="cursor-pointer text-sm font-medium text-foreground">
          Active (visible on site)
        </label>
      </div>
    </div>
  );

  if (isLoading && keyDates.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SchoolAdminStatusBanner status={status} />

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-foreground">Current key dates</h2>
          <Button type="button" className="gap-2 shrink-0" onClick={openAddDialog}>
            <Plus className="h-4 w-4" />
            Add key date
          </Button>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search key dates..."
          className="mb-4 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/20"
        />

        {filteredDates.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground/60">
            {searchTerm ? 'No key dates match your search.' : 'No key dates yet.'}
          </p>
        ) : (
          <div className="overflow-auto rounded-xl border border-border/70">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-foreground/60">
                <tr>
                  <th className="px-3 py-2 font-medium">Label</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDates.map((item) => (
                  <tr key={item.id} className="border-t border-border/60">
                    <td className="px-3 py-2 font-medium text-foreground">{item.label}</td>
                    <td className="px-3 py-2 text-foreground/70">{item.dateText}</td>
                    <td className="px-3 py-2 text-foreground/70">{item.isActive ? 'Active' : 'Inactive'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${item.label}`} onClick={() => openEditDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Delete ${item.label}`}
                          onClick={() => requestRemove(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingItem(null);
            setDraft(EMPTY_DRAFT);
          }
        }}
        title={editingItem ? 'Edit key date' : 'Add key date'}
        description={
          editingItem ? 'Update this key date for your school.' : 'Create a new key date entry for your school.'
        }
        saving={saving}
        saveLabel={editingItem ? 'Save changes' : 'Add key date'}
        onSave={() => void save()}
        onCancel={closeDialog}
      >
        {formFields}
      </SchoolAdminDialogShell>
    </div>
  );
}
