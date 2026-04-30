'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';

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
  const [draft, setDraft] = useState<Draft>({
    label: '',
    opensOn: null,
    closesOn: null,
    isActive: true,
    sortOrder: 0,
  });

  const baseUrl = useMemo(() => `/api/admin/schools/${encodeURIComponent(schoolKey)}/intakes`, [schoolKey]);

  const refresh = async () => {
    setIsLoading(true);
    setStatus('');
    try {
      const response = await apiFetch(baseUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setIntakes([]);
        setStatus('Unable to load intakes.');
        return;
      }
      const data = await response.json().catch(() => ({}));
      setIntakes(Array.isArray(data?.intakes) ? data.intakes : []);
    } catch {
      setIntakes([]);
      setStatus('Unable to load intakes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, token]);

  const add = async () => {
    if (!draft.label.trim()) {
      setStatus('Please enter a label.');
      return;
    }
    setStatus('');
    try {
      const response = await apiFetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(draft),
      });
      if (!response.ok) {
        setStatus('Unable to add intake.');
        return;
      }
      setDraft((prev) => ({ ...prev, label: '', sortOrder: prev.sortOrder + 1 }));
      await refresh();
      setStatus('Intake added.');
    } catch {
      setStatus('Unable to add intake.');
    }
  };

  const save = async (intake: IntakeRecord) => {
    setSavingId(intake.id);
    setStatus('');
    try {
      const response = await apiFetch(`${baseUrl}/${encodeURIComponent(intake.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(intake),
      });
      if (!response.ok) {
        setStatus('Unable to save intake.');
        return;
      }
      await refresh();
      setStatus('Intake saved.');
    } catch {
      setStatus('Unable to save intake.');
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this intake?')) return;
    setStatus('');
    try {
      const response = await apiFetch(`${baseUrl}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok && response.status !== 204) {
        setStatus('Unable to delete intake.');
        return;
      }
      await refresh();
      setStatus('Intake deleted.');
    } catch {
      setStatus('Unable to delete intake.');
    }
  };

  if (isLoading) {
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

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Intake
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
                Label *
              </label>
              <input
                type="text"
                value={draft.label}
                onChange={(e) => setDraft((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="e.g., Term 1 2026"
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
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
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
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={draft.sortOrder}
                  onChange={(e) => setDraft((prev) => ({ ...prev, sortOrder: Number.parseInt(e.target.value || '0', 10) || 0 }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </div>
              <div className="flex items-end gap-2">
                <input
                  id="draft-active"
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(e) => setDraft((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-border"
                />
                <label htmlFor="draft-active" className="text-sm text-foreground/70">
                  Active
                </label>
              </div>
            </div>
            <Button onClick={add} className="w-full md:w-auto">
              Add Intake
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">Current Intakes</h2>
          {intakes.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl border-border/60">
              <p className="text-sm text-foreground/60">No intakes added yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {intakes.map((intake) => (
                <div key={intake.id} className="rounded-xl border border-border/60 bg-background p-4 space-y-4">
                  <input
                    type="text"
                    value={intake.label}
                    onChange={(e) =>
                      setIntakes((prev) => prev.map((i) => (i.id === intake.id ? { ...i, label: e.target.value } : i)))
                    }
                    className="w-full font-medium bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition px-1 py-1"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-foreground/40 block mb-1">Opens</label>
                      <input
                        type="date"
                        value={intake.opensOn || ''}
                        onChange={(e) =>
                          setIntakes((prev) =>
                            prev.map((i) => (i.id === intake.id ? { ...i, opensOn: e.target.value || null } : i)),
                          )
                        }
                        className="w-full text-xs bg-muted/30 rounded-lg px-3 py-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-foreground/40 block mb-1">Closes</label>
                      <input
                        type="date"
                        value={intake.closesOn || ''}
                        onChange={(e) =>
                          setIntakes((prev) =>
                            prev.map((i) => (i.id === intake.id ? { ...i, closesOn: e.target.value || null } : i)),
                          )
                        }
                        className="w-full text-xs bg-muted/30 rounded-lg px-3 py-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-foreground/40">Order:</span>
                      <input
                        type="number"
                        value={intake.sortOrder}
                        onChange={(e) =>
                          setIntakes((prev) =>
                            prev.map((i) =>
                              i.id === intake.id
                                ? { ...i, sortOrder: Number.parseInt(e.target.value || '0', 10) || 0 }
                                : i,
                            ),
                          )
                        }
                        className="w-16 text-xs bg-muted/50 rounded-lg px-2 py-1 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id={`active-${intake.id}`}
                        type="checkbox"
                        checked={intake.isActive}
                        onChange={(e) =>
                          setIntakes((prev) =>
                            prev.map((i) => (i.id === intake.id ? { ...i, isActive: e.target.checked } : i)),
                          )
                        }
                        className="rounded border-border"
                      />
                      <label htmlFor={`active-${intake.id}`} className="text-[10px] uppercase font-bold text-foreground/40">
                        Active
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => save(intake)}
                      className="h-8 gap-1"
                      disabled={savingId === intake.id}
                    >
                      {savingId === intake.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => remove(intake.id)}
                      className="h-8 gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

