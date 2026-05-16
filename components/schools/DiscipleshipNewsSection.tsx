import NewsSection, { type NewsSectionItem } from '@/components/NewsSection';
import { apiUrl } from '@/lib/api';
import { DISCIPLESHIP_NEWS } from '@/components/schools/schoolNewsFallbacks';

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

async function getDiscipleshipNews(): Promise<NewsSectionItem[]> {
  try {
    const response = await fetch(apiUrl('/api/schools/discipleship/news'), {
      cache: 'no-store',
    });

    if (!response.ok) {
      return DISCIPLESHIP_NEWS;
    }

    const data = (await response.json().catch(() => null)) as { news?: ApiSchoolNewsItem[] } | null;
    const news = Array.isArray(data?.news) ? data.news : [];

    if (news.length === 0) {
      return DISCIPLESHIP_NEWS;
    }

    return news.map((item, index) => ({
      badge: item.badge?.trim() || 'Updates',
      date: item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Latest',
      title: item.title?.trim() || `Discipleship News ${index + 1}`,
      description: item.content?.trim() || 'New update available.',
      image: normalizeImageUrl(item.imageUrl) || DISCIPLESHIP_NEWS[index % DISCIPLESHIP_NEWS.length]?.image || '/hero/hero-8.JPG',
    }));
  } catch {
    return DISCIPLESHIP_NEWS;
  }
}

export default async function DiscipleshipNewsSection() {
  const items = await getDiscipleshipNews();

  return (
    <NewsSection
      kicker="Updates"
      title="Discipleship News"
      description="Updates and highlights from the School of Discipleship."
      items={items}
      backgroundClassName="bg-[#eef4fb]"
    />
  );
}
