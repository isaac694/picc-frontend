const LOCAL_API_BASE_URL = 'http://localhost:5000';
const PROD_API_BASE_URL = 'https://backend.piccworldwide.org';

const normalize = (value: string) => value.replace(/\/+$/, '');

const normalizeConfiguredBaseUrl = (value: string | undefined): string | null => {
  if (!value) return null;

  const normalized = normalize(value.trim());
  try {
    new URL(normalized);
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
  const configuredBaseUrl = normalizeConfiguredBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (process.env.NODE_ENV !== 'production') {
    return LOCAL_API_BASE_URL;
  }

  return PROD_API_BASE_URL;
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
