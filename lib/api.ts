const LOCAL_API_BASE_URL = 'http://localhost:5000';
const PROD_API_BASE_URL = 'https://picc-backend.onrender.com';

const normalize = (value: string) => value.replace(/\/+$/, '');

const resolveApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return normalize(process.env.NEXT_PUBLIC_API_BASE_URL);
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return LOCAL_API_BASE_URL;
    }
    return PROD_API_BASE_URL;
  }

  return PROD_API_BASE_URL;
};

export const API_BASE_URL = resolveApiBaseUrl();

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
