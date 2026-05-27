import NewsSection, { type NewsSectionItem } from '@/components/NewsSection';
import { apiUrl } from '@/lib/api';
import { HOPE_SCHOOL_NEWS } from '@/components/schools/schoolNewsFallbacks';

type ApiSchoolNewsItem = {
  badge?: string | null;
  title?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  createdAt?: string | null;
};

const normalizeImageUrl = (value: string | null | undefined) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  return trimmed.startsWith('http') ? trimmed : apiUrl(trimmed);
};

async function getHopeSchoolNews(): Promise<NewsSectionItem[]> {
  try {
    const response = await fetch(apiUrl('/api/schools/hope-school/news'), {
      cache: 'no-store',
    });

    if (!response.ok) {
      return HOPE_SCHOOL_NEWS;
    }

    const data = (await response.json().catch(() => null)) as { news?: ApiSchoolNewsItem[] } | null;
    const news = Array.isArray(data?.news) ? data.news : [];

    if (news.length === 0) {
      return HOPE_SCHOOL_NEWS;
    }

    return news.map((item, index) => ({
      badge: item.badge?.trim() || 'Updates',
      date: item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Latest',
      title: item.title?.trim() || `Hope School News ${index + 1}`,
      description: item.content?.trim() || 'New update available.',
      image: normalizeImageUrl(item.imageUrl) || HOPE_SCHOOL_NEWS[index % HOPE_SCHOOL_NEWS.length]?.image || '/hero/hero-4.JPG',
    }));
  } catch {
    return HOPE_SCHOOL_NEWS;
  }
}

export default async function HopeSchoolNewsSection() {
  const items = await getHopeSchoolNews();

  return (
    <NewsSection
      kicker="Updates"
      title="Hope School News"
      description="Updates and reminders for Hope School students, volunteers, and leadership."
      items={items}
      backgroundClassName="bg-[#eef4fb]"
    />
  );
}
