export type MediaNewsItem = {
  id: string;
  badge: string;
  date: string;
  title: string;
  description: string;
  imageUrl: string;
  isFallback?: boolean;
  fallbackIndex?: number;
};

export type MediaGalleryItem = {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  isFallback?: boolean;
  fallbackIndex?: number;
};

export type MediaBookItem = {
  id: string;
  title: string;
  author: string;
  description: string;
  imageUrl: string;
  fileUrl: string;
  isFallback?: boolean;
  fallbackIndex?: number;
};

export type MediaMagazineItem = {
  id: string;
  title: string;
  issue: string;
  fileUrl: string;
  imageUrl: string;
  isFallback?: boolean;
  fallbackIndex?: number;
};

export const MEDIA_NEWS_MAX_ITEMS = 6;

export const DEFAULT_MEDIA_NEWS: Omit<MediaNewsItem, 'id'>[] = [
  {
    badge: 'Community',
    date: 'March 2026',
    title: 'Easter Celebrations & Community Outreach',
    description:
      'A look at how our church came together this Easter season to serve families across the community.',
    imageUrl: '/hero/hero-4.JPG',
  },
  {
    badge: 'Youth',
    date: 'March 2026',
    title: 'Youth Revival Week Highlights',
    description:
      'Our youth ministry hosted an incredible week of worship, fellowship, and spiritual growth.',
    imageUrl: '/hero/hero-10.JPG',
  },
  {
    badge: 'Updates',
    date: 'February 2026',
    title: 'New Building Expansion Update',
    description:
      'Construction progress on our new fellowship hall — see the latest milestones and timeline.',
    imageUrl: '/hero/hero-8.JPG',
  },
  {
    badge: 'Worship',
    date: 'February 2026',
    title: 'Night of Praise Recap',
    description:
      'A beautiful night of worship, prayer, and testimonies that lifted hearts across the campus.',
    imageUrl: '/hero/hero-7.png',
  },
  {
    badge: 'Outreach',
    date: 'January 2026',
    title: 'Campus Volunteer Drive',
    description:
      'Members gathered to serve, share resources, and pray with families in the neighborhood.',
    imageUrl: '/hero/hero-5.png',
  },
  {
    badge: 'Ministry',
    date: 'January 2026',
    title: 'Women of Hope Gathering',
    description:
      'A powerful gathering featuring teaching, fellowship, and encouragement for every season.',
    imageUrl: '/hero/hero-3.JPG',
  },
];

export const DEFAULT_MEDIA_GALLERY: Omit<MediaGalleryItem, 'id'>[] = [
  { title: 'Worship Service', category: 'worship', imageUrl: '/hero/hero-10.JPG' },
  { title: 'Community Outreach', category: 'outreach', imageUrl: '/hero/hero-8.JPG' },
  { title: 'Youth Gathering', category: 'youth', imageUrl: '/hero/hero-9.JPG' },
  { title: 'Night of Praise', category: 'music', imageUrl: '/hero/hero-5.png' },
  { title: 'Celebration Sunday', category: 'celebration', imageUrl: '/hero/hero-6.jpg' },
  { title: 'Morning Prayer', category: 'prayer', imageUrl: '/hero/hero-4.JPG' },
  { title: 'Midweek Worship', category: 'worship', imageUrl: '/hero/hero-2.jpg' },
  { title: 'Campus Fellowship', category: 'youth', imageUrl: '/hero/hero-3.JPG' },
];

export const DEFAULT_MEDIA_BOOKS: Omit<MediaBookItem, 'id'>[] = [
  {
    title: 'Fire on the Altar Volume 3',
    author: 'PICC Publishing',
    description: 'A focused teaching on prayer, consecration, and spiritual hunger.',
    imageUrl: '/fire_altar/fire-on-altar-cover.jpg',
    fileUrl: '/fire_altar/FIRE%20ON%20THE%20ALTAR%20Vol%203.24.pdf',
  },
  {
    title: 'Fire on the Altar Volume 2',
    author: 'PICC Publishing',
    description: 'A focused teaching on prayer, consecration, and spiritual hunger.',
    imageUrl: '/fire_altar/fire-on-altar-cover.jpg',
    fileUrl: '',
  },
  {
    title: 'Fire on the Altar Volume 1',
    author: 'PICC Publishing',
    description: 'A focused teaching on prayer, consecration, and spiritual hunger.',
    imageUrl: '/fire_altar/fire-on-altar-cover.jpg',
    fileUrl: '',
  },
];

export const DEFAULT_MEDIA_MAGAZINES: Omit<MediaMagazineItem, 'id'>[] = [
  {
    title: 'Church Magazine Issue 1',
    issue: 'Issue 1',
    fileUrl: '',
    imageUrl: '/magazine/magazine-1.jpeg',
  },
  {
    title: 'Church Magazine Issue 2',
    issue: 'Issue 2',
    fileUrl: '',
    imageUrl: '/magazine/magazine-2.JPG',
  },
  {
    title: 'Church Magazine Issue 3',
    issue: 'Issue 3',
    fileUrl: '',
    imageUrl: '/magazine/magazine-3.jpeg',
  },
];

type MergeableMediaItem = {
  id: string;
  isFallback?: boolean;
  fallbackIndex?: number;
};

export function buildFallbackItems<T extends MergeableMediaItem>(
  prefix: string,
  defaults: Omit<T, 'id' | 'isFallback' | 'fallbackIndex'>[],
): T[] {
  return defaults.map((item, index) => ({
    ...item,
    id: `fallback-${prefix}-${index}`,
    isFallback: true,
    fallbackIndex: index,
  })) as T[];
}

export function mergeMediaItemsWithFallback<T extends MergeableMediaItem>(loaded: T[], fallbacks: T[]): T[] {
  const remainingFallbacks = fallbacks.filter(
    (fallbackItem) =>
      typeof fallbackItem.fallbackIndex !== 'number' ||
      !loaded.some((loadedItem) => loadedItem.fallbackIndex === fallbackItem.fallbackIndex),
  );

  return [...loaded, ...remainingFallbacks].sort((first, second) => {
    if (first.isFallback !== second.isFallback) return first.isFallback ? 1 : -1;
    const firstIndex = first.fallbackIndex ?? Number.MAX_SAFE_INTEGER;
    const secondIndex = second.fallbackIndex ?? Number.MAX_SAFE_INTEGER;
    if (firstIndex !== secondIndex) return firstIndex - secondIndex;
    return first.id.localeCompare(second.id);
  });
}

export function normalizeLoadedMediaItems<T extends Record<string, unknown>>(items: unknown[]): T[] {
  return items
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      ...item,
      imageUrl: item.imageUrl ? String(item.imageUrl) : '',
      fileUrl: item.fileUrl ? String(item.fileUrl) : '',
    })) as T[];
}
