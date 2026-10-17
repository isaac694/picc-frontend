'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Pencil, Plus, Trash2 } from 'lucide-react';

const DEFAULT_GIVING_TYPES = [
  'First Fruit',
  'Sunday Service',
  'Tithe',
  'Project Offering',
  'Thanks Giving',
  "Prophet's Offering",
];

export default function AdminGivePage() {
  const {
    token,
    email,
    password,
    loginError,
    setEmail,
    setPassword,
    handleLogin,
  } = useAdminAuth();

  const [status, setStatus] = useState('');
  const [givingTypes, setGivingTypes] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftName, setDraftName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const applyTypesResponse = async (response: Response, fallbackMessage: string) => {
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setStatus(typeof data?.error === 'string' ? data.error : fallbackMessage);
      return false;
    }

    const types = Array.isArray(data) ? data : data?.types || [];
    setGivingTypes(types.length > 0 ? types : DEFAULT_GIVING_TYPES);
    return true;
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingIndex(null);
    setDraftName('');
  };

  const openAddDialog = () => {
    setEditingIndex(null);
    setDraftName('');
    setStatus('');
    setDialogOpen(true);
  };

  const openEditDialog = (index: number) => {
    setEditingIndex(index);
    setDraftName(givingTypes[index] || '');
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

    if (
      givingTypes.some((type, index) => index !== editingIndex && type.toLowerCase() === name.toLowerCase())
    ) {
      setStatus('This giving type already exists.');
      return;
    }

    setSaving(true);
    setStatus('');

    try {
      if (editingIndex === null) {
        const response = await apiFetch('/api/giving-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name }),
        });
        if (await applyTypesResponse(response, 'Failed to add giving type.')) {
          closeDialog();
          setStatus('Giving type added.');
        }
      } else {
        const response = await apiFetch(`/api/giving-types/${editingIndex}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name }),
        });
        if (await applyTypesResponse(response, 'Failed to update giving type.')) {
          closeDialog();
          setStatus('Giving type updated.');
        }
      }
    } catch {
      setStatus(editingIndex === null ? 'Failed to add giving type.' : 'Failed to update giving type.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveType = async (index: number) => {
    if (!token) return;

    setSaving(true);
    try {
      const response = await apiFetch(`/api/giving-types/${index}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (await applyTypesResponse(response, 'Failed to remove giving type.')) {
        if (editingIndex === index) closeDialog();
        setStatus('Giving type removed.');
      }
    } catch {
      setStatus('Failed to remove giving type.');
    } finally {
      setSaving(false);
    }
  };

  const requestRemoveType = (index: number) => {
    const type = givingTypes[index];
    confirmDeleteToast({
      title: `Remove "${type}"?`,
      description: 'This giving type will no longer appear on the public Give page.',
      onConfirm: () => void handleRemoveType(index),
    });
  };

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      try {
        const response = await apiFetch('/api/giving-types');
        if (cancelled) return;
        if (response.ok) {
          const data = await response.json();
          const types = Array.isArray(data) ? data : data.types || [];
          setGivingTypes(types.length > 0 ? types : DEFAULT_GIVING_TYPES);
        } else {
          setGivingTypes(DEFAULT_GIVING_TYPES);
        }
      } catch {
        if (!cancelled) {
          setStatus('Failed to fetch giving types.');
          setGivingTypes(DEFAULT_GIVING_TYPES);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Admin</p>
          <h1 className="text-3xl font-semibold text-foreground md:text-5xl">Give Page</h1>
          <p className="mt-3 max-w-2xl text-foreground/70">Manage the giving types shown on the public Give form.</p>
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
          setDialogOpen(open);
          if (!open) {
            setEditingIndex(null);
            setDraftName('');
          }
        }}
        title={editingIndex === null ? 'Add giving type' : 'Edit giving type'}
        description="Names appear in the dropdown on the public Give page."
        saving={saving}
        saveLabel={editingIndex === null ? 'Add type' : 'Save changes'}
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
        <h2 className="mb-4 text-lg font-semibold text-foreground">Existing giving types</h2>

        {isLoading ? (
          <p className="text-sm text-foreground/60">Loading giving types...</p>
        ) : givingTypes.length > 0 ? (
          <div className="max-h-[520px] space-y-3 overflow-y-auto pr-2">
            {givingTypes.map((type, index) => (
              <div
                key={`${type}-${index}`}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-4 py-3"
              >
                <p className="min-w-0 flex-1 text-sm font-semibold text-foreground">{type}</p>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Edit ${type}`}
                    onClick={() => openEditDialog(index)}
                    disabled={saving}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    aria-label={`Remove ${type}`}
                    onClick={() => requestRemoveType(index)}
                    disabled={saving || givingTypes.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground/60">No giving types found.</p>
        )}
      </div>
    </div>
  );
}
