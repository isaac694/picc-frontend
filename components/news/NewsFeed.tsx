'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock, Eye, Loader2, Search, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { NewsSectionItem } from '@/components/NewsSection';
import {
  fallbackNewsToArticles,
  fetchNews,
  formatNewsDate,
  newsImage,
  type NewsArticle,
} from '@/lib/news';
import { cn } from '@/lib/utils';

type NewsFeedProps = {
  scope: string;
  kicker?: string;
  title?: string;
  description?: string;
  /** Shown until the first real article is published for this scope. */
  fallbackItems?: NewsSectionItem[];
  /** How many stories to show (lead + headlines + grid). */
  limit?: number;
  showFilters?: boolean;
  showPagination?: boolean;
  allHref?: string;
  allLabel?: string;
  className?: string;
};

function storyHref(article: NewsArticle) {
  return article.isFallback ? null : `/news/${article.slug}`;
}

function Meta({ article, light = false }: { article: NewsArticle; light?: boolean }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium uppercase tracking-[0.18em]', light ? 'text-white/75' : 'text-foreground/55')}>
      <span>{formatNewsDate(article.publishedAt)}</span>
      {!article.isFallback ? (
        <>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{article.readMinutes} min read</span>
          {article.views > 0 ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{article.views.toLocaleString()}</span>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function CategoryTag({ label, solid = false }: { label: string; solid?: boolean }) {
  return (
    <span className={cn(
      'inline-flex w-fit items-center rounded-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em]',
      solid ? 'bg-secondary text-secondary-foreground' : 'bg-primary/8 text-primary',
    )}>
      {label}
    </span>
  );
}

function StoryLink({
  article,
  onOpen,
  className,
  children,
}: {
  article: NewsArticle;
  onOpen: (article: NewsArticle) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const href = storyHref(article);
  if (href) return <Link href={href} className={className}>{children}</Link>;
  return (
    <button type="button" onClick={() => onOpen(article)} className={cn('text-left', className)}>
      {children}
    </button>
  );
}

export default function NewsFeed({
  scope,
  kicker = "What's happening",
  title = 'Latest News',
  description,
  fallbackItems = [],
  limit = 7,
  showFilters = false,
  showPagination = false,
  allHref,
  allLabel = 'View all news',
  className,
}: NewsFeedProps) {
  const fallback = useMemo(() => fallbackNewsToArticles(scope, fallbackItems), [scope, fallbackItems]);
  const [articles, setArticles] = useState<NewsArticle[]>(fallback);
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
  const [category, setCategory] = useState('All');
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(true);
  const [reader, setReader] = useState<NewsArticle | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchNews({ scope, page, limit, category, q: query }).then((result) => {
      if (!alive) return;
      setLoading(false);
      if (!result || (!result.hasArticles && !query && category === 'All')) {
        setUsingFallback(true);
        setArticles(fallback);
        setCategories([]);
        setPages(1);
        return;
      }
      setUsingFallback(false);
      setArticles(result.articles);
      setCategories(result.categories);
      setPages(result.pages);
    });
    return () => {
      alive = false;
    };
  }, [scope, page, limit, category, query, fallback]);

  const visible = usingFallback ? articles.slice(0, limit) : articles;
  const lead = visible[0];
  const headlines = visible.slice(1, 4);
  const rest = visible.slice(4);

  const today = useMemo(
    () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    [],
  );

  return (
    <section className={cn('bg-[#f7f5f0] py-16 sm:py-20 md:py-24', className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Masthead */}
        <div className="border-b-2 border-foreground/80 pb-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-primary/70">{kicker}</p>
              <h2 className="font-display mt-2 text-4xl font-semibold leading-none text-foreground md:text-6xl">{title}</h2>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/50">{today}</p>
          </div>
          {description ? <p className="mt-4 max-w-2xl text-sm leading-6 text-foreground/65">{description}</p> : null}
        </div>

        {showFilters && !usingFallback ? (
          <div className="flex flex-col gap-4 border-b border-foreground/15 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-1">
              {['All', ...categories.map((entry) => entry.name)].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setCategory(name);
                    setPage(1);
                  }}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition-colors',
                    category === name ? 'bg-foreground text-background' : 'text-foreground/65 hover:bg-foreground/5',
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setQuery(queryInput.trim());
                setPage(1);
              }}
              className="flex items-center gap-2 rounded-full border border-foreground/15 bg-white px-4 py-2"
            >
              <Search className="h-4 w-4 text-foreground/45" />
              <input
                type="search"
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                placeholder="Search news"
                className="w-44 bg-transparent text-sm outline-none placeholder:text-foreground/40"
                aria-label="Search news"
              />
              {query ? (
                <button type="button" aria-label="Clear search" onClick={() => { setQuery(''); setQueryInput(''); }}>
                  <X className="h-4 w-4 text-foreground/45" />
                </button>
              ) : null}
            </form>
          </div>
        ) : null}

        {loading && !lead ? (
          <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : !lead ? (
          <p className="py-20 text-center text-sm text-foreground/60">
            {query || category !== 'All' ? 'No stories match your search.' : 'News will appear here soon.'}
          </p>
        ) : (
          <>
            {/* Lead story + headlines */}
            <div className="grid gap-10 pt-8 lg:grid-cols-[1.65fr_1fr]">
              <StoryLink article={lead} onOpen={setReader} className="group block">
                <article>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-sm bg-foreground/5">
                    <img
                      src={newsImage(lead)}
                      alt={lead.title}
                      className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                    />
                    <div className="absolute left-4 top-4"><CategoryTag label={lead.category} solid /></div>
                  </div>
                  <h3 className="font-display mt-6 text-3xl font-semibold leading-tight text-foreground decoration-secondary decoration-2 underline-offset-[6px] group-hover:underline md:text-[2.6rem]">
                    {lead.title}
                  </h3>
                  {lead.excerpt ? <p className="mt-4 max-w-3xl text-base leading-7 text-foreground/70 md:text-lg">{lead.excerpt}</p> : null}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <Meta article={lead} />
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Read the story <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </article>
              </StoryLink>

              {headlines.length ? (
                <div className="divide-y divide-foreground/15 border-t border-foreground/15 lg:border-l lg:border-t-0 lg:pl-10" data-reveal-stagger>
                  <p className="pb-3 pt-4 text-[11px] font-bold uppercase tracking-[0.3em] text-foreground/50 lg:pt-0">Top stories</p>
                  {headlines.map((article) => (
                    <StoryLink key={article.id} article={article} onOpen={setReader} className="group block py-5">
                      <article className="grid grid-cols-[1fr_96px] gap-4">
                        <div>
                          <CategoryTag label={article.category} />
                          <h4 className="font-display mt-2 text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
                            {article.title}
                          </h4>
                          <div className="mt-2"><Meta article={article} /></div>
                        </div>
                        <div className="aspect-square overflow-hidden rounded-sm bg-foreground/5">
                          <img src={newsImage(article)} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        </div>
                      </article>
                    </StoryLink>
                  ))}
                </div>
              ) : null}
            </div>

            {rest.length ? (
              <div className="mt-14 border-t-2 border-foreground/80 pt-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-foreground/50">More stories</p>
                <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>
                  {rest.map((article) => (
                    <StoryLink key={article.id} article={article} onOpen={setReader} className="group block">
                      <article className="hover-lift h-full rounded-sm bg-white p-3 pb-5">
                        <div className="aspect-[4/3] overflow-hidden rounded-sm bg-foreground/5">
                          <img src={newsImage(article)} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        </div>
                        <div className="px-2 pt-4">
                          <CategoryTag label={article.category} />
                          <h4 className="font-display mt-3 text-xl font-semibold leading-snug text-foreground group-hover:text-primary">{article.title}</h4>
                          {article.excerpt ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-foreground/65">{article.excerpt}</p> : null}
                          <div className="mt-3"><Meta article={article} /></div>
                        </div>
                      </article>
                    </StoryLink>
                  ))}
                </div>
              </div>
            ) : null}

            {showPagination && !usingFallback && pages > 1 ? (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="rounded-full border border-foreground/20 px-5 py-2 text-sm font-semibold disabled:opacity-40"
                >
                  Newer
                </button>
                <span className="px-3 text-sm text-foreground/60">Page {page} of {pages}</span>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((value) => Math.min(pages, value + 1))}
                  className="rounded-full border border-foreground/20 px-5 py-2 text-sm font-semibold disabled:opacity-40"
                >
                  Older
                </button>
              </div>
            ) : null}

            {allHref ? (
              <div className="mt-12 text-center">
                <Link
                  href={allHref}
                  className="inline-flex items-center gap-2 border-b-2 border-foreground pb-1 text-sm font-bold uppercase tracking-[0.22em] text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {allLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
          </>
        )}
      </div>

      <Dialog open={Boolean(reader)} onOpenChange={(open) => !open && setReader(null)}>
        <DialogContent className="max-h-[90vh] max-w-[calc(100%-2rem)] overflow-y-auto rounded-sm p-0 md:max-w-3xl">
          {reader ? (
            <article>
              <img src={newsImage(reader)} alt={reader.title} className="aspect-[16/9] w-full object-cover" />
              <div className="p-6 sm:p-10">
                <DialogHeader className="text-left">
                  <CategoryTag label={reader.category} />
                  <DialogTitle className="font-display mt-3 text-3xl font-semibold leading-tight">{reader.title}</DialogTitle>
                  <DialogDescription className="text-xs uppercase tracking-[0.2em]">{formatNewsDate(reader.publishedAt)}</DialogDescription>
                </DialogHeader>
                <p className="mt-6 whitespace-pre-wrap text-base leading-8 text-foreground/80">{reader.content || reader.excerpt}</p>
              </div>
            </article>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
