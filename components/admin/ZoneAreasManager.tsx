'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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
import {
  EMPTY_AREA_DRAFT,
  areaDraftToPayload,
  areaToDraft,
  normalizeArea,
  normalizeZone,
  parseFieldErrors,
  sortAreas,
  type AreaDraft,
  type Zone,
  type ZoneArea,
} from '@/lib/zones-admin';

export default function ZoneAreasManager({ token, zoneId }: { token: string; zoneId: string }) {
  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    [token],
  );

  const [zone, setZone] = useState<Zone | null>(null);
  const [areas, setAreas] = useState<ZoneArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [areaDraft, setAreaDraft] = useState<AreaDraft>(EMPTY_AREA_DRAFT);
  const [savingArea, setSavingArea] = useState(false);
  const [deletingAreaId, setDeletingAreaId] = useState<string | null>(null);
  const [areaFieldErrors, setAreaFieldErrors] = useState<Record<string, string>>({});

  const sortedAreas = useMemo(() => sortAreas(areas), [areas]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [zoneRes, areasRes] = await Promise.all([
        apiFetch(`/api/admin/zones/${zoneId}`, { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch(`/api/admin/zones/${zoneId}/areas`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!zoneRes.ok) {
        adminErrorToast(await readApiMessage(zoneRes, { fallback: 'Zone not found.' }));
        setZone(null);
        setAreas([]);
        return;
      }

      const zoneData = (await zoneRes.json()) as { zone?: unknown };
      setZone(normalizeZone(zoneData.zone));

      if (!areasRes.ok) {
        adminErrorToast(await readApiMessage(areasRes, { fallback: 'Failed to load areas.' }));
        setAreas([]);
        return;
      }

      const areasData = (await areasRes.json()) as { areas?: unknown[] };
      setAreas(
        Array.isArray(areasData.areas)
          ? areasData.areas.map(normalizeArea).filter((area): area is ZoneArea => area !== null)
          : [],
      );
    } catch {
      adminErrorToast('Failed to load zone areas.');
    } finally {
      setLoading(false);
    }
  }, [token, zoneId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreateArea = () => {
    setEditingAreaId(null);
    setAreaDraft(EMPTY_AREA_DRAFT);
    setAreaFieldErrors({});
    setAreaModalOpen(true);
  };

  const openEditArea = (area: ZoneArea) => {
    setEditingAreaId(area.id);
    setAreaDraft(areaToDraft(area));
    setAreaFieldErrors({});
    setAreaModalOpen(true);
  };

  const saveArea = async () => {
    setSavingArea(true);
    setAreaFieldErrors({});
    try {
      const payload = areaDraftToPayload(areaDraft);
      const isEdit = Boolean(editingAreaId);
      const res = await apiFetch(
        isEdit ? `/api/admin/zones/${zoneId}/areas/${editingAreaId}` : `/api/admin/zones/${zoneId}/areas`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAreaFieldErrors(parseFieldErrors(data));
        adminErrorToast(
          typeof data?.error === 'string' ? data.error : await readApiMessage(res, { fallback: 'Area save failed.' }),
        );
        return;
      }
      const saved = normalizeArea((data as { area?: unknown }).area);
      if (saved) {
        setAreas((prev) => {
          if (isEdit) return prev.map((item) => (item.id === saved.id ? saved : item));
          return [...prev, saved];
        });
      }
      setAreaModalOpen(false);
      adminSuccessToast(isEdit ? 'Area updated.' : 'Area added.');
    } catch {
      adminErrorToast('Area save failed.');
    } finally {
      setSavingArea(false);
    }
  };

  const deleteArea = (area: ZoneArea) => {
    confirmDeleteToast({
      title: `Remove ${area.name}?`,
      description: 'This home church area will be deleted from the zone.',
      onConfirm: async () => {
        setDeletingAreaId(area.id);
        try {
          const res = await apiFetch(`/api/admin/zones/${zoneId}/areas/${area.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            adminErrorToast(await readApiMessage(res, { fallback: 'Area delete failed.' }));
            return;
          }
          setAreas((prev) => prev.filter((item) => item.id !== area.id));
          adminSuccessToast('Area deleted.');
        } catch {
          adminErrorToast('Area delete failed.');
        } finally {
          setDeletingAreaId(null);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading home church areas...
      </div>
    );
  }

  if (!zone) {
    return (
      <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">This zone could not be found.</p>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/zones">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to zones
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button type="button" variant="ghost" size="sm" className="-ml-2 h-8 px-2" asChild>
            <Link href="/admin/zones">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              All zones
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">{zone.name}</h2>
              <Badge variant="outline">{sortedAreas.length} areas</Badge>
            </div>
            {zone.zonalPastorName ? (
              <p className="mt-1 text-sm text-muted-foreground">Zonal Pastor: {zone.zonalPastorName}</p>
            ) : null}
          </div>
        </div>
        <Button type="button" onClick={openCreateArea}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add area
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        {sortedAreas.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">No home church areas in this zone yet.</p>
            <Button type="button" variant="link" className="mt-2" onClick={openCreateArea}>
              Add the first area
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/30 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Area</th>
                  <th className="px-4 py-3 font-semibold">Pastor</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sortedAreas.map((area) => (
                  <tr key={area.id} className="hover:bg-muted/15">
                    <td className="px-4 py-3 font-medium text-foreground">{area.name}</td>
                    <td className="px-4 py-3">{area.pastorName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{area.phone}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => openEditArea(area)}
                          aria-label={`Edit ${area.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={deletingAreaId === area.id}
                          onClick={() => deleteArea(area)}
                          aria-label={`Delete ${area.name}`}
                        >
                          {deletingAreaId === area.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
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

      <Dialog open={areaModalOpen} onOpenChange={setAreaModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAreaId ? 'Edit home church area' : 'Add home church area'}</DialogTitle>
            <DialogDescription>Details for {zone.name} on the public locations page.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="area-name">Area name</Label>
              <Input
                id="area-name"
                value={areaDraft.name}
                onChange={(event) => setAreaDraft((prev) => ({ ...prev, name: event.target.value }))}
              />
              {areaFieldErrors.name ? <p className="text-xs text-destructive">{areaFieldErrors.name}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="area-pastor">Pastor name</Label>
              <Input
                id="area-pastor"
                value={areaDraft.pastorName}
                onChange={(event) => setAreaDraft((prev) => ({ ...prev, pastorName: event.target.value }))}
              />
              {areaFieldErrors.pastorName ? (
                <p className="text-xs text-destructive">{areaFieldErrors.pastorName}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="area-pastor-phone">Pastor phone</Label>
              <Input
                id="area-pastor-phone"
                value={areaDraft.phone}
                onChange={(event) => setAreaDraft((prev) => ({ ...prev, phone: event.target.value }))}
              />
              {areaFieldErrors.phone ? <p className="text-xs text-destructive">{areaFieldErrors.phone}</p> : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAreaModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveArea}
              disabled={
                savingArea ||
                !areaDraft.name.trim() ||
                !areaDraft.pastorName.trim() ||
                !areaDraft.phone.trim()
              }
            >
              {savingArea ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              {editingAreaId ? 'Save changes' : 'Add area'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
