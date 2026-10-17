/** Public (non-admin) routes admins can link ads and CTAs to. */
export type PublicSitePage = {
  path: string;
  label: string;
  group: string;
};

export const PUBLIC_SITE_PAGE_GROUPS = [
  'Main',
  'About',
  'Ministries',
  'Ministry archives',
  'Schools',
  'Resources',
  'Careers & store',
  'Other',
] as const;

export const PUBLIC_SITE_PAGES: PublicSitePage[] = [
  { group: 'Main', path: '/', label: 'Home' },
  { group: 'Main', path: '/livestream', label: 'Livestream' },
  { group: 'Main', path: '/events', label: 'Events' },
  { group: 'Main', path: '/give', label: 'Give' },
  { group: 'Main', path: '/contact', label: 'Contact' },

  { group: 'About', path: '/about', label: 'About the church' },
  { group: 'About', path: '/about/leadership', label: 'Leadership' },

  { group: 'Ministries', path: '/ministries/icd', label: 'ICD' },
  { group: 'Ministries', path: '/ministries/men-of-valour', label: 'Men of Valour' },
  { group: 'Ministries', path: '/ministries/prison-ministry', label: 'Prison Ministry' },
  { group: 'Ministries', path: '/ministries/youth-church-ministry', label: 'Youth Church Ministry' },
  { group: 'Ministries', path: '/ministries/women-of-hope', label: 'Women of Hope' },
  { group: 'Ministries', path: '/ministries/wailing-woman', label: 'Wailing Woman' },
  { group: 'Ministries', path: '/ministries/rivers-of-hope', label: 'Rivers of Hope' },
  { group: 'Ministries', path: '/ministries/heritage', label: 'Heritage Ministry' },

  { group: 'Ministry archives', path: '/ministries/icd/archive', label: 'ICD archive' },
  { group: 'Ministry archives', path: '/ministries/men-of-valour/archive', label: 'Men of Valour archive' },
  { group: 'Ministry archives', path: '/ministries/prison-ministry/archive', label: 'Prison Ministry archive' },
  {
    group: 'Ministry archives',
    path: '/ministries/youth-church-ministry/archive',
    label: 'Youth Church archive',
  },
  { group: 'Ministry archives', path: '/ministries/women-of-hope/archive', label: 'Women of Hope archive' },
  { group: 'Ministry archives', path: '/ministries/wailing-woman/archive', label: 'Wailing Woman archive' },
  { group: 'Ministry archives', path: '/ministries/rivers-of-hope/archive', label: 'Rivers of Hope archive' },
  { group: 'Ministry archives', path: '/ministries/heritage/archive', label: 'Heritage archive' },

  { group: 'Schools', path: '/schools/picc-secondary', label: 'PICC Secondary School' },
  { group: 'Schools', path: '/schools/hope-school', label: 'Hope School of Ministry' },
  { group: 'Schools', path: '/schools/discipleship', label: 'School of Discipleship' },
  { group: 'Schools', path: '/schools/hope-school/events', label: 'Hope School events' },
  { group: 'Schools', path: '/schools/discipleship/events', label: 'Discipleship events' },
  { group: 'Schools', path: '/schools/hope-school/online-classes', label: 'Hope School online classes' },

  { group: 'Resources', path: '/media', label: 'Media' },
  { group: 'Resources', path: '/media/archive', label: 'Media archive' },
  { group: 'Resources', path: '/forms', label: 'Forms' },
  { group: 'Resources', path: '/locations', label: 'Church locations' },
  { group: 'Resources', path: '/home-churches', label: 'Home churches' },
  { group: 'Resources', path: '/sermons', label: 'Sermons' },
  { group: 'Resources', path: '/sermons/archive', label: 'Sermons archive' },
  { group: 'Resources', path: '/devotions', label: 'Devotions' },
  { group: 'Resources', path: '/quotes', label: 'Quotes' },
  { group: 'Resources', path: '/video-declarations', label: 'Video declarations' },
  { group: 'Resources', path: '/testimonies', label: 'Testimonies' },
  { group: 'Resources', path: '/prayer', label: 'Prayer requests' },

  { group: 'Careers & store', path: '/careers', label: 'Careers (open positions)' },
  { group: 'Careers & store', path: '/careers/portal', label: 'Careers applicant portal' },
  { group: 'Careers & store', path: '/store', label: 'Store' },
  { group: 'Careers & store', path: '/store/library', label: 'Store library' },
  { group: 'Careers & store', path: '/store/checkout', label: 'Store checkout' },
];

const pathSet = new Set(PUBLIC_SITE_PAGES.map((page) => page.path));

export function findPublicSitePageByPath(path: string): PublicSitePage | undefined {
  const normalized = normalizePublicPath(path);
  return PUBLIC_SITE_PAGES.find((page) => page.path === normalized);
}

/** Match stored link to a known page path (relative or same-site absolute URL). */
export function normalizePublicPath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) {
    const withoutQuery = trimmed.split(/[?#]/)[0] || trimmed;
    return withoutQuery.endsWith('/') && withoutQuery.length > 1
      ? withoutQuery.slice(0, -1)
      : withoutQuery;
  }
  try {
    const url = new URL(trimmed);
    return normalizePublicPath(url.pathname);
  } catch {
    return trimmed;
  }
}

export function isKnownPublicSitePath(value: string): boolean {
  const normalized = normalizePublicPath(value);
  return pathSet.has(normalized);
}

export function publicSitePagesByGroup(): Map<string, PublicSitePage[]> {
  const map = new Map<string, PublicSitePage[]>();
  for (const page of PUBLIC_SITE_PAGES) {
    const list = map.get(page.group) ?? [];
    list.push(page);
    map.set(page.group, list);
  }
  return map;
}
