import { apiUrl } from '@/lib/api';

export type WebsiteAd = {
  id: string;
  name: string;
  description: string;
  /** Banner / popup image (API `url`). */
  url: string;
  /** Click destination (API `link`). */
  link: string;
  /** Legacy / duplicate of banner when API also sends `imageUrl`. */
  imageUrl: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function parseWebsiteAd(value: unknown): WebsiteAd | null {
  if (!isRecord(value)) return null;
  const id = String(value.id || '').trim();
  if (!id) return null;

  const rawUrl = String(value.url || '').trim();
  const rawLink = String(value.link || value.href || value.targetUrl || '').trim();
  const explicitImage = String(
    value.imageUrl || value.fileUrl || value.thumbnailUrl || value.mediaUrl || '',
  ).trim();

  let banner = '';
  let link = rawLink;

  if (isWebsiteAdImageUrl(rawUrl)) {
    banner = rawUrl;
  } else if (explicitImage) {
    banner = explicitImage;
  } else if (rawUrl) {
    banner = rawUrl;
  } else {
    banner = explicitImage;
  }

  return {
    id,
    name: String(value.name || '').trim(),
    description: String(value.description || '').trim(),
    url: banner,
    link,
    imageUrl: banner || explicitImage,
    isActive: value.isActive !== false,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : undefined,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : undefined,
  };
}

export function parseWebsiteAds(payload: unknown): WebsiteAd[] {
  if (!isRecord(payload)) return [];
  const list = payload.ads;
  if (!Array.isArray(list)) return [];
  return list.map(parseWebsiteAd).filter((item): item is WebsiteAd => Boolean(item));
}

export const ADMIN_WEBSITE_ADS_BASE = '/api/admin/website-ads';

export function resolveWebsiteAdMediaUrl(value?: string | null): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  return trimmed;
}

export function isWebsiteAdImageUrl(value?: string | null): boolean {
  const trimmed = String(value || '').trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/uploads')) return true;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const { hostname } = new URL(trimmed);
      if (hostname === 'res.cloudinary.com' || hostname.endsWith('.cloudinary.com')) return true;
    } catch {
      // Fall through to extension check.
    }
  }
  return /\.(png|jpe?g|gif|webp|svg|avif|bmp)(\?|#|$)/i.test(trimmed);
}

export function websiteAdThumbnailSource(ad: Pick<WebsiteAd, 'imageUrl' | 'url'>): string {
  if (ad.url && isWebsiteAdImageUrl(ad.url)) return resolveWebsiteAdMediaUrl(ad.url);
  if (ad.imageUrl) return resolveWebsiteAdMediaUrl(ad.imageUrl);
  if (ad.url) return resolveWebsiteAdMediaUrl(ad.url);
  return '';
}

/** Click destination only — never the banner `url`. Empty means the popup is not navigable. */
export function websiteAdLinkUrl(ad: Pick<WebsiteAd, 'link'>): string {
  return String(ad.link || '').trim();
}

/** Resolve banner path for API `url` (uploads → backend origin, Cloudinary as-is). */
export function websiteAdBannerUrlForApi(storedPath: string): string {
  const normalized = normalizeWebsiteAdStoragePath(storedPath);
  if (!normalized) return '';
  return resolveWebsiteAdMediaUrl(normalized);
}

/** Resolve click target for API `link` (relative site paths → absolute on current origin). */
export function websiteAdLinkForApi(link: string): string {
  const trimmed = link.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (typeof window === 'undefined') return trimmed;
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${window.location.origin}${path}`;
}

export function normalizeWebsiteAdStoragePath(value?: string | null): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/uploads')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith('/uploads')) return parsed.pathname;
  } catch {
    // Not an absolute URL.
  }
  return trimmed;
}

export function websiteAdInitials(name?: string): string {
  const parts = String(name || 'Ad').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || 'A') + (parts[1]?.[0] || '')).toUpperCase();
}
