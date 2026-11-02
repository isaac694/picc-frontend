'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import NewsFeed from '@/components/news/NewsFeed';
import { DEFAULT_MEDIA_NEWS } from '@/lib/mediaDefaults';
import { NEWS_SCOPES, newsScopeLabel } from '@/lib/news';
import { cn } from '@/lib/utils';

const CHURCH_FALLBACK = DEFAULT_MEDIA_NEWS.map((item) => ({
  badge: item.badge,
  date: item.date,
  title: item.title,
  description: item.description,
  image: item.imageUrl,
}));

export default function NewsIndexClient() {
  const searchParams = useSearchParams();
  const requested = searchParams.get('scope') || 'church';
  const scope = NEWS_SCOPES.some((entry) => entry.key === requested) ? requested : 'church';

  return (
    <>
      <section className="relative overflow-hidden bg-primary pb-16 pt-28 text-white sm:pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(212,175,55,0.25),transparent_45%),radial-gradient(circle_at_90%_100%,rgba(75,123,167,0.6),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/70">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="text-white/40">/</span>
            <span>News</span>
          </div>
          <h1 className="font-display mt-6 text-5xl font-semibold leading-none md:text-7xl">The PICC Herald</h1>
          <p className="mt-5 max-w-2xl text-white/75">
            Stories, announcements and highlights from Pentecost International Christian Centre and its ministries.
          </p>
          <nav className="mt-10 flex flex-wrap gap-2" aria-label="News sections">
            {NEWS_SCOPES.map((entry) => (
              <Link
                key={entry.key}
                href={entry.key === 'church' ? '/news' : `/news?scope=${entry.key}`}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition-colors',
                  scope === entry.key ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-white/25 text-white/80 hover:bg-white/10',
                )}
              >
                {entry.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>
      <NewsFeed
        key={scope}
        scope={scope}
        kicker={scope === 'church' ? 'Church news' : 'Ministry news'}
        title={newsScopeLabel(scope)}
        fallbackItems={scope === 'church' ? CHURCH_FALLBACK : []}
        limit={13}
        showFilters
        showPagination
      />
    </>
  );
}
