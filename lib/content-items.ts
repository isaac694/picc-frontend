import { apiFetch, resolveMediaImageUrl } from '@/lib/api';

/** One row of an editable list (backend `ContentItem`). */
export type ContentItem = {
  id: string;
  collection: string;
  title: string;
  subtitle: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  data: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
  views: number;
  createdAt?: string;
  updatedAt?: string;
};

/** Built-in rows a page shows until an admin saves the list. */
export type ContentSeed = Partial<Omit<ContentItem, 'id' | 'collection'>> & { title: string };

export const CONTENT_COLLECTIONS = {
  aboutTenets: 'about.tenets',
  aboutCoreValues: 'about.core-values',
  aboutYearlyThemes: 'about.yearly-themes',
  contactCards: 'contact.cards',
  contactOffices: 'contact.offices',
  musicVideos: 'music.videos',
  musicAudios: 'music.audios',
  ministryInitiatives: (ministryKey: string) => `ministry.${ministryKey}.initiatives`,
} as const;

function parseItem(value: unknown): ContentItem | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id : '';
  if (!id) return null;
  const text = (key: string) => (typeof record[key] === 'string' ? (record[key] as string) : '');
  return {
    id,
    collection: text('collection'),
    title: text('title'),
    subtitle: text('subtitle'),
    body: text('body'),
    imageUrl: text('imageUrl'),
    linkUrl: text('linkUrl'),
    data: record.data && typeof record.data === 'object' && !Array.isArray(record.data) ? (record.data as Record<string, unknown>) : {},
    isActive: record.isActive !== false,
    sortOrder: typeof record.sortOrder === 'number' ? record.sortOrder : 0,
    views: typeof record.views === 'number' ? record.views : 0,
    createdAt: text('createdAt') || undefined,
    updatedAt: text('updatedAt') || undefined,
  };
}

export function parseContentItems(value: unknown): ContentItem[] {
  return Array.isArray(value) ? value.map(parseItem).filter((item): item is ContentItem => Boolean(item)) : [];
}

/** Turns built-in rows into display items so pages can render one shape either way. */
export function seedsToItems(collection: string, seeds: ContentSeed[]): ContentItem[] {
  return seeds.map((seed, index) => ({
    id: `seed-${collection}-${index}`,
    collection,
    title: seed.title,
    subtitle: seed.subtitle || '',
    body: seed.body || '',
    imageUrl: seed.imageUrl || '',
    linkUrl: seed.linkUrl || '',
    data: seed.data || {},
    isActive: seed.isActive !== false,
    sortOrder: index,
    views: 0,
  }));
}

/**
 * Loads several public lists at once. A list that has never been saved returns null so the
 * page can keep its built-in content; a saved but empty list returns [].
 */
export async function fetchContentCollections(collections: string[]): Promise<Record<string, ContentItem[] | null>> {
  const empty = Object.fromEntries(collections.map((name) => [name, null])) as Record<string, ContentItem[] | null>;
  try {
    const response = await apiFetch(`/api/content?collections=${encodeURIComponent(collections.join(','))}`);
    if (!response.ok) return empty;
    const payload = (await response.json().catch(() => null)) as {
      collections?: Record<string, unknown>;
      saved?: Record<string, boolean>;
    } | null;
    const result = { ...empty };
    for (const name of collections) {
      const items = parseContentItems(payload?.collections?.[name]);
      result[name] = payload?.saved?.[name] || items.length ? items : null;
    }
    return result;
  } catch {
    return empty;
  }
}

export async function fetchContentCollection(collection: string): Promise<ContentItem[] | null> {
  const result = await fetchContentCollections([collection]);
  return result[collection] ?? null;
}

export function contentImage(item: Pick<ContentItem, 'imageUrl'>, fallback = ''): string {
  return resolveMediaImageUrl(item.imageUrl) || fallback;
}

export function recordContentView(collection: string, id: string) {
  if (id.startsWith('seed-')) return;
  void apiFetch(`/api/content/${collection}/${id}/view`, { method: 'POST' }).catch(() => undefined);
}
