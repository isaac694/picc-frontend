'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DevotionReadMore from '@/components/DevotionReadMore';

function isLocalUpstreamImage(url?: string | null) {
  if (!url) return false;
  return url.includes('://localhost') || url.includes('://127.0.0.1') || url.includes('://[::1]');
}

type Devotion = {
  id: string | number;
  title?: string | null;
  publishAt?: string | null;
  content?: string | string[] | null;
};

type Confession = {
  id: string;
  title: string;
  imageUrl: string;
  publishAt?: string | null;
};

type Props = {
  devotions: Devotion[];
  confessions: Confession[];
  showDebug: boolean;
  debugMessage?: string;
};

const formatLongDate = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
};

const toDateStart = (yyyyMmDd: string) => new Date(`${yyyyMmDd}T00:00:00`);
const toDateEnd = (yyyyMmDd: string) => new Date(`${yyyyMmDd}T23:59:59.999`);

const getMonthRange = (mode: 'this' | 'last') => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startMonth = mode === 'last' ? month - 1 : month;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 1, 0);
  const toInput = (d: Date) => d.toISOString().slice(0, 10);
  return { from: toInput(start), to: toInput(end) };
};

export default function DevotionsArchiveClient({
  devotions,
  confessions,
  showDebug,
  debugMessage,
}: Props) {
  const [selectedDate, setSelectedDate] = useState('');
  const [includeUndated, setIncludeUndated] = useState(false);

  const isFiltering = Boolean(selectedDate);

  const filteredDevotions = useMemo(() => {
    if (!isFiltering) return devotions;
    const target = toDateStart(selectedDate);
    const targetEnd = toDateEnd(selectedDate);

    return devotions.filter((devotion) => {
      if (!devotion.publishAt) return includeUndated;
      const date = new Date(devotion.publishAt);
      if (Number.isNaN(date.getTime())) return includeUndated;
      return date >= target && date <= targetEnd;
    });
  }, [devotions, includeUndated, isFiltering, selectedDate]);

  const filteredConfessions = useMemo(() => {
    if (!isFiltering) return confessions;
    const target = toDateStart(selectedDate);
    const targetEnd = toDateEnd(selectedDate);

    return confessions.filter((confession) => {
      if (!confession.publishAt) return includeUndated;
      const date = new Date(confession.publishAt);
      if (Number.isNaN(date.getTime())) return includeUndated;
      return date >= target && date <= targetEnd;
    });
  }, [confessions, includeUndated, isFiltering, selectedDate]);

  const devotionMissingDates = useMemo(
    () => devotions.filter((d) => !d.publishAt).length,
    [devotions],
  );
  const confessionMissingDates = useMemo(
    () => confessions.filter((c) => !c.publishAt).length,
    [confessions],
  );

  return (
    <main className="min-h-screen">
      <section className="py-16 sm:py-20 md:py-24 bg-[linear-gradient(180deg,#fffaf0_0%,#fff6ec_100%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-3">
              Archives
            </p>
            <h1 className="text-3xl md:text-5xl font-semibold text-foreground mb-4">
              Devotions & Confessions
            </h1>
            <p className="text-foreground/70 max-w-2xl">
              Select a date to view the devotion and confession for that day.
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div className="w-full md:w-64">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate('');
                    setIncludeUndated(false);
                  }}
                  className={`rounded-full px-6 py-3 border transition ${
                    !selectedDate 
                      ? 'bg-primary text-white border-primary shadow-md' 
                      : 'border-border/60 text-foreground hover:border-primary/60'
                  }`}
                >
                  Show All Dates
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10);
                    setSelectedDate(today);
                    setIncludeUndated(false);
                  }}
                  className={`rounded-full px-6 py-3 border transition ${
                    selectedDate === new Date().toISOString().slice(0, 10)
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'border-border/60 text-foreground hover:border-primary/60'
                  }`}
                >
                  Today
                </button>
              </div>
            </div>

            {isFiltering ? (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-foreground/70">
                  <input
                    type="checkbox"
                    checked={includeUndated}
                    onChange={(event) => setIncludeUndated(event.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  Include items missing dates
                </label>
                <p className="text-xs text-foreground/50">
                  Missing dates: {devotionMissingDates} devotion(s), {confessionMissingDates}{' '}
                  confession(s)
                </p>
              </div>
            ) : null}

            {showDebug ? (
              <p className="mt-4 text-xs text-foreground/50">
                Debug: {debugMessage}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
            {/* Confessions Column */}
            <div id="confessions">
              <div className="mb-10">
                <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-3">
                  Declarations
                </p>
                <h2 className="text-3xl md:text-5xl font-semibold text-foreground mb-4">
                  Confession Archive
                </h2>
                <p className="text-foreground/70">
                  Showing {filteredConfessions.length} confession(s).
                </p>
              </div>

              <div className="space-y-6">
                {filteredConfessions.length === 0 ? (
                  <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
                    <p className="text-foreground/70">
                      No confessions match that date.
                    </p>
                  </div>
                ) : (
                  filteredConfessions.map((confession) => (
                    <article
                      key={confession.id}
                      className="rounded-[24px] border border-primary/10 bg-white p-6 sm:p-8 shadow-xl"
                    >
                      <p className="text-xs uppercase tracking-[0.3em] text-foreground/50 mb-2">
                        {formatLongDate(confession.publishAt) || 'Undated'}
                      </p>
                      <h3 className="text-xl font-semibold text-foreground mb-4">
                        {confession.title}
                      </h3>
                      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl border border-border/60 bg-white">
                        <Image
                          src={confession.imageUrl}
                          alt={confession.title || 'Confession Image'}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-contain"
                          unoptimized={isLocalUpstreamImage(confession.imageUrl)}
                        />
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>

            {/* Devotions Column */}
            <div>
              <div className="mb-10">
                <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-3">
                  Daily Devotions
                </p>
                <h2 className="text-3xl md:text-5xl font-semibold text-foreground mb-4">
                  All Devotions
                </h2>
                <p className="text-foreground/70">
                  Showing {filteredDevotions.length} devotion(s).
                </p>
              </div>

              <div className="space-y-6">
                {filteredDevotions.length === 0 ? (
                  <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
                    <p className="text-foreground/70">
                      No devotions match that date.
                    </p>
                    <div className="mt-4">
                      <Link href="/">
                        <span className="text-primary hover:underline">Return home</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  filteredDevotions.map((devotion) => (
                    <article
                      key={String(devotion.id)}
                      className="rounded-[24px] border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6 sm:p-8 shadow-xl"
                    >
                      <p className="text-xs uppercase tracking-[0.3em] text-foreground/50 mb-2">
                        {formatLongDate(devotion.publishAt) || 'Undated'}
                      </p>
                      <h3 className="text-xl font-semibold text-foreground mb-4">
                        {devotion.title || 'Daily Devotion'}
                      </h3>
                      <div className="mt-4 border-t border-primary/10 pt-6">
                        <DevotionReadMore content={devotion.content || ''} />
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link href="/">
              <span className="text-primary hover:underline text-lg font-medium">Return home</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
