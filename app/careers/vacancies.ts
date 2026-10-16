import { apiFetch, apiUrl } from '@/lib/api';
import { htmlToText, normalizePortalConfig, type PortalConfig } from '@/lib/hr-portal';

export type Vacancy = {
  id?: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  type: string;
  posted: string;
  closingDate: string;
  summary: string;
  description?: string;
  requirements: string[];
  responsibilities: string[];
  documents: string[];
  portalConfig?: PortalConfig | null;
};

/** Public list: GET /api/hr/vacancies → { vacancies: ApiVacancy[] } */
export type ApiVacancy = {
  id?: string;
  slug?: string;
  title?: string;
  department?: string;
  location?: string;
  employmentType?: string;
  type?: string;
  summary?: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  requiredDocuments?: Array<string | { label?: string; name?: string; description?: string }>;
  documents?: string[];
  status?: string;
  closesAt?: string;
  closingDate?: string;
  publishedAt?: string;
  postedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  portalConfig?: PortalConfig | null;
};

export type HrVacanciesListResponse = {
  vacancies?: ApiVacancy[];
};

function formatDate(value?: string) {
  if (!value) return 'Not specified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function firstText(...values: Array<string | undefined>) {
  return values.find((value) => htmlToText(value)) || '';
}

function firstList(...values: Array<string[] | undefined>) {
  return values.find((value) => Array.isArray(value) && value.length) || [];
}

function isPublicOpenVacancy(vacancy: ApiVacancy): boolean {
  const status = vacancy.status?.trim().toUpperCase();
  if (!status) return true;
  return status === 'OPEN';
}

function mergeVacancyPayload(detail: ApiVacancy, portal: ApiVacancy, portalConfig?: PortalConfig | null) {
  return {
    ...detail,
    ...portal,
    id: portal.id || detail.id,
    slug: portal.slug || detail.slug,
    title: firstText(portal.title, detail.title) || portal.title || detail.title,
    department: firstText(portal.department, detail.department) || portal.department || detail.department,
    location: firstText(portal.location, detail.location) || portal.location || detail.location,
    summary: firstText(portal.summary, detail.summary) || portal.summary || detail.summary,
    description: firstText(portal.description, detail.description) || portal.description || detail.description,
    requirements: firstList(portal.requirements, detail.requirements),
    responsibilities: firstList(portal.responsibilities, detail.responsibilities),
    requiredDocuments: firstList(
      (portal.requiredDocuments || []).map((document) => (typeof document === 'string' ? document : document.label || document.name || '')).filter(Boolean),
      (detail.requiredDocuments || []).map((document) => (typeof document === 'string' ? document : document.label || document.name || '')).filter(Boolean),
      portal.documents,
      detail.documents,
    ),
    portalConfig: portalConfig || portal.portalConfig || detail.portalConfig,
  } satisfies ApiVacancy;
}

export function normalizeVacancy(vacancy: ApiVacancy): Vacancy {
  const requiredDocuments = vacancy.requiredDocuments || vacancy.documents || [];
  const portalConfig = normalizePortalConfig(vacancy.portalConfig);
  const display = portalConfig?.display;
  const description = firstText(vacancy.description);

  return {
    id: vacancy.id,
    slug: vacancy.slug || vacancy.id || '',
    title: display?.title || vacancy.title || 'Untitled Vacancy',
    department: display?.department || vacancy.department || 'PICC',
    location: display?.location || vacancy.location || 'Lilongwe',
    type: display?.employmentType || vacancy.employmentType || vacancy.type || 'Full Time',
    posted: formatDate(vacancy.publishedAt || vacancy.postedAt || vacancy.createdAt),
    closingDate: formatDate(vacancy.closesAt || vacancy.closingDate),
    summary:
      htmlToText(display?.summary || display?.subtitle || vacancy.summary || vacancy.description) ||
      'Vacancy details will be shared soon.',
    description: description || undefined,
    requirements: vacancy.requirements || [],
    responsibilities: vacancy.responsibilities || [],
    documents: requiredDocuments.map((document) => {
      if (typeof document === 'string') return document;
      return document.label || document.name || document.description || 'Required document';
    }),
    portalConfig,
  };
}

export function parseVacanciesResponse(data: unknown): ApiVacancy[] {
  if (Array.isArray(data)) {
    return data.filter(isPublicOpenVacancy);
  }

  if (data && typeof data === 'object') {
    const list = (data as HrVacanciesListResponse).vacancies;
    if (Array.isArray(list)) {
      return list.filter(isPublicOpenVacancy);
    }
  }

  return [];
}

export async function vacanciesFromApiResponse(response: Response): Promise<Vacancy[]> {
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || data === null) return [];
  return parseVacanciesResponse(data).map(normalizeVacancy);
}

/** Browser: calls backend directly via apiFetch (visible in DevTools Network). */
export async function loadPublicVacanciesFromApi(): Promise<Vacancy[]> {
  try {
    const response = await apiFetch('/api/hr/vacancies');
    return vacanciesFromApiResponse(response);
  } catch {
    return [];
  }
}

/** Server components / SSR */
export async function getPublicVacancies(): Promise<Vacancy[]> {
  try {
    const response = await fetch(apiUrl('/api/hr/vacancies'), {
      cache: 'no-store',
    });
    return vacanciesFromApiResponse(response);
  } catch {
    return [];
  }
}

export async function getPublicVacancyBySlug(slug: string): Promise<Vacancy | undefined> {
  try {
    const [detailResponse, portalResponse] = await Promise.all([
      fetch(apiUrl(`/api/hr/vacancies/${encodeURIComponent(slug)}`), { cache: 'no-store' }),
      fetch(apiUrl(`/api/hr/vacancies/${encodeURIComponent(slug)}/portal`), { cache: 'no-store' }),
    ]);
    const detailData = await detailResponse.json().catch(() => ({}));
    const portalData = await portalResponse.json().catch(() => ({}));
    const detailVacancy: ApiVacancy = detailResponse.ok ? (detailData.vacancy || detailData) : {};
    const portalVacancy: ApiVacancy = portalResponse.ok ? (portalData.vacancy || {}) : {};

    if (!isPublicOpenVacancy(detailVacancy) && !isPublicOpenVacancy(portalVacancy)) {
      return undefined;
    }

    const portalConfig = portalResponse.ok
      ? portalData.portalConfig || portalVacancy.portalConfig || detailVacancy.portalConfig
      : detailVacancy.portalConfig;

    if (detailResponse.ok || portalResponse.ok) {
      return normalizeVacancy(mergeVacancyPayload(detailVacancy, portalVacancy, portalConfig));
    }
  } catch {
    return undefined;
  }

  return undefined;
}
