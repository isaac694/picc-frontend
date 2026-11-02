'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BookOpen, Download, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Publication = {
  title: string;
  /** Issue line or author. */
  meta: string;
  description?: string;
  cover: string;
  file?: string;
};

/**
 * Spotlights the newest publication as a large 3D cover and lines up earlier ones on a shelf.
 * Picking a shelf item brings it into the spotlight.
 */
export default function PublicationShowcase({
  kicker,
  title,
  description,
  items,
  tone = 'dark',
  archiveHref,
  archiveLabel = 'View the full archive',
  label,
}: {
  kicker: string;
  title: string;
  description: string;
  items: Publication[];
  tone?: 'dark' | 'light';
  archiveHref?: string;
  archiveLabel?: string;
  /** Small label on the spotlight, e.g. "Latest volume". */
  label: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex] || items[0];
  const dark = tone === 'dark';

  if (!active) return null;

  return (
    <section className={cn('relative overflow-hidden py-20 md:py-28', dark ? 'bg-[#0f1c2e] text-white' : 'bg-[#f4efe6] text-foreground')}>
      <div
        className={cn(
          'pointer-events-none absolute inset-0',
          dark
            ? 'bg-[radial-gradient(circle_at_75%_30%,rgba(212,175,55,0.18),transparent_55%)]'
            : 'bg-[radial-gradient(circle_at_20%_20%,rgba(30,58,95,0.10),transparent_55%)]',
        )}
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className={cn('text-xs font-semibold uppercase tracking-[0.45em]', dark ? 'text-secondary' : 'text-primary/70')}>{kicker}</p>
            <h2 className="font-display mt-3 text-4xl font-semibold leading-tight md:text-6xl">{title}</h2>
            <p className={cn('mt-4 leading-7', dark ? 'text-white/70' : 'text-foreground/65')}>{description}</p>
          </div>
          {archiveHref ? (
            <Link
              href={archiveHref}
              className={cn(
                'inline-flex items-center gap-2 border-b-2 pb-1 text-xs font-bold uppercase tracking-[0.25em] transition-colors',
                dark ? 'border-secondary text-secondary hover:text-white' : 'border-primary text-primary hover:text-foreground',
              )}
            >
              {archiveLabel}
            </Link>
          ) : null}
        </div>

        <div className="mt-14 grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex justify-center [perspective:1600px]">
            <div className="animate-soft-float relative">
              <div
                key={active.cover}
                className="relative w-[240px] overflow-hidden rounded-r-lg rounded-l-sm shadow-[25px_35px_60px_-15px_rgba(0,0,0,0.55)] transition-transform duration-700 [transform:rotateY(-18deg)] hover:[transform:rotateY(-6deg)] sm:w-[300px]"
              >
                <img src={active.cover} alt={active.title} className="aspect-[3/4] w-full object-cover" />
                <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/45 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/25" />
              </div>
              <div className={cn('mx-auto mt-6 h-4 w-[80%] rounded-full blur-xl', dark ? 'bg-black/60' : 'bg-black/20')} />
            </div>
          </div>

          <div>
            <span className={cn('inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em]', dark ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground')}>
              {activeIndex === 0 ? label : 'From the archive'}
            </span>
            <h3 className="font-display mt-5 text-3xl font-semibold leading-tight md:text-5xl">{active.title}</h3>
            {active.meta ? <p className={cn('mt-3 text-sm font-semibold uppercase tracking-[0.25em]', dark ? 'text-white/55' : 'text-foreground/50')}>{active.meta}</p> : null}
            {active.description ? <p className={cn('mt-5 max-w-xl text-lg leading-8', dark ? 'text-white/75' : 'text-foreground/70')}>{active.description}</p> : null}
            <div className="mt-8 flex flex-wrap gap-3">
              {active.file ? (
                <>
                  <a
                    href={active.file}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5',
                      dark ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground',
                    )}
                  >
                    <Eye className="h-4 w-4" /> Read now
                  </a>
                  <a
                    href={active.file}
                    download
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-semibold transition-colors',
                      dark ? 'border-white/30 hover:bg-white/10' : 'border-foreground/20 hover:bg-foreground/5',
                    )}
                  >
                    <Download className="h-4 w-4" /> Download PDF
                  </a>
                </>
              ) : (
                <span className={cn('inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-semibold', dark ? 'border-white/20 text-white/60' : 'border-foreground/15 text-foreground/50')}>
                  <BookOpen className="h-4 w-4" /> Full issue coming soon
                </span>
              )}
            </div>
          </div>
        </div>

        {items.length > 1 ? (
          <div className="mt-20">
            <p className={cn('text-[11px] font-bold uppercase tracking-[0.3em]', dark ? 'text-white/50' : 'text-foreground/50')}>On the shelf</p>
            <div className={cn('mt-6 flex gap-6 overflow-x-auto pb-6 [scrollbar-width:thin]', dark ? 'border-b-8 border-[#24364f]' : 'border-b-8 border-[#d9cdb8]')}>
              {items.map((item, index) => (
                <button
                  key={`${item.title}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="group w-32 shrink-0 text-left sm:w-40"
                  aria-label={`Show ${item.title}`}
                >
                  <div
                    className={cn(
                      'overflow-hidden rounded-r-md rounded-l-sm shadow-lg transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-2xl',
                      index === activeIndex && (dark ? 'ring-2 ring-secondary ring-offset-4 ring-offset-[#0f1c2e]' : 'ring-2 ring-primary ring-offset-4 ring-offset-[#f4efe6]'),
                    )}
                  >
                    <img src={item.cover} alt="" className="aspect-[3/4] w-full object-cover" />
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug">{item.title}</p>
                  {item.meta ? <p className={cn('mt-1 text-xs', dark ? 'text-white/50' : 'text-foreground/50')}>{item.meta}</p> : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
