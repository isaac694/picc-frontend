'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { Pencil, Plus, Trash2 } from 'lucide-react';

export type ServiceRecord = {
  id: string;
  title?: string | null;
  dayOfWeek?: string | null;
  time?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  description?: string | null;
};

type ServiceDraft = {
  title: string;
  dayOfWeek: string;
  time: string;
  location: string;
  description: string;
};

const EMPTY_DRAFT: ServiceDraft = {
  title: '',
  dayOfWeek: '',
  time: '',
  location: '',
  description: '',
};

const normalizeTime = (service: ServiceRecord) => {
  if (service.startTime) {
    if (service.endTime) return `${service.startTime} - ${service.endTime}`;
    return service.startTime;
  }
  return service.time || '';
};

export default function ServiceTimesManager({
  token,
  compact = false,
}: {
  token: string;
  compact?: boolean;
}) {
  const [status, setStatus] = useState('');
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [serviceDraft, setServiceDraft] = useState<ServiceDraft>(EMPTY_DRAFT);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const refreshServices = async () => {
    try {
      const response = await apiFetch('/api/services');
      if (!response.ok) return;
      const data = await response.json();
      const normalized = (data || []).map((service: ServiceRecord) => ({
        ...service,
        time: normalizeTime(service),
      }));
      setServices(normalized);
    } catch {
      setServices([]);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await apiFetch('/api/services');
        if (!response.ok) return;
        const data = await response.json();
        const normalized = (data || []).map((service: ServiceRecord) => ({
          ...service,
          time: normalizeTime(service),
        }));
        if (cancelled) return;
        setServices(normalized);
      } catch {
        if (cancelled) return;
        setServices([]);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingServiceId(null);
    setServiceDraft(EMPTY_DRAFT);
  };

  const openAddDialog = () => {
    setEditingServiceId(null);
    setServiceDraft(EMPTY_DRAFT);
    setDialogOpen(true);
  };

  const openEditDialog = (service: ServiceRecord) => {
    setEditingServiceId(service.id);
    setServiceDraft({
      title: service.title || '',
      dayOfWeek: service.dayOfWeek || '',
      time: service.time || service.startTime || '',
      location: service.location || '',
      description: service.description || '',
    });
    setStatus('');
    setDialogOpen(true);
  };

  const handleSaveService = async () => {
    if (!serviceDraft.title || !serviceDraft.dayOfWeek || !serviceDraft.time) {
      setStatus('Please fill service title, day, and time.');
      return;
    }

    setSaving(true);
    setStatus('');
    const isEditing = Boolean(editingServiceId);
    try {
      const response = await apiFetch(editingServiceId ? `/api/services/${editingServiceId}` : '/api/services', {
        method: editingServiceId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: serviceDraft.title,
          dayOfWeek: serviceDraft.dayOfWeek,
          time: serviceDraft.time,
          location: serviceDraft.location,
          description: serviceDraft.description,
        }),
      });

      if (!response.ok) {
        setStatus(isEditing ? 'Unable to update service.' : 'Unable to add service.');
        return;
      }

      closeDialog();
      await refreshServices();
      setStatus(isEditing ? 'Service updated.' : 'Service added.');
    } catch {
      setStatus(isEditing ? 'Unable to update service.' : 'Unable to add service.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    setStatus('');
    try {
      const response = await apiFetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        setStatus('Unable to delete service.');
        return;
      }
      await refreshServices();
      if (editingServiceId === serviceId) closeDialog();
      setStatus('Service deleted.');
    } catch {
      setStatus('Unable to delete service.');
    }
  };

  const requestDeleteService = (service: ServiceRecord) => {
    confirmDeleteToast({
      title: 'Delete this service?',
      description: service.title || service.dayOfWeek || 'This service time will be permanently removed.',
      onConfirm: () => void handleDeleteService(service.id),
    });
  };

  const serviceFormFields = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input
          type="text"
          placeholder="Service title"
          value={serviceDraft.title}
          onChange={(event) => setServiceDraft((prev) => ({ ...prev, title: event.target.value }))}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
        />
        <input
          type="text"
          placeholder="Day of week"
          value={serviceDraft.dayOfWeek}
          onChange={(event) => setServiceDraft((prev) => ({ ...prev, dayOfWeek: event.target.value }))}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input
          type="text"
          placeholder="Time"
          value={serviceDraft.time}
          onChange={(event) => setServiceDraft((prev) => ({ ...prev, time: event.target.value }))}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
        />
        <input
          type="text"
          placeholder="Location"
          value={serviceDraft.location}
          onChange={(event) => setServiceDraft((prev) => ({ ...prev, location: event.target.value }))}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
        />
      </div>
      <textarea
        placeholder="Description"
        value={serviceDraft.description}
        onChange={(event) => setServiceDraft((prev) => ({ ...prev, description: event.target.value }))}
        rows={3}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
      />
    </div>
  );

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {status ? <p className="text-sm text-foreground/70">{status}</p> : null}

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Current services</h2>
            <p className="mt-1 text-sm text-foreground/60">Service times shown on the Contact page Locate Us section.</p>
          </div>
          <Button type="button" className="shrink-0 gap-2" onClick={openAddDialog}>
            <Plus className="h-4 w-4" />
            Add service
          </Button>
        </div>

        {services.length === 0 ? (
          <p className="text-sm text-foreground/60">No services yet.</p>
        ) : (
          <div className="overflow-auto rounded-xl border border-border/70">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-foreground/60">
                <tr>
                  <th className="px-3 py-2 font-medium">Service</th>
                  <th className="px-3 py-2 font-medium">Schedule</th>
                  <th className="px-3 py-2 font-medium">Location</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-t border-border/60">
                    <td className="px-3 py-2 font-medium text-foreground">{service.title || 'Untitled service'}</td>
                    <td className="px-3 py-2 text-foreground/70">
                      {[service.dayOfWeek, service.time].filter(Boolean).join(' · ') || 'No schedule set'}
                    </td>
                    <td className="px-3 py-2 text-foreground/70">{service.location || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Edit ${service.title || 'service'}`}
                          onClick={() => openEditDialog(service)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Delete ${service.title || 'service'}`}
                          onClick={() => requestDeleteService(service)}
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

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingServiceId(null);
            setServiceDraft(EMPTY_DRAFT);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border/70 bg-muted/30 px-6 py-5">
            <DialogTitle>{editingServiceId ? 'Edit service' : 'Add service'}</DialogTitle>
            <DialogDescription>
              {editingServiceId
                ? 'Update this service time on the Contact page.'
                : 'Add a new service time for the Contact page.'}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[min(60vh,520px)] overflow-y-auto px-6 py-5">{serviceFormFields}</div>
          <DialogFooter className="gap-2 border-t border-border/70 bg-muted/20 px-6 py-4 sm:gap-0">
            <Button type="button" variant="outline" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSaveService()} disabled={saving}>
              {saving ? 'Saving…' : editingServiceId ? 'Save changes' : 'Add service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
