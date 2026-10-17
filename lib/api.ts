import { PROJECT_PAGE_IMAGES_UPLOAD_PREFIX } from '@/lib/project-page-images-upload';

const LOCAL_API_BASE_URL = 'http://localhost:5000';
const PROD_API_BASE_URL = 'https://backend.piccworldwide.org';
const ALLOWED_API_HOSTS = new Set(['localhost', '127.0.0.1', 'backend.piccworldwide.org']);

const normalize = (value: string) => value.replace(/\/+$/, '');

const normalizeConfiguredBaseUrl = (value: string | undefined): string | null => {
  if (!value) return null;

  //shshshshs

  const normalized = normalize(value.trim());
  try {
    const url = new URL(normalized);
    if (!ALLOWED_API_HOSTS.has(url.hostname)) return null;
    if ((url.hostname === 'localhost' || url.hostname === '127.0.0.1') && url.port !== '5000') return null;
    return normalized;
  } catch {
    return null;
  }
};

const buildUrl = (baseUrl: string, path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

const resolveApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return PROD_API_BASE_URL;
  }

  const configuredBaseUrl = normalizeConfiguredBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  return LOCAL_API_BASE_URL;
};

const resolveFallbackApiBaseUrl = () => {
  const configuredFallbackBaseUrl = normalizeConfiguredBaseUrl(process.env.NEXT_PUBLIC_API_FALLBACK_BASE_URL);
  if (configuredFallbackBaseUrl) {
    return configuredFallbackBaseUrl;
  }

  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return LOCAL_API_BASE_URL;
  }
  return null;
};

export const API_BASE_URL = resolveApiBaseUrl();
export const API_FALLBACK_BASE_URL = resolveFallbackApiBaseUrl();

export function apiUrl(path: string): string {
  return buildUrl(API_BASE_URL, path);
}

const BACKEND_MEDIA_HOSTS = new Set(['localhost', '127.0.0.1', 'backend.piccworldwide.org']);

/** Turn API-stored paths (e.g. /uploads/…) into a URL the site can load. */
export function resolveMediaImageUrl(url?: string | null): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith(PROJECT_PAGE_IMAGES_UPLOAD_PREFIX)) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads')) {
    return apiUrl(trimmed);
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith('/uploads') && BACKEND_MEDIA_HOSTS.has(parsed.hostname)) {
        return apiUrl(`${parsed.pathname}${parsed.search}`);
      }
    } catch {
      return trimmed;
    }
    return trimmed;
  }

  return trimmed;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const primaryUrl = buildUrl(API_BASE_URL, path);
  const fallbackBase = API_FALLBACK_BASE_URL;
  const fallbackUrl = fallbackBase ? buildUrl(fallbackBase, path) : null;

  try {
    const response = await fetch(primaryUrl, init);
    if (
      fallbackUrl &&
      fallbackUrl !== primaryUrl &&
      (response.status === 502 ||
        response.status === 503 ||
        response.status === 504 ||
        response.status === 521 ||
        response.status === 522 ||
        response.status === 523 ||
        response.status === 524)
    ) {
      return fetch(fallbackUrl, init);
    }
    return response;
  } catch {
    if (fallbackUrl) {
      try {
        return await fetch(fallbackUrl, init);
      } catch {
        return new Response(null, { status: 503, statusText: 'Service Unavailable' });
      }
    }
    return new Response(null, { status: 503, statusText: 'Service Unavailable' });
  }
}

/** Prefer backend `{ error }`, then `{ message }`, for user-facing toast text. */
export function messageFromApiPayload(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const record = data as Record<string, unknown>;
  if (typeof record.error === 'string' && record.error.trim()) return record.error.trim();
  if (typeof record.message === 'string' && record.message.trim()) return record.message.trim();
  return fallback;
}
