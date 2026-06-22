'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const [savingId, setSavingId] = useState<string | null>(null);
  const [keyDates, setKeyDates] = useState<KeyDateRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<KeyDateRecord | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  const baseUrl = useMemo(() => `/api/admin/schools/${encodeURIComponent(schoolKey)}/key-dates`, [schoolKey]);

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
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, token]);

  const handleEdit = (item: KeyDateRecord) => {
    const parsed = parseDateText(item.dateText);
    setEditingItem(item);
    setDraft({
      label: item.label,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setDraft({
      ...EMPTY_DRAFT,
      sortOrder: keyDates.length > 0 ? Math.max(...keyDates.map((d) => d.sortOrder)) + 1 : 0,
    });
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

    setSavingId(editingItem ? editingItem.id : 'new');
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

      await refresh();
      handleAddNew();
      setStatus(`Key date ${editingItem ? 'updated' : 'added'}.`);
    } catch {
      setStatus(`Unable to ${editingItem ? 'update' : 'add'} key date.`);
    } finally {
      setSavingId(null);
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

      if (editingItem?.id === id) {
        handleAddNew();
      }

      await refresh();
      setStatus('Key date deleted.');
    } catch {
      setStatus('Unable to delete key date.');
    }
  };

  const requestRemove = (item: KeyDateRecord) => {
    const toastId = toast('Delete this key date?', {
      description: item.label,
      duration: Infinity,
      action: {
        label: 'Delete',
        onClick: () => {
          toast.dismiss(toastId);
          void remove(item.id);
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => toast.dismiss(toastId),
      },
    });
  };

  const filteredDates = useMemo(() => {
    if (!searchTerm.trim()) return keyDates;
    const lower = searchTerm.toLowerCase();
    return keyDates.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.dateText.toLowerCase().includes(lower),
    );
  }, [keyDates, searchTerm]);

  if (isLoading && keyDates.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {status && (
        <div
          className={`rounded-xl p-4 text-sm ${
            status.includes('Unable') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          }`}
        >
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {editingItem ? 'Update Key Date' : 'Add New Key Date'}
              </h2>
              <p className="mt-1 text-sm text-foreground/70">
                {editingItem ? 'Update the details for this key date.' : 'Create a new key date entry for your school.'}
              </p>
            </div>
            {editingItem && (
              <Button variant="outline" onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                New Key Date
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                Label *
              </label>
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
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => setDraft((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                  End Date
                </label>
                <input
                  type="date"
                  value={draft.endDate}
                  min={draft.startDate || undefined}
                  onChange={(e) => setDraft((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {draft.startDate && (
              <p className="text-xs text-foreground/60">
                Preview: {formatDateText(draft.startDate, draft.endDate)}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="self-end rounded-xl border border-border/60 bg-background/50 p-3 md:col-span-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={draft.isActive}
                    onChange={(e) => setDraft((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-border"
                  />
                  <label htmlFor="isActive" className="cursor-pointer text-sm font-medium text-foreground">
                    Active (Visible on site)
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
              <Button onClick={save} disabled={savingId !== null} className="gap-2">
                {savingId !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingItem ? 'Update Key Date' : 'Add Key Date'}
              </Button>
              {editingItem && (
                <Button variant="destructive" onClick={() => requestRemove(editingItem)} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
              {(editingItem || draft.label || draft.startDate || draft.endDate) && (
                <Button variant="outline" onClick={handleAddNew}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex h-fit max-h-[800px] flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Current Key Dates</h2>

          <div className="relative mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search key dates..."
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="custom-scrollbar space-y-3 overflow-y-auto pr-2">
            {filteredDates.length === 0 ? (
              <div className="rounded-xl border border-border/60 border-dashed py-12 text-center">
                <p className="text-sm text-foreground/60">
                  {searchTerm ? 'No key dates match your search.' : 'No key dates yet.'}
                </p>
              </div>
            ) : (
              filteredDates.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleEdit(item)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    editingItem?.id === item.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border/60 bg-background hover:border-primary/60'
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-foreground">{item.label}</h3>
                    {!item.isActive && (
                      <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-destructive">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">{item.dateText}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
