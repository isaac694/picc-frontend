export type Zone = {
  id: string;
  name: string;
  zonalPastorName: string | null;
  zonalPastorPhone: string | null;
};

export type ZoneArea = {
  id: string;
  zoneId: string;
  name: string;
  pastorName: string;
  phone: string;
};

export type ZoneDraft = {
  name: string;
  zonalPastorName: string;
  zonalPastorPhone: string;
};

export type AreaDraft = {
  name: string;
  pastorName: string;
  phone: string;
};

export const EMPTY_ZONE_DRAFT: ZoneDraft = {
  name: '',
  zonalPastorName: '',
  zonalPastorPhone: '',
};

export const EMPTY_AREA_DRAFT: AreaDraft = {
  name: '',
  pastorName: '',
  phone: '',
};

/** Accepts current API shape and legacy fields from older responses. */
export const normalizeZone = (raw: unknown): Zone | null => {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.id !== 'string' || typeof record.name !== 'string') return null;

  const legacyDescription =
    typeof record.description === 'string' ? record.description.replace(/^Zonal Pastor:\s*/i, '').trim() : '';
  const pastorName =
    (typeof record.zonalPastorName === 'string' ? record.zonalPastorName : null) ??
    (legacyDescription || null);
  const pastorPhone =
    (typeof record.zonalPastorPhone === 'string' ? record.zonalPastorPhone : null) ??
    (typeof record.phone === 'string' ? record.phone : null);

  return {
    id: record.id,
    name: record.name,
    zonalPastorName: pastorName,
    zonalPastorPhone: pastorPhone,
  };
};

export const normalizeArea = (raw: unknown): ZoneArea | null => {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  if (
    typeof record.id !== 'string' ||
    typeof record.zoneId !== 'string' ||
    typeof record.name !== 'string' ||
    typeof record.pastorName !== 'string' ||
    typeof record.phone !== 'string'
  ) {
    return null;
  }

  return {
    id: record.id,
    zoneId: record.zoneId,
    name: record.name,
    pastorName: record.pastorName,
    phone: record.phone,
  };
};

export const zoneToDraft = (zone: Zone): ZoneDraft => ({
  name: zone.name,
  zonalPastorName: zone.zonalPastorName ?? '',
  zonalPastorPhone: zone.zonalPastorPhone ?? '',
});

export const areaToDraft = (area: ZoneArea): AreaDraft => ({
  name: area.name,
  pastorName: area.pastorName,
  phone: area.phone,
});

export const parseFieldErrors = (data: unknown): Record<string, string> => {
  if (!data || typeof data !== 'object') return {};
  const errors = (data as { errors?: Array<{ field?: string; error?: string }> }).errors;
  if (!Array.isArray(errors)) return {};
  return errors.reduce<Record<string, string>>((acc, item) => {
    if (item.field && item.error) acc[item.field] = item.error;
    return acc;
  }, {});
};

export const zoneBadgeColor = (name: string) => {
  const palette = [
    'bg-amber-100 text-amber-900 ring-amber-200',
    'bg-sky-100 text-sky-900 ring-sky-200',
    'bg-emerald-100 text-emerald-900 ring-emerald-200',
    'bg-violet-100 text-violet-900 ring-violet-200',
    'bg-rose-100 text-rose-900 ring-rose-200',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash + name.charCodeAt(i)) % palette.length;
  return palette[hash];
};

export const sortZones = (zones: Zone[]) => [...zones].sort((a, b) => a.name.localeCompare(b.name));

export const sortAreas = (areas: ZoneArea[]) => [...areas].sort((a, b) => a.name.localeCompare(b.name));

export const zoneDraftToPayload = (draft: ZoneDraft) => ({
  name: draft.name.trim(),
  zonalPastorName: draft.zonalPastorName.trim() || null,
  zonalPastorPhone: draft.zonalPastorPhone.trim() || null,
});

export const areaDraftToPayload = (draft: AreaDraft) => ({
  name: draft.name.trim(),
  pastorName: draft.pastorName.trim(),
  phone: draft.phone.trim(),
});
