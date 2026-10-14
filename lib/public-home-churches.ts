import { apiFetch } from '@/lib/api';

export type PublicHomeChurch = {
  id: string;
  zoneId: string;
  name: string;
  pastorName: string;
  phone: string;
  sortOrder?: number;
};

export type PublicZoneWithChurches = {
  id: string;
  name: string;
  zonalPastorName: string | null;
  zonalPastorPhone: string | null;
  sortOrder?: number;
  churchCount?: number;
  churches: PublicHomeChurch[];
};

type ZonesWithChurchesResponse = {
  zones?: PublicZoneWithChurches[];
};

export const isPlaceholderContact = (value: string | null | undefined) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase();
  return lower === 'to be added' || lower === 'tba' || lower === 'n/a';
};

export const sortZones = (zones: PublicZoneWithChurches[]) =>
  [...zones].sort((a, b) => {
    const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

export const sortChurches = (churches: PublicHomeChurch[]) =>
  [...churches].sort((a, b) => {
    const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

export const churchMatchesSearch = (church: PublicHomeChurch, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [church.name, church.pastorName, church.phone]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
};

export async function fetchPublicZonesWithChurches(search?: string): Promise<PublicZoneWithChurches[]> {
  const params = new URLSearchParams({ includeChurches: 'true' });
  const trimmed = search?.trim();
  if (trimmed) params.set('q', trimmed);

  const response = await apiFetch(`/api/public/zones?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to load home churches.');
  }

  const data = (await response.json()) as ZonesWithChurchesResponse;
  const zones = Array.isArray(data.zones) ? data.zones : [];
  return sortZones(
    zones.map((zone) => ({
      ...zone,
      churches: sortChurches(Array.isArray(zone.churches) ? zone.churches : []),
    })),
  );
}
