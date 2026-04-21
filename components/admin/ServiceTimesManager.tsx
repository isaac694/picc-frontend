'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

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
  const [serviceDraft, setServiceDraft] = useState<ServiceDraft>({
    title: '',
    dayOfWeek: '',
    time: '',
    location: '',
    description: '',
  });

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

  const handleAddService = async () => {
    if (!serviceDraft.title || !serviceDraft.dayOfWeek || !serviceDraft.time) {
      setStatus('Please fill service title, day, and time.');
      return;
    }

    setStatus('');
    try {
      const response = await apiFetch('/api/services', {
        method: 'POST',
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
        setStatus('Unable to add service.');
        return;
      }

      setServiceDraft({
        title: '',
        dayOfWeek: '',
        time: '',
        location: '',
        description: '',
      });
      await refreshServices();
      setStatus('Service added.');
    } catch {
      setStatus('Unable to add service.');
    }
  };

  const handleUpdateService = async (service: ServiceRecord) => {
    setStatus('');
    try {
      const response = await apiFetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: service.title,
          dayOfWeek: service.dayOfWeek,
          time: service.time || service.startTime,
          location: service.location,
          description: service.description,
        }),
      });
      if (!response.ok) {
        setStatus('Unable to update service.');
        return;
      }
      await refreshServices();
      setStatus('Service updated.');
    } catch {
      setStatus('Unable to update service.');
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
      setStatus('Service deleted.');
    } catch {
      setStatus('Unable to delete service.');
    }
  };

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {status && <p className="text-sm text-foreground/70">{status}</p>}

      <div className={compact ? 'grid grid-cols-1 gap-6' : 'grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6'}>
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Add a Service
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Service title"
              value={serviceDraft.title}
              onChange={(event) =>
                setServiceDraft((prev) => ({ ...prev, title: event.target.value }))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
            <input
              type="text"
              placeholder="Day of week"
              value={serviceDraft.dayOfWeek}
              onChange={(event) =>
                setServiceDraft((prev) => ({ ...prev, dayOfWeek: event.target.value }))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Time"
              value={serviceDraft.time}
              onChange={(event) =>
                setServiceDraft((prev) => ({ ...prev, time: event.target.value }))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
            <input
              type="text"
              placeholder="Location"
              value={serviceDraft.location}
              onChange={(event) =>
                setServiceDraft((prev) => ({ ...prev, location: event.target.value }))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
          </div>
          <textarea
            placeholder="Description"
            value={serviceDraft.description}
            onChange={(event) =>
              setServiceDraft((prev) => ({ ...prev, description: event.target.value }))
            }
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
          />
          <Button onClick={handleAddService}>Add Service</Button>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Current Services
          </h2>
          {services.length === 0 ? (
            <p className="text-sm text-foreground/60">No services yet.</p>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-xl border border-border/60 bg-background p-4 space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={service.title || ''}
                      onChange={(event) =>
                        setServices((prev) =>
                          prev.map((item) =>
                            item.id === service.id ? { ...item, title: event.target.value } : item,
                          ),
                        )
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                    />
                    <input
                      type="text"
                      value={service.dayOfWeek || ''}
                      onChange={(event) =>
                        setServices((prev) =>
                          prev.map((item) =>
                            item.id === service.id ? { ...item, dayOfWeek: event.target.value } : item,
                          ),
                        )
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={service.time || ''}
                      onChange={(event) =>
                        setServices((prev) =>
                          prev.map((item) =>
                            item.id === service.id ? { ...item, time: event.target.value } : item,
                          ),
                        )
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                    />
                    <input
                      type="text"
                      value={service.location || ''}
                      onChange={(event) =>
                        setServices((prev) =>
                          prev.map((item) =>
                            item.id === service.id ? { ...item, location: event.target.value } : item,
                          ),
                        )
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                    />
                  </div>
                  <textarea
                    value={service.description || ''}
                    onChange={(event) =>
                      setServices((prev) =>
                        prev.map((item) =>
                          item.id === service.id ? { ...item, description: event.target.value } : item,
                        ),
                      )
                    }
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => handleUpdateService(service)}>Update</Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDeleteService(service.id)}
                    >
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
