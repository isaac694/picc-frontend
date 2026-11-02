'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Eye, Facebook, Link2, Loader2, MessageCircle } from 'lucide-react';
import { resolveMediaImageUrl } from '@/lib/api';
import {
  fetchNewsArticle,
  formatNewsDate,
  newsImage,
  newsScopeLabel,
  recordNewsView,
  type NewsArticle,
} from '@/lib/news';

export default function NewsArticleClient({ slug }: { slug: string }) {
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [related, setRelated] = useState<NewsArticle[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchNewsArticle(slug).then((result) => {
      if (!alive) return;
      if (!result) {
        setState('missing');
        return;
      }
      setArticle(result.article);
      setRelated(result.related);
      setState('ready');
      recordNewsView(slug);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  if (state === 'loading') {
    return <div className="flex justify-center py-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (state === 'missing' || !article) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-40 text-center">
        <h1 className="font-display text-4xl font-semibold">Story not found</h1>
        <p className="mt-4 text-foreground/65">This story may have been moved or is no longer available.</p>
        <Link href="/news" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to news
        </Link>
      </div>
    );
  }

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const paragraphs = String(article.content || article.excerpt).split(/\n{2,}|\r\n\r\n/).map((block) => block.trim()).filter(Boolean);
  const backHref = article.scope === 'church' ? '/news' : `/news?scope=${article.scope}`;

  return (
    <article>
      <header className="mx-auto max-w-4xl px-4 pb-10 pt-28 text-center sm:px-6 sm:pt-32">
        <Link href={backHref} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-foreground/55 hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> {newsScopeLabel(article.scope)}
        </Link>
        <p className="mt-8">
          <span className="rounded-sm bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-secondary-foreground">
            {article.category}
          </span>
        </p>
        <h1 className="font-display mt-6 text-4xl font-semibold leading-[1.1] text-foreground md:text-6xl">{article.title}</h1>
        {article.excerpt ? <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-foreground/65">{article.excerpt}</p> : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium uppercase tracking-[0.18em] text-foreground/55">
          {article.author ? <span>By {article.author}</span> : null}
          <span>{formatNewsDate(article.publishedAt)}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{article.readMinutes} min read</span>
          <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{(article.views + 1).toLocaleString()} views</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-sm">
          <img src={newsImage(article)} alt={article.title} className="animate-ken-burns aspect-[16/8] w-full object-cover" />
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[80px_1fr_260px]">
        <aside className="order-2 flex gap-3 lg:order-1 lg:flex-col">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Share on Facebook"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-foreground/15 bg-white hover:border-primary hover:text-primary"
          >
            <Facebook className="h-4 w-4" />
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${article.title} ${pageUrl}`)}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Share on WhatsApp"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-foreground/15 bg-white hover:border-primary hover:text-primary"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          <button
            type="button"
            aria-label="Copy link"
            onClick={() => {
              void navigator.clipboard?.writeText(pageUrl).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              });
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-foreground/15 bg-white hover:border-primary hover:text-primary"
          >
            <Link2 className="h-4 w-4" />
          </button>
          {copied ? <span className="self-center text-xs text-primary">Copied</span> : null}
        </aside>

        <div className="order-1 lg:order-2">
          <div className="space-y-6 text-[1.075rem] leading-8 text-foreground/85 first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-6xl first-letter:font-semibold first-letter:leading-[0.85] first-letter:text-primary">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="whitespace-pre-wrap">{paragraph}</p>
            ))}
          </div>

          {article.gallery.length ? (
            <div className="mt-12 grid gap-3 sm:grid-cols-2" data-reveal-stagger>
              {article.gallery.map((url) => (
                <a key={url} href={resolveMediaImageUrl(url) || url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-sm">
                  <img src={resolveMediaImageUrl(url) || url} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {related.length ? (
          <aside className="order-3 border-t-2 border-foreground/80 pt-4 lg:border-t-0 lg:pt-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-foreground/50">Read next</p>
            <div className="mt-4 divide-y divide-foreground/15">
              {related.map((item) => (
                <Link key={item.id} href={`/news/${item.slug}`} className="group block py-4">
                  <img src={newsImage(item)} alt="" className="mb-3 aspect-[16/10] w-full rounded-sm object-cover" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{item.category}</p>
                  <h3 className="font-display mt-1 font-semibold leading-snug group-hover:text-primary">{item.title}</h3>
                  <p className="mt-1 text-xs text-foreground/50">{formatNewsDate(item.publishedAt, 'short')}</p>
                </Link>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </article>
  );
}
