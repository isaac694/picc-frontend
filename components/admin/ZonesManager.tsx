'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Pencil, Plus, Search, Settings2, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { adminErrorToast, adminSuccessToast, readApiMessage } from '@/components/admin/admin-toast';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  EMPTY_ZONE_DRAFT,
  normalizeZone,
  parseFieldErrors,
  sortZones,
  zoneBadgeColor,
  zoneDraftToPayload,
  zoneToDraft,
  type Zone,
  type ZoneDraft,
} from '@/lib/zones-admin';

export default function ZonesManager({ token }: { token: string }) {
  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    [token],
  );

  const [zones, setZones] = useState<Zone[]>([]);
  const [areaCounts, setAreaCounts] = useState<Record<string, number>>({});
  const [zoneSearch, setZoneSearch] = useState('');
  const [loadingZones, setLoadingZones] = useState(true);
  const [zoneFieldErrors, setZoneFieldErrors] = useState<Record<string, string>>({});

  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [zoneDraft, setZoneDraft] = useState<ZoneDraft>(EMPTY_ZONE_DRAFT);
  const [savingZone, setSavingZone] = useState(false);
  const [deletingZoneId, setDeletingZoneId] = useState<string | null>(null);

  const filteredZones = useMemo(() => {
    const query = zoneSearch.trim().toLowerCase();
    const list = sortZones(zones);
    if (!query) return list;
    return list.filter(
      (zone) =>
        zone.name.toLowerCase().includes(query) ||
        (zone.zonalPastorName ?? '').toLowerCase().includes(query) ||
        (zone.zonalPastorPhone ?? '').includes(query),
    );
  }, [zones, zoneSearch]);

  const loadAreaCounts = useCallback(
    async (list: Zone[]) => {
      if (!list.length) {
        setAreaCounts({});
        return;
      }
      const entries = await Promise.all(
        list.map(async (zone) => {
          try {
            const res = await apiFetch(`/api/admin/zones/${zone.id}/areas`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return [zone.id, 0] as const;
            const data = (await res.json()) as { count?: number; areas?: unknown[] };
            const count = typeof data.count === 'number' ? data.count : (data.areas?.length ?? 0);
            return [zone.id, count] as const;
          } catch {
            return [zone.id, 0] as const;
          }
        }),
      );
      setAreaCounts(Object.fromEntries(entries));
    },
    [token],
  );

  const loadZones = useCallback(async () => {
    setLoadingZones(true);
    try {
      const res = await apiFetch('/api/admin/zones', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        adminErrorToast(await readApiMessage(res, { fallback: 'Failed to load zones.' }));
        return;
      }
      const data = (await res.json()) as { zones?: unknown[] };
      const list = Array.isArray(data.zones)
        ? data.zones.map(normalizeZone).filter((zone): zone is Zone => zone !== null)
        : [];
      setZones(list);
      void loadAreaCounts(list);
    } catch {
      adminErrorToast('Failed to load zones.');
    } finally {
      setLoadingZones(false);
    }
  }, [token, loadAreaCounts]);

  useEffect(() => {
    void loadZones();
  }, [loadZones]);

  const openCreateZone = () => {
    setEditingZoneId(null);
    setZoneDraft(EMPTY_ZONE_DRAFT);
    setZoneFieldErrors({});
    setZoneDialogOpen(true);
  };

  const openEditZone = (zone: Zone) => {
    setEditingZoneId(zone.id);
    setZoneDraft(zoneToDraft(zone));
    setZoneFieldErrors({});
    setZoneDialogOpen(true);
  };

  const saveZone = async () => {
    setSavingZone(true);
    setZoneFieldErrors({});
    const payload = zoneDraftToPayload(zoneDraft);
    const isEdit = Boolean(editingZoneId);

    try {
      const res = await apiFetch(isEdit ? `/api/admin/zones/${editingZoneId}` : '/api/admin/zones', {
        method: isEdit ? 'PUT' : 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setZoneFieldErrors(parseFieldErrors(data));
        adminErrorToast(
          typeof data?.error === 'string'
            ? data.error
            : await readApiMessage(res, { fallback: isEdit ? 'Zone update failed.' : 'Could not create zone.' }),
        );
        return;
      }

      const saved = normalizeZone((data as { zone?: unknown }).zone);
      if (saved) {
        setZones((prev) => {
          if (isEdit) return prev.map((zone) => (zone.id === saved.id ? saved : zone));
          return [...prev, saved];
        });
        if (!isEdit) {
          setAreaCounts((prev) => ({ ...prev, [saved.id]: 0 }));
        }
      }

      setZoneDialogOpen(false);
      adminSuccessToast(isEdit ? 'Zone updated.' : 'Zone created.');
    } catch {
      adminErrorToast(isEdit ? 'Zone update failed.' : 'Could not create zone.');
    } finally {
      setSavingZone(false);
    }
  };

  const deleteZone = (zone: Zone) => {
    confirmDeleteToast({
      title: `Delete ${zone.name}?`,
      description: 'All home church areas in this zone will be removed permanently.',
      onConfirm: async () => {
        setDeletingZoneId(zone.id);
        try {
          const res = await apiFetch(`/api/admin/zones/${zone.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            adminErrorToast(await readApiMessage(res, { fallback: 'Zone delete failed.' }));
            return;
          }
          setZones((prev) => prev.filter((item) => item.id !== zone.id));
          setAreaCounts((prev) => {
            const next = { ...prev };
            delete next[zone.id];
            return next;
          });
          adminSuccessToast('Zone deleted.');
        } catch {
          adminErrorToast('Zone delete failed.');
        } finally {
          setDeletingZoneId(null);
        }
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-gradient-to-r from-amber-50/80 via-white to-sky-50/80 p-4 dark:from-amber-950/20 dark:via-card dark:to-sky-950/20">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <MapPinned className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">PICC headquarter zones</p>
            <p className="text-xs text-muted-foreground">
              {zones.length} zone{zones.length === 1 ? '' : 's'} · manage home churches per zone
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/locations" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-3.5 w-3.5" />
            View public page
          </Link>
        </Button>
      </div> */}

      <div className="flex w-full items-center gap-3">
        <div className="relative w-full max-w-xs min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={zoneSearch}
            onChange={(event) => setZoneSearch(event.target.value)}
            placeholder=""
            className="h-9 pl-8 text-sm"
          />
        </div>
        <Button type="button" className="ml-auto shrink-0" onClick={openCreateZone}>
          <Plus className="mr-1.5 h-4 w-4" />
          New zone
        </Button>
      </div>

      {loadingZones ? (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading zones...
        </div>
      ) : filteredZones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">No zones found.</p>
          <Button type="button" variant="link" className="mt-2" onClick={openCreateZone}>
            Create your first zone
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/30 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Zone</th>
                  <th className="px-4 py-3 font-semibold">Zonal pastor</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Home churches</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredZones.map((zone) => {
                  const areaCount = areaCounts[zone.id];
                  return (
                    <tr key={zone.id} className="hover:bg-muted/15">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ring-1 ring-inset',
                              zoneBadgeColor(zone.name),
                            )}
                          >
                            {zone.name.replace(/zone\s*/i, '').slice(0, 3).toUpperCase()}
                          </span>
                          <span className="font-medium text-foreground">{zone.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {zone.zonalPastorName?.trim() || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {zone.zonalPastorPhone?.trim() || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {areaCount === undefined ? '…' : areaCount}{' '}
                          {areaCount === 1 ? 'area' : 'areas'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button type="button" size="sm" variant="outline" className="h-8" asChild>
                            <Link href={`/admin/zones/${zone.id}`}>
                              <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                              Manage
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => openEditZone(zone)}
                            aria-label={`Edit ${zone.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            disabled={deletingZoneId === zone.id}
                            onClick={() => deleteZone(zone)}
                            aria-label={`Delete ${zone.name}`}
                          >
                            {deletingZoneId === zone.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingZoneId ? 'Edit zone' : 'Create zone'}</DialogTitle>
            <DialogDescription>
              {editingZoneId
                ? 'Update zonal pastor details and display order.'
                : 'Add a headquarter zone (name must be unique across PICC).'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="zone-name">Zone name</Label>
              <Input
                id="zone-name"
                value={zoneDraft.name}
                onChange={(event) => setZoneDraft((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Zone A"
              />
              {zoneFieldErrors.name ? <p className="text-xs text-destructive">{zoneFieldErrors.name}</p> : null}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="zone-pastor-name">Zonal pastor name</Label>
              <Input
                id="zone-pastor-name"
                value={zoneDraft.zonalPastorName}
                onChange={(event) => setZoneDraft((prev) => ({ ...prev, zonalPastorName: event.target.value }))}
                placeholder="Tom Chiphwanya"
              />
              {zoneFieldErrors.zonalPastorName ? (
                <p className="text-xs text-destructive">{zoneFieldErrors.zonalPastorName}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zone-pastor-phone">Zonal pastor phone</Label>
              <Input
                id="zone-pastor-phone"
                value={zoneDraft.zonalPastorPhone}
                onChange={(event) => setZoneDraft((prev) => ({ ...prev, zonalPastorPhone: event.target.value }))}
                placeholder="0881 567 459"
              />
              {zoneFieldErrors.zonalPastorPhone ? (
                <p className="text-xs text-destructive">{zoneFieldErrors.zonalPastorPhone}</p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setZoneDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveZone} disabled={savingZone || !zoneDraft.name.trim()}>
              {savingZone ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              {editingZoneId ? 'Save changes' : 'Create zone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
