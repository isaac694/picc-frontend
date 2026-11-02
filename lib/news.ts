import { apiFetch, resolveMediaImageUrl } from '@/lib/api';
import type { NewsSectionItem } from '@/components/NewsSection';

export type NewsArticle = {
  id: string;
  scope: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  author: string | null;
  imageUrl: string | null;
  gallery: string[];
  isActive: boolean;
  isFeatured: boolean;
  publishedAt: string;
  views: number;
  readMinutes: number;
  /** Built-in stories have no page of their own; they open in a reader dialog. */
  isFallback?: boolean;
};

export type NewsListResponse = {
  scope: string;
  hasArticles: boolean;
  page: number;
  pages: number;
  total: number;
  categories: Array<{ name: string; count: number }>;
  articles: NewsArticle[];
};

/** Labels for each news section. Ministry keys match the backend ministry keys. */
export const NEWS_SCOPES: Array<{ key: string; label: string; href: string }> = [
  { key: 'church', label: 'Church News', href: '/news' },
  { key: 'icd', label: 'ICD', href: '/ministries/icd' },
  { key: 'men-of-valour', label: 'Men of Valour', href: '/ministries/men-of-valour' },
  { key: 'prison-ministry', label: 'Prison Ministry', href: '/ministries/prison-ministry' },
  { key: 'youth-church', label: 'Youth Church', href: '/ministries/youth-church-ministry' },
  { key: 'women-of-hope', label: 'Women of Hope', href: '/ministries/women-of-hope' },
  { key: 'wailing-woman', label: 'Wailing Woman', href: '/ministries/wailing-woman' },
  { key: 'rivers-of-hope', label: 'Rivers of Hope', href: '/ministries/rivers-of-hope' },
  { key: 'heritage', label: 'Heritage', href: '/ministries/heritage' },
];

export function newsScopeLabel(scope: string) {
  return NEWS_SCOPES.find((entry) => entry.key === scope)?.label || 'News';
}

export function newsImage(article: Pick<NewsArticle, 'imageUrl'>, fallback = '/hero/hero-4.JPG') {
  return resolveMediaImageUrl(article.imageUrl) || fallback;
}

export function formatNewsDate(value?: string | null, style: 'long' | 'short' = 'long') {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', style === 'long'
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
}

function parseArticle(value: unknown): NewsArticle | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string' || typeof record.slug !== 'string') return null;
  return {
    id: record.id,
    scope: String(record.scope || 'church'),
    slug: record.slug,
    title: String(record.title || ''),
    excerpt: String(record.excerpt || ''),
    content: typeof record.content === 'string' ? record.content : undefined,
    category: String(record.category || 'Updates'),
    author: typeof record.author === 'string' ? record.author : null,
    imageUrl: typeof record.imageUrl === 'string' ? record.imageUrl : null,
    gallery: Array.isArray(record.gallery) ? record.gallery.filter((url): url is string => typeof url === 'string') : [],
    isActive: record.isActive !== false,
    isFeatured: record.isFeatured === true,
    publishedAt: String(record.publishedAt || ''),
    views: typeof record.views === 'number' ? record.views : 0,
    readMinutes: typeof record.readMinutes === 'number' ? record.readMinutes : 1,
  };
}

export function parseArticles(value: unknown): NewsArticle[] {
  return Array.isArray(value) ? value.map(parseArticle).filter((item): item is NewsArticle => Boolean(item)) : [];
}

export async function fetchNews(params: {
  scope: string;
  page?: number;
  limit?: number;
  category?: string;
  q?: string;
}): Promise<NewsListResponse | null> {
  const search = new URLSearchParams({ scope: params.scope });
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.category && params.category !== 'All') search.set('category', params.category);
  if (params.q) search.set('q', params.q);
  try {
    const response = await apiFetch(`/api/news?${search.toString()}`);
    if (!response.ok) return null;
    const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    if (!data) return null;
    return {
      scope: String(data.scope || params.scope),
      hasArticles: data.hasArticles === true,
      page: Number(data.page) || 1,
      pages: Number(data.pages) || 1,
      total: Number(data.total) || 0,
      categories: Array.isArray(data.categories)
        ? (data.categories as Array<{ name: string; count: number }>).filter((entry) => entry && typeof entry.name === 'string')
        : [],
      articles: parseArticles(data.articles),
    };
  } catch {
    return null;
  }
}

export async function fetchNewsArticle(slug: string): Promise<{ article: NewsArticle; related: NewsArticle[] } | null> {
  try {
    const response = await apiFetch(`/api/news/${encodeURIComponent(slug)}`);
    if (!response.ok) return null;
    const data = (await response.json().catch(() => null)) as { article?: unknown; related?: unknown } | null;
    const article = parseArticle(data?.article);
    if (!article) return null;
    return { article, related: parseArticles(data?.related) };
  } catch {
    return null;
  }
}

export function recordNewsView(slug: string) {
  try {
    const key = `picc-news-viewed:${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    // Storage blocked: still count the view.
  }
  void apiFetch(`/api/news/${encodeURIComponent(slug)}/view`, { method: 'POST' }).catch(() => undefined);
}

/** Converts a page's built-in news cards into article shape for the shared news layout. */
export function fallbackNewsToArticles(scope: string, items: NewsSectionItem[]): NewsArticle[] {
  return items.map((item, index) => {
    const parsedDate = item.date ? new Date(item.date) : null;
    return {
      id: `fallback-${scope}-${index}`,
      scope,
      slug: `fallback-${scope}-${index}`,
      title: item.title,
      excerpt: item.description,
      content: item.description,
      category: item.badge || 'Updates',
      author: null,
      imageUrl: item.image,
      gallery: [],
      isActive: true,
      isFeatured: index === 0,
      publishedAt: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : item.date,
      views: 0,
      readMinutes: 1,
      isFallback: true,
    };
  });
}
