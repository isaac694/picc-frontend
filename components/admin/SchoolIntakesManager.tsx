'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { SchoolAdminDialogShell, SchoolAdminStatusBanner } from '@/components/admin/school-admin-dialog-shell';
import { Loader2, Pencil, Plus, Power, PowerOff, Trash2 } from 'lucide-react';

type IntakeRecord = {
  id: string;
  label: string;
  opensOn: string | null;
  closesOn: string | null;
  isActive: boolean;
  sortOrder: number;
};

type Draft = Omit<IntakeRecord, 'id'>;

const emptyDraft = (sortOrder: number): Draft => ({
  label: '',
  opensOn: null,
  closesOn: null,
  isActive: true,
  sortOrder,
});

export default function SchoolIntakesManager({
  token,
  schoolKey,
}: {
  token: string;
  schoolKey: string;
}) {
  const [status, setStatus] = useState('');
  const [dialogStatus, setDialogStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [intakes, setIntakes] = useState<IntakeRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IntakeRecord | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft(0));

  const baseUrl = useMemo(() => `/api/admin/schools/${encodeURIComponent(schoolKey)}/intakes`, [schoolKey]);
  const isCohort = schoolKey === 'hope-school' || schoolKey === 'discipleship';
  const intakeLabel = isCohort ? 'Cohort' : 'Intake';
  const intakeLabelPlural = isCohort ? 'Cohorts' : 'Intakes';
  const sampleLabel = isCohort ? 'e.g., Cohort 1 2026' : 'e.g., Term 1 2026';

  const nextSortOrder = () =>
    intakes.length > 0 ? Math.max(...intakes.map((i) => i.sortOrder)) + 1 : 0;

  const refresh = async () => {
    setIsLoading(true);
    setStatus('');
    try {
      const response = await apiFetch(baseUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setIntakes([]);
        setStatus(`Unable to load ${intakeLabelPlural.toLowerCase()}.`);
        return;
      }
      const data = await response.json().catch(() => ({}));
      setIntakes(Array.isArray(data?.intakes) ? data.intakes : []);
    } catch {
      setIntakes([]);
      setStatus(`Unable to load ${intakeLabelPlural.toLowerCase()}.`);
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
    setDraft(emptyDraft(0));
    setDialogStatus('');
  };

  const openAddDialog = () => {
    setEditingItem(null);
    setDraft(emptyDraft(nextSortOrder()));
    setDialogStatus('');
    setDialogOpen(true);
  };

  const openEditDialog = (item: IntakeRecord) => {
    setEditingItem(item);
    setDraft({
      label: item.label,
      opensOn: item.opensOn,
      closesOn: item.closesOn,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setDialogStatus('');
    setDialogOpen(true);
  };

  const save = async () => {
    if (!draft.label.trim()) {
      setDialogStatus('Please enter a label.');
      return;
    }

    setSaving(true);
    setDialogStatus('');

    try {
      const url = editingItem ? `${baseUrl}/${encodeURIComponent(editingItem.id)}` : baseUrl;
      const method = editingItem ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        setDialogStatus(`Unable to ${editingItem ? 'update' : 'add'} ${intakeLabel.toLowerCase()}.`);
        return;
      }

      const wasEdit = Boolean(editingItem);
      closeDialog();
      await refresh();
      setStatus(`${intakeLabel} ${wasEdit ? 'updated' : 'added'}.`);
    } catch {
      setDialogStatus(`Unable to ${editingItem ? 'update' : 'add'} ${intakeLabel.toLowerCase()}.`);
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
        setStatus(`Unable to delete ${intakeLabel.toLowerCase()}.`);
        return;
      }

      if (editingItem?.id === id) closeDialog();
      await refresh();
      setStatus(`${intakeLabel} deleted.`);
    } catch {
      setStatus(`Unable to delete ${intakeLabel.toLowerCase()}.`);
    }
  };

  const requestRemove = (item: IntakeRecord) => {
    confirmDeleteToast({
      title: `Delete this ${intakeLabel.toLowerCase()}?`,
      description: item.label,
      onConfirm: () => void remove(item.id),
    });
  };

  const setIntakeActive = async (item: IntakeRecord, isActive: boolean) => {
    setTogglingId(item.id);
    setStatus('');
    try {
      const response = await apiFetch(`${baseUrl}/${encodeURIComponent(item.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label: item.label,
          opensOn: item.opensOn,
          closesOn: item.closesOn,
          isActive,
          sortOrder: item.sortOrder,
        }),
      });

      if (!response.ok) {
        setStatus(`Unable to ${isActive ? 'activate' : 'deactivate'} ${intakeLabel.toLowerCase()}.`);
        return;
      }

      if (editingItem?.id === item.id) {
        setDraft((prev) => ({ ...prev, isActive }));
      }

      await refresh();
      setStatus(`${intakeLabel} ${isActive ? 'activated' : 'deactivated'}.`);
    } catch {
      setStatus(`Unable to ${isActive ? 'activate' : 'deactivate'} ${intakeLabel.toLowerCase()}.`);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredIntakes = useMemo(() => {
    if (!searchTerm.trim()) return intakes;
    const lower = searchTerm.toLowerCase();
    return intakes.filter((i) => i.label.toLowerCase().includes(lower));
  }, [intakes, searchTerm]);

  const isDialogError =
    Boolean(dialogStatus) &&
    (dialogStatus.includes('Unable') || dialogStatus.includes('Please'));

  const formFields = (
    <div className="space-y-4">
      {dialogStatus ? (
        <div
          className={`rounded-xl p-3 text-sm ${
            isDialogError ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          }`}
        >
          {dialogStatus}
        </div>
      ) : null}
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
          Label *
        </label>
        <input
          type="text"
          value={draft.label}
          onChange={(e) => setDraft((prev) => ({ ...prev, label: e.target.value }))}
          placeholder={sampleLabel}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
            Opens on
          </label>
          <input
            type="date"
            value={draft.opensOn || ''}
            onChange={(e) => setDraft((prev) => ({ ...prev, opensOn: e.target.value || null }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
            Closes on
          </label>
          <input
            type="date"
            value={draft.closesOn || ''}
            min={draft.opensOn || undefined}
            onChange={(e) => setDraft((prev) => ({ ...prev, closesOn: e.target.value || null }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3">
        <input
          type="checkbox"
          id="intake-isActive"
          checked={draft.isActive}
          onChange={(e) => setDraft((prev) => ({ ...prev, isActive: e.target.checked }))}
          className="rounded border-border"
        />
        <label htmlFor="intake-isActive" className="cursor-pointer text-sm font-medium text-foreground">
          Active (visible on site)
        </label>
      </div>
      {editingItem ? (
        <Button
          type="button"
          variant="destructive"
          className="gap-2"
          onClick={() => requestRemove(editingItem)}
        >
          <Trash2 className="h-4 w-4" />
          Delete {intakeLabel.toLowerCase()}
        </Button>
      ) : null}
    </div>
  );

  if (isLoading && intakes.length === 0) {
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
          <h2 className="text-lg font-semibold text-foreground">Current {intakeLabelPlural.toLowerCase()}</h2>
          <Button type="button" className="shrink-0 gap-2" onClick={openAddDialog}>
            <Plus className="h-4 w-4" />
            Add {intakeLabel.toLowerCase()}
          </Button>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Search ${intakeLabelPlural.toLowerCase()}...`}
          className="mb-4 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/20"
        />

        {filteredIntakes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 py-12 text-center">
            <p className="text-sm text-foreground/60">
              {searchTerm
                ? `No ${intakeLabelPlural.toLowerCase()} match your search.`
                : `No ${intakeLabelPlural.toLowerCase()} yet.`}
            </p>
            {!searchTerm ? (
              <Button type="button" onClick={openAddDialog} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Add {intakeLabel.toLowerCase()}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="max-h-[620px] space-y-3 overflow-y-auto pr-2">
            {filteredIntakes.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-background p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-foreground">{item.label}</h3>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        item.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-foreground/50">
                    Opens: {item.opensOn ? new Date(item.opensOn).toLocaleDateString() : 'N/A'} · Closes:{' '}
                    {item.closesOn ? new Date(item.closesOn).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {item.isActive ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={togglingId === item.id}
                      onClick={() => void setIntakeActive(item, false)}
                    >
                      {togglingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <PowerOff className="h-4 w-4" />
                      )}
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={togglingId === item.id}
                      onClick={() => void setIntakeActive(item, true)}
                    >
                      {togglingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                      Activate
                    </Button>
                  )}
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Edit ${item.label}`}
                      onClick={() => openEditDialog(item)}
                    >
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={(open) => {
          if (open) {
            setDialogOpen(true);
            return;
          }
          closeDialog();
        }}
        title={editingItem ? `Edit ${intakeLabel.toLowerCase()}` : `Add ${intakeLabel.toLowerCase()}`}
        description={
          editingItem
            ? `Update this ${intakeLabel.toLowerCase()} for your school.`
            : `Create a new ${intakeLabel.toLowerCase()} for enrollment on the public site.`
        }
        saving={saving}
        saveLabel={editingItem ? 'Save changes' : `Add ${intakeLabel.toLowerCase()}`}
        onSave={() => void save()}
        onCancel={closeDialog}
        maxWidthClass="sm:max-w-2xl"
      >
        {formFields}
      </SchoolAdminDialogShell>
    </div>
  );
}
