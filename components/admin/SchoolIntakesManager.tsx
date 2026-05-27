'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type IntakeRecord = {
  id: string;
  label: string;
  opensOn: string | null;
  closesOn: string | null;
  isActive: boolean;
  sortOrder: number;
};

type Draft = Omit<IntakeRecord, 'id'>;

export default function SchoolIntakesManager({
  token,
  schoolKey,
}: {
  token: string;
  schoolKey: string;
}) {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [intakes, setIntakes] = useState<IntakeRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<IntakeRecord | null>(null);
  const [draft, setDraft] = useState<Draft>({
    label: '',
    opensOn: null,
    closesOn: null,
    isActive: true,
    sortOrder: 0,
  });

  const baseUrl = useMemo(() => `/api/admin/schools/${encodeURIComponent(schoolKey)}/intakes`, [schoolKey]);
  const isCohort = schoolKey === 'hope-school' || schoolKey === 'discipleship';
  const intakeLabel = isCohort ? 'Cohort' : 'Intake';
  const intakeLabelPlural = isCohort ? 'Cohorts' : 'Intakes';
  const sampleLabel = isCohort ? 'e.g., Cohort 1 2026' : 'e.g., Term 1 2026';

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
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, token]);

  const handleEdit = (item: IntakeRecord) => {
    setEditingItem(item);
    setDraft({
      label: item.label,
      opensOn: item.opensOn,
      closesOn: item.closesOn,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setDraft({
      label: '',
      opensOn: null,
      closesOn: null,
      isActive: true,
      sortOrder: intakes.length > 0 ? Math.max(...intakes.map(i => i.sortOrder)) + 1 : 0,
    });
  };

  const save = async () => {
    if (!draft.label.trim()) {
      setStatus('Please enter a label.');
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
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        setStatus(`Unable to ${editingItem ? 'update' : 'add'} ${intakeLabel.toLowerCase()}.`);
        return;
      }

      if (!editingItem) {
        handleAddNew();
      }
      
      await refresh();
      setStatus(`${intakeLabel} ${editingItem ? 'updated' : 'added'}.`);
    } catch {
      setStatus(`Unable to ${editingItem ? 'update' : 'add'} ${intakeLabel.toLowerCase()}.`);
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
        setStatus(`Unable to delete ${intakeLabel.toLowerCase()}.`);
        return;
      }
      
      if (editingItem?.id === id) {
        handleAddNew();
      }
      
      await refresh();
      setStatus(`${intakeLabel} deleted.`);
    } catch {
      setStatus(`Unable to delete ${intakeLabel.toLowerCase()}.`);
    }
  };

  const requestRemove = (item: IntakeRecord) => {
    const toastId = toast(`Delete this ${intakeLabel.toLowerCase()}?`, {
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

  const filteredIntakes = useMemo(() => {
    if (!searchTerm.trim()) return intakes;
    const lower = searchTerm.toLowerCase();
    return intakes.filter(i => i.label.toLowerCase().includes(lower));
  }, [intakes, searchTerm]);

  if (isLoading && intakes.length === 0) {
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
          className={`p-4 rounded-xl text-sm ${
            status.includes('Unable') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          }`}
        >
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
        {/* Left Side: Form */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {editingItem ? `Update ${intakeLabel}` : `Add New ${intakeLabel}`}
              </h2>
              <p className="text-sm text-foreground/70 mt-1">
                {editingItem ? `Update the details for this ${intakeLabel.toLowerCase()}.` : `Create a new ${intakeLabel.toLowerCase()} for your school.`}
              </p>
            </div>
            {editingItem && (
              <Button variant="outline" onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                New {intakeLabel}
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
                Label *
              </label>
              <input
                type="text"
                value={draft.label}
                onChange={(e) => setDraft((prev) => ({ ...prev, label: e.target.value }))}
                placeholder={sampleLabel}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
                  Opens On
                </label>
                <input
                  type="date"
                  value={draft.opensOn || ''}
                  onChange={(e) => setDraft((prev) => ({ ...prev, opensOn: e.target.value || null }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
                  Closes On
                </label>
                <input
                  type="date"
                  value={draft.closesOn || ''}
                  onChange={(e) => setDraft((prev) => ({ ...prev, closesOn: e.target.value || null }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-background/50 self-end">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={draft.isActive}
                  onChange={(e) => setDraft((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-border"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-foreground cursor-pointer">
                  Active (Visible on site)
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border/60">
              <Button onClick={save} disabled={savingId !== null} className="gap-2">
                {savingId !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingItem ? `Update ${intakeLabel}` : `Add ${intakeLabel}`}
              </Button>
              {editingItem && (
                <Button variant="destructive" onClick={() => requestRemove(editingItem)} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
              {(editingItem || draft.label) && (
                <Button variant="outline" onClick={handleAddNew}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: List */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm flex flex-col h-fit max-h-[800px]">
          <h2 className="text-lg font-semibold text-foreground mb-4">Current {intakeLabelPlural}</h2>
          
          <div className="relative mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${intakeLabelPlural.toLowerCase()}...`}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 transition outline-none"
            />
          </div>

          <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {filteredIntakes.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl border-border/60">
                <p className="text-sm text-foreground/60">
                  {searchTerm ? `No ${intakeLabelPlural.toLowerCase()} match your search.` : `No ${intakeLabelPlural.toLowerCase()} yet.`}
                </p>
              </div>
            ) : (
              filteredIntakes.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleEdit(item)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    editingItem?.id === item.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border/60 bg-background hover:border-primary/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">{item.label}</h3>
                    {!item.isActive && (
                      <span className="text-[10px] uppercase font-bold text-destructive px-1.5 py-0.5 rounded bg-destructive/10">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] text-foreground/50">
                      Opens: {item.opensOn ? new Date(item.opensOn).toLocaleDateString() : 'N/A'} | 
                      Closes: {item.closesOn ? new Date(item.closesOn).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
