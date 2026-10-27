'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import { GivingPaymentsTabs } from '@/components/admin/payments/PaymentsSectionTabs';

type GivingTypeRecord = {
  id: string;
  name: string;
  sortOrder?: number;
};

export default function GivingTypesPage() {
  const { token } = useAdminAuth();
  const [status, setStatus] = useState('');
  const [givingTypes, setGivingTypes] = useState<GivingTypeRecord[]>([]);
  const [editing, setEditing] = useState<GivingTypeRecord | null>(null);
  const [draftName, setDraftName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadTypes = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/admin/giving-types', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await response.json().catch(() => null)) as { types?: GivingTypeRecord[]; error?: string } | null;
      if (!response.ok) {
        setGivingTypes([]);
        setStatus(data?.error || 'Failed to fetch giving types.');
        return;
      }
      setGivingTypes(Array.isArray(data?.types) ? data.types : []);
    } catch {
      setGivingTypes([]);
      setStatus('Failed to fetch giving types.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadTypes();
  }, [loadTypes]);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setDraftName('');
  };

  const openAddDialog = () => {
    setEditing(null);
    setDraftName('');
    setStatus('');
    setDialogOpen(true);
  };

  const openEditDialog = (item: GivingTypeRecord) => {
    setEditing(item);
    setDraftName(item.name);
    setStatus('');
    setDialogOpen(true);
  };

  const handleSaveType = async () => {
    if (!token) return;
    const name = draftName.trim();
    if (!name) {
      setStatus('Please enter a giving type.');
      return;
    }
    if (givingTypes.some((type) => type.id !== editing?.id && type.name.toLowerCase() === name.toLowerCase())) {
      setStatus('This giving type already exists.');
      return;
    }

    setSaving(true);
    setStatus('');
    try {
      const response = await apiFetch(editing ? `/api/admin/giving-types/${encodeURIComponent(editing.id)}` : '/api/admin/giving-types', {
        method: editing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setStatus(data?.error || (editing ? 'Failed to update giving type.' : 'Failed to add giving type.'));
        return;
      }
      closeDialog();
      await loadTypes();
      setStatus(editing ? 'Giving type updated.' : 'Giving type added.');
    } catch {
      setStatus(editing ? 'Failed to update giving type.' : 'Failed to add giving type.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveType = async (item: GivingTypeRecord) => {
    if (!token) return;
    setSaving(true);
    try {
      const response = await apiFetch(`/api/admin/giving-types/${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok && response.status !== 204) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setStatus(data?.error || 'Failed to remove giving type.');
        return;
      }
      if (editing?.id === item.id) closeDialog();
      await loadTypes();
      setStatus('Giving type removed.');
    } catch {
      setStatus('Failed to remove giving type.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <GivingPaymentsTabs activePath="/admin/giving/types" />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Giving types</h1>
          <p className="mt-1 max-w-2xl text-sm text-foreground/70">
            These are the tick options on the public Give form.
          </p>
        </div>
        <Button type="button" onClick={openAddDialog} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Add type
        </Button>
      </div>

      {status ? <p className="text-sm text-foreground/70">{status}</p> : null}

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
          else setDialogOpen(true);
        }}
        title={editing ? 'Edit giving type' : 'Add giving type'}
        description="This name appears under Tick where appropriate on the Give page."
        saving={saving}
        saveLabel={editing ? 'Save changes' : 'Add type'}
        onSave={() => void handleSaveType()}
        onCancel={closeDialog}
      >
        <label htmlFor="giving-type-name" className="block text-sm font-medium text-foreground">
          Giving type name
        </label>
        <Input
          id="giving-type-name"
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          placeholder="e.g., Building Fund"
          className="mt-2"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void handleSaveType();
            }
          }}
        />
      </SchoolAdminDialogShell>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Tick options</h2>
        {isLoading ? (
          <p className="text-sm text-foreground/60">Loading giving types...</p>
        ) : givingTypes.length > 0 ? (
          <div className="max-h-[520px] overflow-auto rounded-xl border border-border/70">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-foreground/60">
                <tr>
                  <th className="px-3 py-2 font-medium">Giving type</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {givingTypes.map((type) => (
                  <tr key={type.id} className="border-t border-border/60">
                    <td className="px-3 py-2 font-medium text-foreground">{type.name}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Edit ${type.name}`}
                          onClick={() => openEditDialog(type)}
                          disabled={saving}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Remove ${type.name}`}
                          onClick={() =>
                            confirmDeleteToast({
                              title: `Remove "${type.name}"?`,
                              description: 'This option will no longer appear on the public Give page.',
                              onConfirm: () => void handleRemoveType(type),
                            })
                          }
                          disabled={saving || givingTypes.length <= 1}
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
        ) : (
          <p className="text-sm text-foreground/60">No giving types found.</p>
        )}
      </div>
    </div>
  );
}
