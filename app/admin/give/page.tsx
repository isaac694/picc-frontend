'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { toast } from 'sonner';

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
    handleLogout,
  } = useAdminAuth();

  const [status, setStatus] = useState('');
  const [givingTypes, setGivingTypes] = useState<string[]>([]);
  const [newType, setNewType] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingType, setEditingType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savingAction, setSavingAction] = useState<string | null>(null);

  const fetchGivingTypes = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/giving-types');
      if (response.ok) {
        const data = await response.json();
        const types = Array.isArray(data) ? data : data.types || [];
        setGivingTypes(types.length > 0 ? types : DEFAULT_GIVING_TYPES);
      } else {
        setGivingTypes(DEFAULT_GIVING_TYPES);
      }
    } catch {
      setStatus('Failed to fetch giving types.');
      setGivingTypes(DEFAULT_GIVING_TYPES);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleAddType = async () => {
    if (!token) return;

    const name = newType.trim();
    if (!name) {
      setStatus('Please enter a giving type.');
      return;
    }

    if (givingTypes.some((type) => type.toLowerCase() === name.toLowerCase())) {
      setStatus('This giving type already exists.');
      return;
    }

    setSavingAction('add');
    try {
      const response = await apiFetch('/api/giving-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (await applyTypesResponse(response, 'Failed to add giving type.')) {
        setNewType('');
        setStatus('Giving type added.');
      }
    } catch {
      setStatus('Failed to add giving type.');
    } finally {
      setSavingAction(null);
    }
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingType(givingTypes[index] || '');
    setStatus('');
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingType('');
    setStatus('');
  };

  const clearForm = () => {
    setNewType('');
    cancelEdit();
  };

  const handleUpdateType = async () => {
    if (!token || editingIndex === null) return;

    const name = editingType.trim();
    if (!name) {
      setStatus('Please enter a giving type.');
      return;
    }

    if (givingTypes.some((type, index) => index !== editingIndex && type.toLowerCase() === name.toLowerCase())) {
      setStatus('This giving type already exists.');
      return;
    }

    setSavingAction(`edit-${editingIndex}`);
    try {
      const response = await apiFetch(`/api/giving-types/${editingIndex}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (await applyTypesResponse(response, 'Failed to update giving type.')) {
        setEditingIndex(null);
        setEditingType('');
        setStatus('Giving type updated.');
      }
    } catch {
      setStatus('Failed to update giving type.');
    } finally {
      setSavingAction(null);
    }
  };

  const handleRemoveType = async (index: number) => {
    if (!token) return;

    setSavingAction(`remove-${index}`);
    try {
      const response = await apiFetch(`/api/giving-types/${index}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (await applyTypesResponse(response, 'Failed to remove giving type.')) {
        if (editingIndex === index) cancelEdit();
        setStatus('Giving type removed.');
      }
    } catch {
      setStatus('Failed to remove giving type.');
    } finally {
      setSavingAction(null);
    }
  };

  const requestRemoveType = (index: number) => {
    const type = givingTypes[index];
    const toastId = toast(`Remove "${type}"?`, {
      description: 'This giving type will no longer appear on the public Give page.',
      duration: Infinity,
      action: {
        label: 'Remove',
        onClick: () => {
          toast.dismiss(toastId);
          void handleRemoveType(index);
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => toast.dismiss(toastId),
      },
    });
  };

  useEffect(() => {
    if (token) {
      fetchGivingTypes();
    }
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
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">
            Admin
          </p>
          <h1 className="text-3xl font-semibold text-foreground md:text-5xl">
            Give Page
          </h1>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Manage the giving types shown on the public Give form.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      {status && <p className="text-sm text-foreground/70">{status}</p>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {editingIndex === null ? 'Add Giving Type' : 'Edit Giving Type'}
              </h2>
              <p className="text-sm text-foreground/60">
                {editingIndex === null
                  ? 'Create a new giving type and publish it to the Give page.'
                  : 'Update the selected giving type and save your changes.'}
              </p>
            </div>
            {editingIndex !== null ? (
              <Button variant="outline" onClick={clearForm} disabled={savingAction !== null}>
                Clear selection
              </Button>
            ) : null}
          </div>

          <div className="space-y-3">
            <label htmlFor="giving-type-name" className="block text-sm font-medium text-foreground">
              Giving Type Name
            </label>
            <Input
              id="giving-type-name"
              value={editingIndex === null ? newType : editingType}
              onChange={(event) => {
                if (editingIndex === null) {
                  setNewType(event.target.value);
                } else {
                  setEditingType(event.target.value);
                }
              }}
              placeholder="e.g., Building Fund"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  if (editingIndex === null) {
                    void handleAddType();
                  } else {
                    void handleUpdateType();
                  }
                }
                if (event.key === 'Escape' && editingIndex !== null) {
                  clearForm();
                }
              }}
            />
          </div>

          <div className="flex flex-wrap gap-3 border-t border-border/60 pt-4">
            {editingIndex === null ? (
              <Button onClick={handleAddType} disabled={!newType.trim() || savingAction !== null}>
                {savingAction === 'add' ? 'Adding...' : 'Add Type'}
              </Button>
            ) : (
              <>
                <Button onClick={handleUpdateType} disabled={!editingType.trim() || savingAction !== null}>
                  {savingAction === `edit-${editingIndex}` ? 'Saving...' : 'Save Type'}
                </Button>
                <Button variant="outline" onClick={clearForm} disabled={savingAction !== null}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Existing Giving Types
          </h2>

          {isLoading ? (
            <p className="text-sm text-foreground/60">Loading giving types...</p>
          ) : givingTypes.length > 0 ? (
            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-2">
              {givingTypes.map((type, index) => (
                <div
                  key={`${type}-${index}`}
                  className={`rounded-xl border bg-background px-4 py-3 transition ${
                    editingIndex === index ? 'border-primary bg-primary/5' : 'border-border/60'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => startEdit(index)}
                      className="text-left text-sm font-semibold text-foreground"
                    >
                      {type}
                    </button>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEdit(index)} disabled={savingAction !== null}>
                        {editingIndex === index ? 'Editing' : 'Edit'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => requestRemoveType(index)}
                        disabled={savingAction !== null || givingTypes.length <= 1}
                      >
                        {savingAction === `remove-${index}` ? 'Removing...' : 'Remove'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground/60">No giving types found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
