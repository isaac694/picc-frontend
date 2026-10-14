import { apiFetch } from '@/lib/api';

/** Page size when a single zone is selected. */
export const HOME_CHURCHES_PAGE_SIZE = 4;

/** Page size for `GET /api/public/home-churches` when no zone filter (all zones). */
export const HOME_CHURCHES_ALL_ZONES_PAGE_SIZE = 6;

export type PublicHomeChurch = {
  id: string;
  zoneId: string;
  name: string;
  pastorName: string;
  phone: string;
  sortOrder?: number;
};

export type PublicZoneSummary = {
  id: string;
  name: string;
  zonalPastorName: string | null;
  zonalPastorPhone: string | null;
  sortOrder?: number;
  churchCount?: number;
};

export type PublicHomeChurchWithZone = PublicHomeChurch & {
  zone?: PublicZoneSummary;
};

/** @deprecated Use {@link PublicZoneSummary} — kept for older imports. */
export type PublicZoneWithChurches = PublicZoneSummary & {
  churches: PublicHomeChurch[];
};

export type HomeChurchesPageResult = {
  churches: PublicHomeChurchWithZone[];
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type HomeChurchesApiResponse = {
  churches?: PublicHomeChurchWithZone[];
  count?: number;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export const isPlaceholderContact = (value: string | null | undefined) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase();
  return lower === 'to be added' || lower === 'tba' || lower === 'n/a';
};

export const sortZones = <T extends PublicZoneSummary>(zones: T[]) =>
  [...zones].sort((a, b) => {
    const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

const parseHomeChurchesPage = (data: HomeChurchesApiResponse, limit: number): HomeChurchesPageResult => {
  const churches = Array.isArray(data.churches) ? data.churches : [];
  const total = typeof data.total === 'number' ? data.total : churches.length;
  const page = typeof data.page === 'number' ? data.page : 1;
  const resolvedLimit = typeof data.limit === 'number' ? data.limit : limit;
  const totalPages =
    typeof data.totalPages === 'number' ? data.totalPages : Math.max(1, Math.ceil(total / resolvedLimit));

  return {
    churches,
    count: typeof data.count === 'number' ? data.count : churches.length,
    total,
    page,
    limit: resolvedLimit,
    totalPages,
  };
};

export async function fetchPublicZonesList(): Promise<PublicZoneSummary[]> {
  const response = await apiFetch('/api/public/zones?includeChurches=false');
  if (!response.ok) {
    throw new Error('Failed to load zones.');
  }

  const data = (await response.json()) as { zones?: PublicZoneSummary[] };
  const zones = Array.isArray(data.zones) ? data.zones : [];
  return sortZones(zones);
}

export async function fetchPublicHomeChurchesPage(options: {
  zoneId?: string | null;
  page?: number;
  limit?: number;
  q?: string;
}): Promise<HomeChurchesPageResult> {
  const limit = options.limit ?? HOME_CHURCHES_PAGE_SIZE;
  const page = options.page ?? 1;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (options.zoneId) params.set('zoneId', options.zoneId);
  const trimmedQ = options.q?.trim();
  if (trimmedQ) params.set('q', trimmedQ);

  const response = await apiFetch(`/api/public/home-churches?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to load home churches.');
  }

  const data = (await response.json()) as HomeChurchesApiResponse;
  return parseHomeChurchesPage(data, limit);
}

export async function searchPublicHomeChurchesPage(options: {
  zoneId?: string | null;
  q: string;
  page?: number;
  limit?: number;
}): Promise<HomeChurchesPageResult> {
  const limit = options.limit ?? HOME_CHURCHES_PAGE_SIZE;
  const page = options.page ?? 1;
  const trimmedQ = options.q.trim();
  if (!trimmedQ) {
    return fetchPublicHomeChurchesPage({ zoneId: options.zoneId, page, limit });
  }

  const params = new URLSearchParams({
    q: trimmedQ,
    page: String(page),
    limit: String(limit),
  });
  if (options.zoneId) params.set('zoneId', options.zoneId);

  const response = await apiFetch(`/api/public/home-churches/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to search home churches.');
  }

  const data = (await response.json()) as HomeChurchesApiResponse;
  return parseHomeChurchesPage(data, limit);
}
