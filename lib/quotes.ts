import { resolveMediaImageUrl } from '@/lib/api';

export type QuoteRecord = {
  id: string;
  quote: string;
  author?: string | null;
  imageUrl?: string | null;
  activeYear: number;
  activeMonth: number;
  activeDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export function getUtcYearMonth(date = new Date()) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
  };
}

export function formatQuoteMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function monthInputValue(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function parseMonthInput(value: string): { year: number; month: number } | null {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || month < 1 || month > 12) return null;
  return { year, month };
}

export function resolveQuoteImageUrl(imageUrl?: string | null) {
  const resolved = resolveMediaImageUrl(imageUrl);
  return resolved || '';
}

export function quoteImagePathForApi(imageUrl: string) {
  const trimmed = imageUrl.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/uploads/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith('/uploads/')) {
      return parsed.pathname;
    }
  } catch {
    // relative or invalid
  }
  return trimmed;
}

export function normalizeQuoteRecord(raw: unknown): QuoteRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const id = typeof item.id === 'string' ? item.id : '';
  const quote = typeof item.quote === 'string' ? item.quote : '';
  const activeYear = Number(item.activeYear);
  const activeMonth = Number(item.activeMonth);
  if (!id || !quote.trim() || !Number.isFinite(activeYear) || !Number.isFinite(activeMonth)) {
    return null;
  }
  return {
    id,
    quote,
    author: typeof item.author === 'string' ? item.author : null,
    imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : null,
    activeYear,
    activeMonth,
    activeDate: typeof item.activeDate === 'string' ? item.activeDate : null,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
  };
}

export function quoteArchiveDateIso(quote: QuoteRecord) {
  if (quote.activeYear && quote.activeMonth) {
    return new Date(Date.UTC(quote.activeYear, quote.activeMonth - 1, 1)).toISOString();
  }
  return quote.createdAt || new Date().toISOString();
}

export function mapQuoteForArchive(quote: QuoteRecord) {
  return {
    id: quote.id,
    quote: quote.quote,
    author: quote.author || 'PICC',
    imageUrl: resolveQuoteImageUrl(quote.imageUrl) || undefined,
    createdAt: quoteArchiveDateIso(quote),
    monthLabel: formatQuoteMonth(quote.activeYear, quote.activeMonth),
  };
}

/** Public homepage fetch helper shape */
export function normalizePublicQuote(raw: unknown): QuoteRecord | null {
  return normalizeQuoteRecord(raw);
}
