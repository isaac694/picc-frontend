import NewsFeed from '@/components/news/NewsFeed';
import { HOPE_SCHOOL_NEWS } from '@/components/schools/schoolNewsFallbacks';

// Uses the main news feed so school stories look and behave like church news.
export default function HopeSchoolNewsSection() {
  return (
    <NewsFeed
      scope="hope-school"
      kicker="Updates"
      title="Hope School News"
      description="Updates and reminders for Hope School students, volunteers, and leadership."
      fallbackItems={HOPE_SCHOOL_NEWS}
      allHref="/news?scope=hope-school"
      allLabel="All Hope School news"
    />
  );
}
