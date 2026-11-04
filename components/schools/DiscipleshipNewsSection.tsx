import NewsFeed from '@/components/news/NewsFeed';
import { DISCIPLESHIP_NEWS } from '@/components/schools/schoolNewsFallbacks';

// Uses the main news feed so school stories look and behave like church news.
export default function DiscipleshipNewsSection() {
  return (
    <NewsFeed
      scope="discipleship"
      kicker="Updates"
      title="Discipleship News"
      description="Updates and highlights from the School of Discipleship."
      fallbackItems={DISCIPLESHIP_NEWS}
      allHref="/news?scope=discipleship"
      allLabel="All Discipleship news"
    />
  );
}
